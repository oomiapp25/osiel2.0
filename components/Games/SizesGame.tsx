
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { TreePine, Apple, Cherry, Truck, Bike, Plane, Sparkles } from 'lucide-react';

interface SizesGameProps {
  level: number;
  onComplete: () => void;
}

type SizeItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  gender: 'm' | 'f';
};

const ITEMS: SizeItem[] = [
  { id: 'tree', icon: <TreePine className="w-full h-full" />, label: 'Árbol', gender: 'm' },
  { id: 'apple', icon: <Apple className="w-full h-full" />, label: 'Manzana', gender: 'f' },
  { id: 'cherry', icon: <Cherry className="w-full h-full" />, label: 'Cereza', gender: 'f' },
  { id: 'truck', icon: <Truck className="w-full h-full" />, label: 'Camión', gender: 'm' },
  { id: 'bike', icon: <Bike className="w-full h-full" />, label: 'Bici', gender: 'f' },
  { id: 'plane', icon: <Plane className="w-full h-full" />, label: 'Avión', gender: 'm' },
];

const SizesGame: React.FC<SizesGameProps> = ({ level, onComplete }) => {
  const [targetSize, setTargetSize] = useState<'big' | 'small'>('big');
  const [item, setItem] = useState<SizeItem>(ITEMS[0]);
  const [feedback, setFeedback] = useState("");
  const [round, setRound] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const totalRounds = level < 5 ? 2 : 3;

  useEffect(() => {
    setIsFinished(false);
    setRound(1);
    startRound();
  }, [level]);

  const startRound = async () => {
    const availableItems = ITEMS.slice(0, Math.min(level + 1, ITEMS.length));
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    const randomSize = Math.random() > 0.5 ? 'big' : 'small';
    setItem(randomItem);
    setTargetSize(randomSize);
    
    const sizeText = randomSize === 'big' 
      ? (randomItem.gender === 'm' ? 'GRANDE' : 'GRANDE') 
      : (randomItem.gender === 'm' ? 'PEQUEÑO' : 'PEQUEÑA');
    
    const instruction = await getDynamicInstruction("sizes", `${randomItem.label} ${sizeText}`, randomItem.gender);
    setFeedback(instruction);
    speakText(instruction);
  };

  const handleSelect = async (selectedSize: 'big' | 'small') => {
    if (isFinished) return;

    if (selectedSize === targetSize) {
      playSoundEffect('correct');
      if (round >= totalRounds) {
        setIsFinished(true);
        playSoundEffect('complete');
        confetti();
        const msg = await getEncouragement("Gogo el Oso", `completado tamaños`);
        setFeedback(msg);
        speakText(msg);
      } else {
        speakText("¡Muy bien!");
        setRound(prev => prev + 1);
        setTimeout(startRound, 1000);
      }
    } else {
      playSoundEffect('incorrect');
      speakText(`¡Ese no es!`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-green-50/50">
      <h2 className="text-3xl font-kids text-green-700 mb-12 h-16 flex items-center px-4 animate-pulse-gentle">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <div className="flex items-center justify-center gap-12 md:gap-20 w-full max-w-2xl">
          <button
            onClick={() => handleSelect('big')}
            className={`flex items-center justify-center bg-white rounded-[3rem] shadow-xl hover:scale-105 active:scale-95 transition-all border-b-8 border-gray-100 p-8 w-48 h-48 md:w-64 md:h-64 animate-pop-in ${targetSize === 'big' ? 'animate-pulse-gentle' : ''}`}
          >
            <div className="text-green-500 w-32 h-32 md:w-48 md:h-48">
              {item.icon}
            </div>
          </button>

          <button
            onClick={() => handleSelect('small')}
            className={`flex items-center justify-center bg-white rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all border-b-8 border-gray-100 p-4 w-24 h-24 md:w-32 md:h-32 animate-pop-in stagger-2 ${targetSize === 'small' ? 'animate-pulse-gentle' : ''}`}
          >
            <div className="text-green-500 w-12 h-12 md:w-16 md:h-16">
              {item.icon}
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-green-500 text-white px-10 py-5 rounded-3xl text-2xl font-kids shadow-lg hover:bg-green-600 active:translate-y-2 transition-all border-b-8 border-green-700 flex items-center gap-3 animate-bounce"
        >
          <Sparkles /> ¡SIGUIENTE! <Sparkles />
        </button>
      )}

      <div className="mt-12 flex gap-2">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div 
            key={i} 
            className={`w-6 h-6 rounded-full transition-all duration-300 ${i < round ? 'bg-green-500 scale-125' : 'bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SizesGame;
