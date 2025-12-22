
import React, { useState, useEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction } from '../../services/geminiService';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Sparkles } from 'lucide-react';

interface BodyPartsGameProps {
  level: number;
  onComplete: () => void;
}

type BodyPart = {
  id: string;
  name: string;
  ids: string[];
};

const ALL_BODY_PARTS: BodyPart[] = [
  { id: 'eyes', name: 'Ojos', ids: ['eye_l', 'eye_r'] },
  { id: 'nose', name: 'Nariz', ids: ['nose'] },
  { id: 'mouth', name: 'Boca', ids: ['mouth'] },
  { id: 'ears', name: 'Oídos', ids: ['ear_l', 'ear_r'] },
  { id: 'hair', name: 'Cabello', ids: ['hair_tuft'] },
  { id: 'eyebrows', name: 'Cejas', ids: ['brow_l', 'brow_r'] },
  { id: 'cheeks', name: 'Cachetes', ids: ['cheek_l', 'cheek_r'] },
  { id: 'chin', name: 'Barbilla', ids: ['chin'] },
  { id: 'forehead', name: 'Frente', ids: ['forehead'] },
];

const BodyPartsGame: React.FC<BodyPartsGameProps> = ({ level, onComplete }) => {
  const [target, setTarget] = useState<BodyPart | null>(null);
  const [feedback, setFeedback] = useState("");
  const [round, setRound] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const totalRounds = 3;

  useEffect(() => {
    setIsFinished(false);
    setRound(1);
    startRound();
    
    // Intervalo aleatorio para parpadear
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, [level]);

  const startRound = async () => {
    let pool = ALL_BODY_PARTS.slice(0, 4);
    if (level >= 5) pool = ALL_BODY_PARTS;

    const randomPart = pool[Math.floor(Math.random() * pool.length)];
    setTarget(randomPart);
    setHighlighted(null);
    
    const instruction = await getDynamicInstruction("reconocer partes del rostro", randomPart.name);
    setFeedback(instruction);
    speakText(instruction);
  };

  const handleTouch = async (partId: string) => {
    if (isFinished || !target) return;

    if (target.ids.includes(partId)) {
      setHighlighted(target.id);
      playSoundEffect('correct');
      
      if (round >= totalRounds) {
        setIsFinished(true);
        playSoundEffect('complete');
        confetti({ particleCount: 100, origin: { x: 0.5, y: 0.8 } });
        const msg = await getEncouragement("Maya la Monita", `aprendido sobre su rostro`);
        setFeedback(msg);
        speakText(msg);
      } else {
        speakText(`¡Súper! Esos son los ${target.name}`);
        setRound(prev => prev + 1);
        setTimeout(startRound, 1500);
      }
    } else {
      playSoundEffect('incorrect');
      speakText(`¡Uy! Esa no es. ¡Busca la ${target.name}!`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center bg-gradient-to-b from-yellow-50/50 to-amber-50/50">
      <h2 className="text-3xl font-kids text-yellow-800 mb-8 h-20 flex items-center justify-center px-4">
        {feedback}
      </h2>

      <div className="relative w-80 h-80 md:w-[32rem] md:h-[32rem] mb-8 group">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl transform transition-transform group-hover:scale-105 duration-700">
          {/* Oídos con animación suave */}
          <g onClick={(e) => { e.stopPropagation(); handleTouch('ear_l'); }} className="cursor-pointer group animate-float-slow">
            <circle cx="45" cy="100" r="22" fill="#8B4513" />
            <circle cx="45" cy="100" r="14" fill="#DEB887" />
          </g>
          <g onClick={(e) => { e.stopPropagation(); handleTouch('ear_r'); }} className="cursor-pointer group animate-float-slow stagger-2">
            <circle cx="155" cy="100" r="22" fill="#8B4513" />
            <circle cx="155" cy="100" r="14" fill="#DEB887" />
          </g>

          <circle cx="100" cy="100" r="75" fill="#8B4513" />
          <path d="M55 105 Q 55 55 100 55 Q 145 55 145 105 L 145 125 Q 100 155 55 125 Z" fill="#DEB887" />

          {/* Ojos y parpadeo */}
          <g onClick={(e) => { e.stopPropagation(); handleTouch('eye_l'); }} className="cursor-pointer">
            <circle cx="75" cy="95" r="12" fill="white" />
            {!isBlinking ? <circle cx="75" cy="95" r="6" fill="black" /> : <line x1="65" y1="95" x2="85" y2="95" stroke="#5D2E0A" strokeWidth="2" />}
          </g>
          <g onClick={(e) => { e.stopPropagation(); handleTouch('eye_r'); }} className="cursor-pointer">
            <circle cx="125" cy="95" r="12" fill="white" />
            {!isBlinking ? <circle cx="125" cy="95" r="6" fill="black" /> : <line x1="115" y1="95" x2="135" y2="95" stroke="#5D2E0A" strokeWidth="2" />}
          </g>

          {/* Nariz y Boca interactiva */}
          <circle id="nose" cx="100" cy="115" r="8" fill="#5D2E0A" onClick={(e) => { e.stopPropagation(); handleTouch('nose'); }} className="cursor-pointer hover:scale-110 transform origin-center transition-all" />
          
          <path 
            id="mouth" d="M75 140 Q 100 155 125 140" 
            stroke="#5D2E0A" strokeWidth="5" fill="none" strokeLinecap="round" 
            onClick={(e) => { e.stopPropagation(); handleTouch('mouth'); }} 
            className="cursor-pointer hover:stroke-red-400" 
          />

          {/* Hitboxes invisibles para partes pequeñas */}
          <rect id="forehead" x="70" y="60" width="60" height="20" fill="transparent" onClick={() => handleTouch('forehead')} className="cursor-pointer" />
          <path id="hair_tuft" d="M90 30 Q 100 10 110 30" stroke="#5D2E0A" strokeWidth="10" fill="none" onClick={() => handleTouch('hair_tuft')} className="cursor-pointer" />

          {highlighted && (
             <circle cx="100" cy="110" r="85" stroke="#FFD700" strokeWidth="4" fill="none" strokeDasharray="10" className="animate-spin-slow" />
          )}
        </svg>
      </div>

      {!isFinished ? (
        <div className="flex gap-4">
          {[...Array(totalRounds)].map((_, i) => (
            <div key={i} className={`w-6 h-6 rounded-full border-4 border-white shadow-md ${i < round ? 'bg-yellow-400 scale-125' : 'bg-gray-200'} transition-all duration-500`} />
          ))}
        </div>
      ) : (
        <button
          onClick={onComplete}
          className="bg-yellow-500 text-white px-12 py-6 rounded-3xl text-3xl font-kids shadow-2xl hover:bg-yellow-600 active:translate-y-2 transition-all border-b-8 border-yellow-700 animate-bounce"
        >
          ¡Lo hiciste! ✨
        </button>
      )}
    </div>
  );
};

export default BodyPartsGame;
