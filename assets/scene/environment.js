import { fuelX } from './layout.js';
import * as T from './vendor/three.module.min.js';
import { Reflector } from './vendor/Reflector.js';
import { box, group, materials as m, mesh, shell, standard } from './model.js';

let seed = 761;
function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}

function asphalt() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const tone = 47 + Math.floor(random() * 39);
    pixels.data.set([tone * .79, tone, tone * .93, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(92, 92);
  return map;
}

export function environment(scene, high) {
  const groundGeometry = new T.PlaneGeometry(220, 220);
  if (high) {
    const reflector = new Reflector(groundGeometry, { color: 0x59615c, textureWidth: 640, textureHeight: 384 });
    reflector.rotation.x = -Math.PI / 2;
    reflector.userData.ignorePick = true;
    scene.add(reflector);
  }
  const surface = new T.MeshStandardMaterial({ map: asphalt(), roughness: .48,
    metalness: .34, transparent: high, opacity: high ? .77 : 1 });
  mesh(scene, groundGeometry, surface, 0, .012, 0).rotation.x = -Math.PI / 2;

  const lane = standard(0x889f85, .13, .74);
  const amber = standard(0xb8882e, .22, .54);
  const shoulder = standard(0x536d5d, .16, .74);
  for (let i = -23; i <= 23; i++) box(scene, lane, i * 4.3, .02, 11.75, 2.5, .012, .065);
  box(scene, shoulder, 0, .021, 16.55, 212, .013, .07);
  for (const x of [-68, 68]) box(scene, shoulder, x, .021, 7.35, 86, .013, .07);
  for (const x of [fuelX(-16), fuelX(-9), fuelX(-2), 9, 15, 19]) {
    box(scene, amber, x, .023, 4, .055, .014, 3.75);
  }
  for (const x of [-15, -7, 5.8, 11, 20]) {
    const z = x === 5.8 ? 4.4 : x === 20 ? -1 : -12.8;
    planter(scene, x, z, high);
  }
  mountainRanges(scene);
}

function mountainRanges(scene) {
  const foot = new T.Color(0x0b2825);
  const crest = new T.Color(0x386258);
  const faces = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    emissive: 0x0c211e,
    emissiveIntensity: .45,
    side: T.DoubleSide,
  });
  const sides = 9;
  for (const radius of [100, 126]) {
    for (let i = 0; i < 18; i++) {
      const angle = (i + .5) * Math.PI / 9;
      // Keep both ends of the east–west access road open.
      if (Math.abs(Math.sin(angle)) < .39) continue;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const width = 15 + random() * 10;
      const peak = 9 + random() * 14;
      const points = [], shoulders = [];
      for (let j = 0; j < sides; j++) {
        const a = j / sides * Math.PI * 2;
        const radial = .78 + random() * .32;
        const dx = Math.cos(a) * width * radial;
        const dz = Math.sin(a) * width * radial;
        points.push([x + dx, -1, z + dz]);
        shoulders.push([x + dx * .54, peak * (.28 + random() * .54), z + dz * .54]);
      }
      const summit = [x + (random() - .5) * width * .58, peak, z + (random() - .5) * width * .58];
      const slope = foot.clone().lerp(crest, .66);
      const vertices = [], colors = [];
      function facet(a, b, c, tones) {
        vertices.push(...a, ...b, ...c);
        const shade = .73 + random() * .27;
        for (const color of tones) colors.push(color.r * shade, color.g * shade, color.b * shade);
      }
      for (let j = 0; j < sides; j++) {
        const next = (j + 1) % sides;
        facet(points[j], shoulders[j], points[next], [foot, slope, foot]);
        facet(points[next], shoulders[j], shoulders[next], [foot, slope, slope]);
        facet(shoulders[j], summit, shoulders[next], [slope, crest, slope]);
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      mesh(scene, geometry, faces).userData.ignorePick = true;
    }
  }
}

function planter(scene, x, z, high) {
  const pot = group(scene, x, 0, z);
  shell(pot, m.base, 0, .19, 0, 3.3, 1.65, .36, .48, true);
  shell(pot, m.gold, 0, .12, 0, 3.34, 1.69, .022, .49, true);
  const dirt = standard(0x31372a, .03, .91);
  shell(pot, dirt, 0, .38, 0, 3, 1.37, .06, .45, true);
  const tree = standard(0x5f4630, .07, .83);
  mesh(pot, new T.CylinderGeometry(.053, .135, 2.6, 8), tree, 0, 1.6, 0);
  const leaves = [0x254c30, 0x37613a, 0x5c7137].map(color => standard(color, .04, .8));
  const foliage = new T.IcosahedronGeometry(1, 1);
  for (let i = 0; i < (high ? 31 : 16); i++) {
    const a = random() * Math.PI * 2, r = random();
    const height = 1.85 + random() * 1.65;
    const leaf = mesh(pot, foliage, leaves[i % 3], Math.cos(a) * r, height, Math.sin(a) * r * .72);
    leaf.scale.set(.27 + r * .28, .4 + r * .24, .3 + r * .22);
    leaf.rotation.set(random(), a, random());
  }
  for (let i = 0; i < 12; i++) {
    const bush = mesh(pot, foliage, leaves[i % 3], -1.35 + random() * 2.7, .52, (random() - .5) * 1.2);
    bush.scale.set(.28, .24 + random() * .23, .27);
  }
}

export function sky(scene) {
  const shader = new T.ShaderMaterial({
    uniforms: { day: { value: 0 } },
    side: T.BackSide,
    depthWrite: false,
    vertexShader: 'varying vec3 direction; void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `
      varying vec3 direction;
      uniform float day;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
      }
      void main(){
        vec3 d=normalize(direction);
        float horizon=smoothstep(-.12,.5,d.y);
        vec3 c=mix(vec3(.035,.20,.17),vec3(.006,.039,.034),horizon);
        vec2 p=d.xz/(.38+max(d.y,0.))*vec2(8.,11.);
        float cloud=smoothstep(.39,.74,noise(p)*.65+noise(p*2.2)*.25+noise(p*5.)*.1);
        c*=1.-cloud*.53*smoothstep(0.,.11,d.y);
        vec3 daylight=mix(vec3(.69,.77,.72),vec3(.19,.48,.61),horizon)-cloud*.10;
        gl_FragColor=vec4(mix(c,daylight,day),1.);
      }`,
  });
  const dome = mesh(scene, new T.SphereGeometry(155, 28, 16), shader);
  dome.userData.ignorePick = true;
  return shader.uniforms.day;
}

export function lighting(scene) {
  const ambient = new T.HemisphereLight(0xa0d4c6, 0x535031, 1.65);
  const moon = new T.DirectionalLight(0x9bddcd, 1.4);
  moon.position.set(-11, 17, 12);
  scene.add(ambient, moon);
  const warm = [];
  for (const [x, y, z, intensity] of [[fuelX(-9), 4.6, 1.2, 88], [fuelX(0), 4.4, 1.3, 83],
    [11.7, 3.5, .7, 62], [-3, 3.4, -7.5, 95], [4.7, 3.45, -7.1, 108], [5.8, .48, 4.95, 18]]) {
    const source = new T.PointLight(0xffcf7f, intensity, 20, 2);
    source.position.set(x, y, z);
    scene.add(source);
    warm.push([source, intensity]);
  }
  return day => {
    ambient.intensity = day ? 2.45 : 1.65;
    moon.intensity = day ? 3.1 : 1.4;
    moon.color.setHex(day ? 0xfff3df : 0x9bddcd);
    for (const [source, intensity] of warm) source.intensity = day ? intensity * .19 : intensity;
  };
}

export function studioReflections(renderer, scene) {
  const rig = new T.Scene();
  rig.background = new T.Color(0x122c28);
  const softbox = new T.MeshBasicMaterial({ color: 0xffd879, side: T.DoubleSide });
  const bounce = new T.MeshBasicMaterial({ color: 0x60a88e, side: T.DoubleSide });
  box(rig, softbox, 0, 6, 0, 16, .03, 5);
  box(rig, bounce, 0, 2.5, -8, 13, 2.1, .03);
  box(rig, softbox, 0, 2.5, 9, 14, .75, .03);
  const pmrem = new T.PMREMGenerator(renderer);
  const map = pmrem.fromScene(rig, .035);
  scene.environment = map.texture;
  scene.environmentIntensity = .46;
  pmrem.dispose();
  softbox.dispose();
  bounce.dispose();
  return map;
}
