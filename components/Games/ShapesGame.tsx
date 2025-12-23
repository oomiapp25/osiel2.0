
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Square, Circle, Triangle, Heart, Star, Hexagon, Sparkles } from 'lucide-react';

interface ShapesGameProps {
  level: number;
  onComplete: () => void;
}

const ALL_SHAPES = [
  { id: 'circle', icon: <Circle className="w-12 h-12" />, name: 'círculo', gender: 'm' as const },
  { id: 'square', icon: <Square className="w-12 h-12" />, name: 'cuadrado', gender: 'm' as const },
  { id: 'triangle', icon: <Triangle className="w-12 h-12" />, name: 'triángulo', gender: 'm' as const },
  { id: 'heart', icon: <Heart className="w-12 h-12" />, name: 'corazón', gender: 'm' as const },
  { id: 'star', icon: <Star className="w-12 h-12" />, name: 'estrella', gender: 'f' as const },
  { id: 'hexagon', icon: <Hexagon className="w-12 h-12" />, name: 'hexágono', gender: 'm' as const },
];

const COLORS = [
  'text-pink-500', 'text-blue-500', 'text-amber-500', 'text-green-500', 'text-purple-500', 'text-red-500'
];

const ShapesGame: React.FC<ShapesGameProps> = ({ level, onComplete }) => {
  const [options, setOptions] = useState<any[]>([]);
  const [target, setTarget] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setIsFinished(false);
    let numOptions = 2;
    if (level >= 4) numOptions = 3;
    if (level >= 7) numOptions = 4;
    if (level >= 10) numOptions = 6;

    const shuffled = [...ALL_SHAPES].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, numOptions).map((s, idx) => ({
      ...s,
      color: COLORS[idx % COLORS.length]
    }));
    
    const randomTarget = selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    setOptions(selectedOptions);
    setTarget(randomTarget);
    
    const init = async () => {
      const instruction = await getDynamicInstruction("shapes", randomTarget.name, randomTarget.gender);
      setFeedback(instruction);
      speakText(instruction);
    };
    init();
  }, [level]);

  const handleSelect = async (shapeId: string) => {
    if (isFinished) return;

    if (shapeId === target.id) {
      setIsFinished(true);
      playSoundEffect('correct');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const msg = await getEncouragement("Lila la Mariposa", `encontrado el objeto`);
      setFeedback(msg);
      speakText(msg);
      playSoundEffect('complete');
    } else {
      playSoundEffect('incorrect');
      speakText("¡Ese no es!");
    }
  };

  if (!target) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-pink-50/20">
      <h2 className="text-3xl md:text-4xl font-kids text-pink-600 mb-12 px-4 h-20 flex items-center justify-center animate-pulse-gentle">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {options.map((shape, i) => (
            <button
              key={shape.id}
              onClick={() => handleSelect(shape.id)}
              className={`w-32 h-32 md:w-44 md:h-44 bg-white rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-xl border-b-8 border-gray-100 hover:border-pink-300 active:scale-90 transition-all transform animate-pop-in stagger-${i+1}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`${shape.color} ${shape.id === target.id ? 'animate-wiggle' : ''}`}>
                {shape.icon}
              </div>
              <span className="font-kids text-xs text-gray-400 uppercase tracking-widest">{shape.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-pink-500 text-white px-12 py-6 rounded-full text-3xl font-kids shadow-2xl hover:bg-pink-600 active:translate-y-2 transition-all border-b-8 border-pink-700 flex items-center gap-4 animate-bounce"
        >
          <Sparkles /> ¡SIGUIENTE! <Sparkles />
        </button>
      )}
    </div>
  );
};

export default ShapesGame;
