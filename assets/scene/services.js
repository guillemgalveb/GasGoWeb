import { fuelX } from './layout.js';

export const services = [
  {
    name: 'Identificación inteligente',
    description: 'El concepto vincula el vehículo a la cuenta del conductor al entrar en la estación. Así se reduce el número de pasos antes de repostar.',
    anchor: [-17.2, 3.65, 7.4], target: [-17.2, 1.8, 7.4], angle: [4, 2.6, 8],
    poster: [.1032, .4821],
  },
  {
    name: 'Autorización y pago automático',
    description: 'Gas&Go propone reunir la identificación, la autorización del surtidor y el pago en una sola experiencia. El recibo queda en el historial de la aplicación.',
    anchor: [fuelX(-6.3), 2.65, 3.4], target: [fuelX(-6.3), 1.05, 3.4], angle: [3, 2.4, 9],
    poster: [.27860, .51750],
  },
  {
    name: 'Repostaje inteligente',
    description: 'El conductor reposta de forma habitual. La aplicación detecta el surtidor y plantea tres formas de autorizarlo.',
    methods: [
      'A. Autorización automática mediante BLE, UWB y token seguro.',
      'B. Autorización mediante confirmación manual.',
      'C. Alternativa mediante NFC o QR dinámico.',
    ],
    anchor: [fuelX(-11.7), 3.02, 1.65], target: [fuelX(-11.7), 1.55, 1.45], angle: [1.5, 2.2, 9],
    poster: [.22344, .50432],
  },
  {
    name: 'Take&Go',
    description: 'La tienda del concepto Gas&Go integra la compra y su pago en la aplicación. La propuesta permite adquirir productos sin pasar por una caja convencional.',
    anchor: [3.65, 5.2, -5.6], target: [.5, 2.2, -5.95], angle: [1.4, 2.6, 10],
    poster: [.581, .43468],
  },
  {
    name: 'Recarga eléctrica',
    description: 'La zona eléctrica lleva el mismo flujo a la recarga. Gas&Go propone identificar el vehículo, autorizar el cargador y gestionar el pago desde la aplicación.',
    anchor: [13.9, 3.1, 1.75], target: [13.1, 1.55, 1.6], angle: [4.7, 2.6, 8.4],
    poster: [.77983, .50180],
  },
];
