
import React from 'react';
import { MousePointer2, Flower, Snowflake, PawPrint, Laugh, Hammer, Palette } from 'lucide-react';

export const BUDDIES = {
  toby: {
    id: 'toby',
    name: 'Toby el Topo',
    description: 'Aprende los números en los túneles.',
    color: 'bg-amber-100',
    icon: <MousePointer2 className="w-12 h-12 text-amber-600" />,
    themeColor: 'amber',
    teach: 'counting'
  },
  lila: {
    id: 'lila',
    name: 'Lila la Mariposa',
    description: 'Encuentra formas en el jardín.',
    color: 'bg-pink-100',
    icon: <Flower className="w-12 h-12 text-pink-500" />,
    themeColor: 'pink',
    teach: 'shapes'
  },
  payasin: {
    id: 'payasin',
    name: 'Payasín',
    description: '¡Diviértete con los colores!',
    color: 'bg-red-50',
    icon: <Palette className="w-12 h-12 text-red-500" />,
    themeColor: 'red',
    teach: 'colors'
  },
  maya: {
    id: 'maya',
    name: 'Maya la Monita',
    description: '¡Conoce tu carita y tu cuerpo!',
    color: 'bg-yellow-100',
    icon: <Laugh className="w-12 h-12 text-yellow-600" />,
    themeColor: 'yellow',
    teach: 'bodyParts'
  },
  gogo: {
    id: 'gogo',
    name: 'Gogo el Oso',
    description: '¡Descubre tamaños grandes y pequeños!',
    color: 'bg-green-100',
    icon: <PawPrint className="w-12 h-12 text-green-600" />,
    themeColor: 'green',
    teach: 'sizes'
  },
  pipo: {
    id: 'pipo',
    name: 'Pipo el Pingüino',
    description: 'Completa patrones en el hielo.',
    color: 'bg-blue-100',
    icon: <Snowflake className="w-12 h-12 text-blue-500" />,
    themeColor: 'blue',
    teach: 'patterns'
  },
  bruno: {
    id: 'bruno',
    name: 'Bruno el Castor',
    description: '¡Vamos a construir cosas divertidas!',
    color: 'bg-orange-100',
    icon: <Hammer className="w-12 h-12 text-orange-600" />,
    themeColor: 'orange',
    teach: 'builder'
  }
};

export const COLORS = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];
