
import React, { useState } from 'react';
import { Lock, Settings, ChevronLeft, Clock, ShieldCheck } from 'lucide-react';

interface ParentalControlProps {
  onClose: () => void;
}

const ParentalControl: React.FC<ParentalControlProps> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);

  const correctPin = "1234"; // Default simple PIN for demo

  const handlePin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin === correctPin) {
        setIsUnlocked(true);
      }
    }
  };

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8">
        <div className="bg-blue-50 p-8 rounded-3xl shadow-lg border-4 border-blue-200 text-center max-w-sm w-full">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-kids text-blue-800 mb-2">Acceso Padres</h2>
          <p className="text-blue-600 text-sm mb-6">Ingresa el código para entrar (Prueba: 1234)</p>
          
          <div className="flex justify-center gap-2 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 border-blue-300 ${pin.length > i ? 'bg-blue-500' : 'bg-transparent'}`} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button 
                key={n} 
                onClick={() => handlePin(n.toString())}
                className="w-16 h-16 bg-white rounded-2xl font-bold text-xl text-blue-700 shadow-sm active:bg-blue-100"
              >
                {n}
              </button>
            ))}
            <div />
            <button 
              onClick={() => handlePin("0")}
              className="w-16 h-16 bg-white rounded-2xl font-bold text-xl text-blue-700 shadow-sm active:bg-blue-100"
            >
              0
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-8 text-blue-500 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-blue-50 z-50 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <button onClick={onClose} className="bg-white p-3 rounded-2xl shadow-sm">
            <ChevronLeft />
          </button>
          <h1 className="text-3xl font-kids text-blue-900">Configuración Parental</h1>
          <div className="w-12" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-6 text-blue-700">
              <Clock className="w-8 h-8" />
              <h3 className="text-xl font-kids">Límite de Tiempo</h3>
            </div>
            <p className="text-gray-600 mb-6">Controla cuánto tiempo puede jugar el niño hoy.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setTimeLimit(t => Math.max(5, t - 5))} className="w-12 h-12 bg-blue-100 rounded-xl text-2xl">-</button>
              <span className="text-3xl font-bold text-blue-900">{timeLimit} min</span>
              <button onClick={() => setTimeLimit(t => Math.min(60, t + 5))} className="w-12 h-12 bg-blue-100 rounded-xl text-2xl">+</button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-6 text-green-600">
              <ShieldCheck className="w-8 h-8" />
              <h3 className="text-xl font-kids">Seguridad</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="font-semibold">Sonidos habilitados</span>
                <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="font-semibold">Música de fondo</span>
                <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-kids mb-6">Progreso del Niño</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Números', val: 80, color: 'bg-amber-400' },
              { label: 'Formas', val: 45, color: 'bg-pink-400' },
              { label: 'Colores', val: 90, color: 'bg-green-400' },
              { label: 'Tamaños', val: 30, color: 'bg-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="w-full bg-gray-100 h-24 rounded-2xl mb-2 relative overflow-hidden flex items-end">
                  <div className={`w-full ${stat.color}`} style={{ height: `${stat.val}%` }} />
                </div>
                <span className="font-kids text-gray-700">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentalControl;
