import { fuelBays, fuelCameraOffset, fuelX } from './layout.js';

export const services = [
  {
    name: 'Identificación inteligente',
    description: 'Antes de salir, registra tu vehículo en la aplicación. Al llegar, una cámara de la marquesina enfoca la matrícula delantera para vincular el vehículo con tu cuenta. Así evitas repetir la identificación en cada parada.',
    benefit: 'Menos pasos antes de empezar a repostar.',
    detail: 'El mapa permite comparar estaciones por precio, distancia y tiempo estimado. La ocupación y la espera se simulan en el prototipo.',
    anchor: [fuelX(fuelBays.left.x + fuelCameraOffset.x), fuelCameraOffset.y + .14, fuelBays.left.z + fuelCameraOffset.z + .35],
    target: [fuelX(fuelBays.left.x + fuelCameraOffset.x), fuelCameraOffset.y - .12, fuelBays.left.z + fuelCameraOffset.z],
    angle: [2.8, -1.8, 8.4],
    poster: [.23207, .43139],
  },
  {
    name: 'Autorización y pago automático',
    description: 'La pantalla del surtidor muestra la identificación del vehículo y permite confirmar la autorización. Al terminar de repostar, Gas&Go propone cargar el importe al método de pago vinculado y guardar la factura en el historial.',
    benefit: 'Sigue tu viaje y consulta después cuánto has gastado.',
    detail: 'Puedes consultar y descargar facturas desde el historial. El prototipo también recoge ideas de fidelización y comunicación de incidencias. Los cobros y las facturas son ficticios.',
    anchor: [fuelX(fuelBays.left.x), 3.02, fuelBays.left.z + .38], target: [fuelX(fuelBays.left.x), 1.55, fuelBays.left.z + .17], angle: [3, 2.4, 9],
    poster: [.22331, .50432],
  },
  {
    name: 'Repostaje inteligente',
    description: 'La aplicación detecta el surtidor y te ofrece varias formas de autorizarlo. Cuando queda habilitado, utilizas la manguera para repostar.',
    benefit: 'Puedes elegir cómo autorizar el surtidor según lo que necesites.',
    methods: [
      'A. Autorización automática mediante BLE, UWB y token seguro.',
      'B. Autorización mediante confirmación manual.',
      'C. Alternativa mediante NFC o QR dinámico.',
    ],
    anchor: [fuelX(fuelBays.right.x), 3.02, fuelBays.right.z + .38], target: [fuelX(fuelBays.right.x), 1.55, fuelBays.right.z + .17], angle: [1.5, 2.2, 9],
    poster: [.38268, .50461],
  },
  {
    name: 'Take&Go',
    description: 'Aparcas, entras en Take&Go, eliges un producto y vuelves al coche. Gas&Go plantea integrar la compra y el pago en la aplicación.',
    benefit: 'Una parada para comprar sin pasar por una caja convencional.',
    detail: 'Take&Go forma parte de la visión del proyecto. El pago de tienda quedó fuera del prototipo V1.',
    anchor: [3.65, 5.2, -5.6], target: [.5, 2.2, -5.95], angle: [1.4, 2.6, 10],
    poster: [.581, .43468],
  },
  {
    name: 'Recarga eléctrica',
    description: 'Gas&Go propone identificar el vehículo, autorizar el cargador y gestionar el pago desde la misma aplicación. Puedes estimar la duración según la potencia del punto y la energía que quieras cargar.',
    benefit: 'Puedes planificar dónde cargar y cuánto podría durar la parada.',
    detail: 'El prototipo simula el suministro eléctrico. El tiempo estimado depende de la potencia del conector y de los kWh seleccionados.',
    anchor: [13.9, 3.1, 1.75], target: [13.1, 1.55, 1.6], angle: [4.7, 2.6, 8.4],
    poster: [.77983, .50180],
  },
];
