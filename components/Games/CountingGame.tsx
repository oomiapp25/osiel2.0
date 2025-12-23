
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Sparkles } from 'lucide-react';

interface CountingGameProps {
  level: number;
  onComplete: () => void;
}

const ITEMS_POOL = ['🍎', '🍐', '🍌', '🍓', '🍊', '🍍', '🍒', '⭐', '🎈', '🎨', '🚀', '🌈', '🍦', '🍩'];

const CountingGame: React.FC<CountingGameProps> = ({ level, onComplete }) => {
  const [target, setTarget] = useState(3);
  const [current, setCurrent] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [emoji, setEmoji] = useState('🍎');
  const [isFinished, setIsFinished] = useState(false);
  const [positions, setPositions] = useState<{x: number, y: number, delay: number}[]>([]);

  useEffect(() => {
    const newTarget = Math.min(level + 1, 10);
    setTarget(newTarget);
    setCurrent(0);
    setIsFinished(false);
    
    const newPositions = Array.from({ length: newTarget }).map(() => ({
      x: Math.random() * 20 - 10,
      y: Math.random() * 20 - 10,
      delay: Math.random() * 2
    }));
    setPositions(newPositions);

    const randomEmoji = ITEMS_POOL[Math.floor(Math.random() * ITEMS_POOL.length)];
    setEmoji(randomEmoji);

    const initGame = async () => {
      const msg = await getDynamicInstruction("contar", `${newTarget} ${randomEmoji}s`, "mp");
      setFeedback(msg);
      speakText(msg);
    };
    initGame();
  }, [level]);

  const handleTouch = async (index: number) => {
    if (isFinished) return;
    
    if (index === current) {
      const next = current + 1;
      setCurrent(next);
      playSoundEffect('pop');
      speakText(next.toString()); // Canta el número actual
      
      if (next === target) {
        // Marcamos como finalizado pero esperamos un poco para la felicitación
        // para que no se interrumpa el habla del último número
        setIsFinished(true);
        
        setTimeout(async () => {
          playSoundEffect('complete');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          const msg = await getEncouragement("Toby el Topo", `conteo`);
          setFeedback(msg);
          speakText(msg);
        }, 1000); 
      }
    } else {
      playSoundEffect('incorrect');
      speakText("¡Ese no!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-gradient-to-b from-amber-50/50 to-orange-50/50">
      <h2 className="text-3xl font-kids text-amber-700 mb-8 h-20 flex items-center justify-center px-4 animate-pulse-gentle">
        {feedback}
      </h2>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 max-w-5xl">
        {Array.from({ length: target }).map((_, i) => (
          <div 
            key={i} 
            className="animate-pop-in"
            style={{ 
              animationDelay: `${i * 0.1}s`,
              transform: `translate(${positions[i]?.x || 0}px, ${positions[i]?.y || 0}px)`,
            }}
          >
            <button
              onClick={() => handleTouch(i)}
              className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl transition-all duration-500 transform
                ${i < current 
                  ? 'bg-green-100 scale-75 opacity-40 border-4 border-green-300' 
                  : 'bg-white hover:scale-110 active:scale-95 border-4 border-amber-300 animate-wiggle'}`}
            >
              {i < current ? '✨' : emoji}
            </button>
          </div>
        ))}
      </div>

      {!isFinished ? (
        <div className="bg-white/90 px-8 py-3 rounded-full shadow-2xl border-4 border-amber-400 flex items-center gap-6 scale-110">
          <p className="text-5xl font-kids text-amber-600">{current}</p>
          <div className="h-8 w-1 bg-amber-200 rounded-full" />
          <p className="text-2xl font-kids text-amber-400">de {target}</p>
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-green-500 text-white px-12 py-5 rounded-3xl text-3xl font-kids shadow-2xl hover:bg-green-600 active:translate-y-2 transition-all border-b-8 border-green-700 animate-bounce"
        >
          <Sparkles className="w-8 h-8" /> ¡Siguiente!
        </button>
      )}
    </div>
  );
};

export default CountingGame;
