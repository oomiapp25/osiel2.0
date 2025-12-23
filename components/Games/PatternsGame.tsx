
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction } from '../../services/geminiService.ts';
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
  const totalRounds = level < 5 ? 2 : 3;

  useEffect(() => {
    setIsFinished(false);
    setRound(1);
    startRound();
  }, [level]);

  const startRound = async () => {
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
    
    const instruction = await getDynamicInstruction("patterns", "patrón", "m");
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
        confetti({ particleCount: 150, origin: { y: 0.6 } });
        const msg = await getEncouragement("Pipo el Pingüino", `patrones completados`);
        setFeedback(msg);
        speakText(msg);
      } else {
        speakText("¡Muy bien!");
        setRound(prev => prev + 1);
        setTimeout(startRound, 1200);
      }
    } else {
      playSoundEffect('incorrect');
      speakText("¡Uy! Ese no sigue el patrón.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-blue-50/30">
      <h2 className="text-2xl md:text-3xl font-kids text-blue-700 mb-8 h-12 flex items-center animate-pulse-gentle">
        {feedback}
      </h2>
      
      {!isFinished ? (
        <div className="w-full flex flex-col items-center gap-12">
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white/60 p-6 rounded-[3rem] shadow-inner border-4 border-white animate-pop-in">
            {sequence.map((item, i) => (
              <div key={i} className={`w-14 h-14 md:w-20 md:h-20 ${item.color} animate-float stagger-${i+1}`}>
                {item.icon}
              </div>
            ))}
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl border-4 border-dashed border-blue-300 bg-blue-100/50 flex items-center justify-center animate-pulse-gentle">
              <span className="text-3xl text-blue-400 font-kids">?</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {options.map((option, i) => (
              <button
                key={option.id}
                onClick={() => { playSoundEffect('pop'); handleSelect(option); }}
                className="group bg-white p-5 rounded-[2.5rem] shadow-xl hover:scale-110 active:scale-95 transition-all border-b-8 border-gray-100 w-24 h-24 md:w-36 md:h-36 flex items-center justify-center animate-pop-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className={`${option.color} w-16 h-16 md:w-24 md:h-24`}>
                  {option.icon}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-blue-500 text-white px-10 py-5 rounded-3xl text-2xl font-kids shadow-lg hover:bg-blue-600 active:translate-y-2 transition-all border-b-8 border-blue-700 flex items-center gap-3 animate-bounce"
        >
          <Sparkles /> ¡SIGUIENTE!
        </button>
      )}

      <div className="mt-12 flex gap-3">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-full transition-all duration-500 ${i < round ? 'bg-blue-500 scale-125' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
};

export default PatternsGame;
