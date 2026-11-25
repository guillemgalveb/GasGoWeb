# Escena de la estación Gas&Go

La portada sirve HTML, CSS y módulos ES desde la raíz del repositorio. Las rutas relativas permiten publicarla en un subdirectorio de GitHub Pages. Para probarla, ejecuta `python -m http.server 8080` en la raíz y abre `http://localhost:8080`.

- `experience.js` conecta la interfaz, las fichas y la alternativa para dispositivos sin WebGL 2.
- `station.js` configura la cámara, los controles, la detección de objetos y el renderizado.
- `services.js` contiene los textos, el encuadre por servicio y las coordenadas de cada marcador. `anchor` y `target` usan unidades de la escena. `poster` usa coordenadas normalizadas respecto a la imagen.
- `model.js`, `vehicles.js` y `environment.js` contienen la arquitectura, los vehículos y sus materiales, el paisajismo y la iluminación.

Three.js 0.183.2, OrbitControls y Reflector proceden del [paquete oficial en npm](https://www.npmjs.com/package/three/v/0.183.2). Se sirven desde `vendor/` y se aplica la [licencia MIT](vendor/LICENSE). Los dos complementos importan el módulo local. Los modelos y las texturas de la estación se generan en el navegador. La imagen `../images/station-poster.webp` se renderizó desde la vista inicial del modelo. El logo y Roboto proceden de los recursos ya presentes en la web.
