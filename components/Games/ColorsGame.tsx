
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Sparkles } from 'lucide-react';

interface ColorsGameProps {
  level: number;
  onComplete: () => void;
}

const COLOR_MAP = [
  { name: 'rojo', class: 'bg-red-500', gender: 'm' },
  { name: 'azul', class: 'bg-blue-500', gender: 'm' },
  { name: 'amarillo', class: 'bg-yellow-400', gender: 'm' },
  { name: 'verde', class: 'bg-green-500', gender: 'm' },
  { name: 'naranja', class: 'bg-orange-500', gender: 'm' },
  { name: 'rosa', class: 'bg-pink-400', gender: 'm' },
];

const ColorsGame: React.FC<ColorsGameProps> = ({ level, onComplete }) => {
  const [target, setTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    startNewRound();
  }, [level]);

  const startNewRound = () => {
    setIsFinished(false);
    const count = level < 5 ? 2 : 3;
    const shuffled = [...COLOR_MAP].sort(() => 0.5 - Math.random()).slice(0, count);
    const randomTarget = shuffled[Math.floor(Math.random() * shuffled.length)];
    
    setOptions(shuffled);
    setTarget(randomTarget);
    
    const msg = `¡Hola! Toca el color ${randomTarget.name}`;
    setFeedback(msg);
    speakText(msg);
  };

  const handleSelect = async (color: any) => {
    if (isFinished) return;

    if (color.name === target.name) {
      setIsFinished(true);
      playSoundEffect('correct');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const msg = await getEncouragement("Payasín", "colores");
      setFeedback(msg);
      speakText(msg);
      playSoundEffect('complete');
    } else {
      playSoundEffect('incorrect');
      speakText(`¡Ese no es el ${target.name}!`);
    }
  };

  if (!target) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-red-50/20">
      <h2 className="text-3xl font-kids text-red-600 mb-12 h-20 flex items-center justify-center animate-pulse-gentle">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <div className="flex flex-wrap justify-center gap-8">
          {options.map((color, i) => (
            <button
              key={color.name}
              onClick={() => handleSelect(color)}
              className={`w-32 h-32 md:w-44 md:h-44 ${color.class} rounded-[3rem] shadow-xl border-8 border-white hover:scale-110 active:scale-90 transition-all transform animate-pop-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-red-500 text-white px-12 py-6 rounded-full text-3xl font-kids shadow-2xl animate-bounce border-b-8 border-red-700 flex items-center gap-4"
        >
          <Sparkles /> ¡BRAVO! <Sparkles />
        </button>
      )}
    </div>
  );
};

export default ColorsGame;
