import { entryCamera, fuelBays, fuelX, refuellingDemo } from './layout.js';

export const services = [
  {
    name: 'Identificación inteligente',
    description: 'Al llegar a la estación una cámara reconoce la matrícula y vincula el vehículo con la cuenta de Gas&Go antes de iniciar el servicio.',
    discover: true,
    anchor: [fuelX(entryCamera.position.x), entryCamera.position.y + .15, entryCamera.position.z + .35],
    target: [fuelX(entryCamera.position.x), entryCamera.position.y, entryCamera.position.z],
    angle: [-4.4, -1.6, 8.4],
    poster: [.155, .433266],
  },
  {
    name: 'Autorización y pago automático',
    description: 'La pantalla del surtidor muestra la identificación del vehículo y permite confirmar la autorización. Al terminar de repostar, Gas&Go propone cargar el importe al método de pago vinculado y guardar la factura en el historial.',
    benefit: 'Sigue tu viaje y consulta después cuánto has gastado.',
    detail: 'Puedes consultar y descargar facturas desde el historial. El prototipo también recoge ideas de fidelización y comunicación de incidencias. Los cobros y las facturas son ficticios.',
    anchor: [fuelX(fuelBays.left.x), 3.02, fuelBays.left.z + .38], target: [fuelX(fuelBays.left.x), 1.55, fuelBays.left.z + .17], angle: [3, 2.4, 9],
    poster: [.294064, .495226],
  },
  {
    name: 'Repostaje inteligente',
    description: 'La aplicación detecta el surtidor y te ofrece varias formas de autorizarlo. Cuando queda habilitado, utilizas la manguera para repostar.',
    detail: `En la animación, ambos coches paran a la vez. La parada convencional dura ${refuellingDemo.conventionalSeconds} s y la de Gas&Go, ${refuellingDemo.gasGoSeconds} s. El primer coche de la cola ocupa el hueco de Gas&Go mientras los surtidores de atrás siguen ocupados. La comparación representa el objetivo del 30 % de ahorro. En una parada orientativa de 5 min, equivaldría a 3 min y 30 s. El ahorro quedó sin validar en el prototipo.`,
    benefit: 'Puedes elegir cómo autorizar el surtidor según lo que necesites.',
    methods: [
      'A. Autorización automática mediante BLE, UWB y token seguro.',
      'B. Autorización mediante confirmación manual.',
      'C. Alternativa mediante NFC o QR dinámico.',
    ],
    anchor: [fuelX(fuelBays.right.x), 3.02, fuelBays.right.z + .38], target: [fuelX(fuelBays.right.x), 1.55, fuelBays.right.z + .17], angle: [1.5, 2.2, 9],
    poster: [.455002, .506750],
  },
  {
    name: 'Take&Go',
    description: 'Aparcas, entras en Take&Go, eliges un producto y vuelves al coche. Gas&Go plantea integrar la compra y el pago en la aplicación.',
    benefit: 'Una parada para comprar sin pasar por una caja convencional.',
    detail: 'Take&Go forma parte de la visión del proyecto. El pago de tienda quedó fuera del prototipo V1.',
    anchor: [3.65, 5.2, -5.6], target: [.5, 2.2, -5.95], angle: [1.4, 2.6, 10],
    poster: [.631292, .429572],
  },
  {
    name: 'Recarga eléctrica',
    description: 'Gas&Go propone identificar el vehículo, autorizar el cargador y gestionar el pago desde la misma aplicación. Puedes estimar la duración según la potencia del punto y la energía que quieras cargar.',
    benefit: 'Puedes planificar dónde cargar y cuánto podría durar la parada.',
    detail: 'El prototipo simula el suministro eléctrico. El tiempo estimado depende de la potencia del conector y de los kWh seleccionados.',
    anchor: [13.9, 3.1, 1.75], target: [13.1, 1.55, 1.6], angle: [4.7, 2.6, 8.4],
    poster: [.833509, .532875],
  },
];
