
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect } from '../../services/geminiService';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Fish, Snowflake, Shell, Waves, Sparkles } from 'lucide-react';

interface PatternsGameProps {
  level: number;
  onComplete: () => void;
}

type PatternItem = {
  id: string;
  color: string;
  name: string;
  icon: React.ReactNode;
};

const POOL: PatternItem[] = [
  { id: '1', color: 'text-orange-500', name: 'naranja', icon: <Fish className="w-full h-full" /> },
  { id: '2', color: 'text-purple-500', name: 'morado', icon: <Fish className="w-full h-full" /> },
  { id: '3', color: 'text-cyan-500', name: 'celeste', icon: <Shell className="w-full h-full" /> },
  { id: '4', color: 'text-lime-500', name: 'verde', icon: <Shell className="w-full h-full" /> },
  { id: '5', color: 'text-red-500', name: 'rojo', icon: <Waves className="w-full h-full" /> },
];

const PatternsGame: React.FC<PatternsGameProps> = ({ level, onComplete }) => {
  const [sequence, setSequence] = useState<PatternItem[]>([]);
  const [options, setOptions] = useState<PatternItem[]>([]);
  const [target, setTarget] = useState<PatternItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [round, setRound] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const totalRounds = 3;

  useEffect(() => {
    setIsFinished(false);
    setRound(1);
    startRound();
  }, [level]);

  const startRound = () => {
    const shuffledPool = [...POOL].sort(() => 0.5 - Math.random());
    
    let newSequence: PatternItem[] = [];
    let correctTarget: PatternItem;

    if (level <= 5) {
      const A = shuffledPool[0];
      const B = shuffledPool[1];
      newSequence = [A, B, A];
      correctTarget = B;
    } else {
      const A = shuffledPool[0];
      const B = shuffledPool[1];
      const C = shuffledPool[2];
      newSequence = [A, B, C, A, B];
      correctTarget = C;
    }

    setSequence(newSequence);
    setTarget(correctTarget);
    
    const otherOptions = POOL.filter(p => p.id !== correctTarget.id).sort(() => 0.5 - Math.random()).slice(0, 2);
    setOptions([correctTarget, ...otherOptions].sort(() => 0.5 - Math.random()));
    
    const instruction = "¿Qué sigue?";
    setFeedback(instruction);
    speakText(instruction);
  };

  const handleSelect = async (selected: PatternItem) => {
    if (isFinished) return;

    if (target && selected.id === target.id) {
      playSoundEffect('correct');
      if (round >= totalRounds) {
        setIsFinished(true);
        playSoundEffect('complete');
        confetti();
        const msg = await getEncouragement("Pipo el Pingüino", `patrones completados en nivel ${level}`);
        setFeedback(msg);
        speakText(msg);
      } else {
        speakText("¡Súper! Sigue así.");
        setRound(prev => prev + 1);
        startRound();
      }
    } else {
      playSoundEffect('incorrect');
      speakText("¡Casi! Mira bien el patrón.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-blue-50/50 relative overflow-hidden">
      <Snowflake className="absolute top-4 left-4 w-6 h-6 md:w-8 md:h-8 text-blue-200 animate-spin-slow opacity-50" />
      <Snowflake className="absolute bottom-4 right-4 w-10 h-10 md:w-12 md:h-12 text-blue-200 animate-bounce opacity-50" />

      <h2 className="text-2xl md:text-3xl font-kids text-blue-700 mb-6 md:mb-10 h-12 md:h-16 flex items-center px-4">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-10 md:mb-16 bg-white/60 p-5 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-inner border-4 border-white w-full max-w-3xl">
            {sequence.map((item, i) => (
              <div key={i} className={`w-14 h-14 md:w-20 md:h-20 ${item.color} transform transition-all`}>
                {item.icon}
              </div>
            ))}
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border-4 border-dashed border-blue-300 bg-blue-100/50 flex items-center justify-center shadow-inner">
              <span className="text-2xl md:text-4xl text-blue-400 font-kids animate-pulse">?</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className="group bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl hover:scale-110 active:scale-95 transition-all border-b-8 border-gray-100 hover:border-blue-200 w-24 h-24 md:w-36 md:h-36 flex items-center justify-center"
              >
                <div className={`${option.color} w-14 h-14 md:w-24 md:h-24 group-hover:animate-bounce`}>
                  {option.icon}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          onClick={onComplete}
          className="bg-blue-500 text-white px-10 py-5 rounded-3xl text-2xl font-kids shadow-lg hover:bg-blue-600 active:translate-y-2 transition-all border-b-8 border-blue-700 flex items-center gap-3 animate-bounce"
        >
          <Sparkles /> ¡SIGUIENTE! <Sparkles />
        </button>
      )}

      <div className="mt-10 md:mt-16 flex gap-3">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-500 border border-white/50 ${i < round ? 'bg-blue-500 shadow-sm' : 'bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PatternsGame;
