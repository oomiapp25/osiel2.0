
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect } from '../../services/geminiService';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Square, Circle, Triangle, Heart, Star, Hexagon, Sparkles } from 'lucide-react';

interface ShapesGameProps {
  level: number;
  onComplete: () => void;
}

const ALL_SHAPES = [
  { id: 'circle', icon: <Circle className="w-12 h-12" />, name: 'Círculo' },
  { id: 'square', icon: <Square className="w-12 h-12" />, name: 'Cuadrado' },
  { id: 'triangle', icon: <Triangle className="w-12 h-12" />, name: 'Triángulo' },
  { id: 'heart', icon: <Heart className="w-12 h-12" />, name: 'Corazón' },
  { id: 'star', icon: <Star className="w-12 h-12" />, name: 'Estrella' },
  { id: 'hexagon', icon: <Hexagon className="w-12 h-12" />, name: 'Hexágono' },
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
    
    const instruction = `¿Dónde está el ${randomTarget.name}?`;
    setFeedback(instruction);
    speakText(instruction);
  }, [level]);

  const handleSelect = async (shapeId: string) => {
    if (isFinished) return;

    if (shapeId === target.id) {
      setIsFinished(true);
      playSoundEffect('correct');
      confetti();
      const msg = await getEncouragement("Lila la Mariposa", `encontrado el ${target.name} en el nivel ${level}`);
      setFeedback(msg);
      speakText(msg);
      playSoundEffect('complete');
    } else {
      playSoundEffect('incorrect');
      speakText("¡Inténtalo otra vez! Busca el " + target.name);
    }
  };

  if (!target) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-pink-50/20">
      <h2 className="text-2xl md:text-3xl font-kids text-pink-600 mb-12 px-4 h-16 flex items-center justify-center">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {options.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleSelect(shape.id)}
              className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl flex flex-col items-center justify-center gap-4 shadow-xl border-b-8 border-gray-100 hover:border-pink-200 active:translate-y-2 transition-all transform hover:scale-105"
            >
              <div className={shape.color}>{shape.icon}</div>
              <span className="font-kids text-sm text-gray-500">{shape.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-pink-500 text-white px-10 py-5 rounded-3xl text-2xl font-kids shadow-lg hover:bg-pink-600 active:translate-y-2 transition-all border-b-8 border-pink-700 flex items-center gap-3 animate-bounce"
        >
          <Sparkles /> ¡SIGUIENTE! <Sparkles />
        </button>
      )}
    </div>
  );
};

export default ShapesGame;
