
import React, { useState, useEffect, useRef } from 'react';
import { getEncouragement, speakText, playSoundEffect, initAudio } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Sparkles, Save, RotateCcw, Home, Snowflake, Smile, ArrowDownToLine, Check } from 'lucide-react';

interface BuilderGameProps {
  level: number;
  onComplete: () => void;
}

interface PlacedPart {
  id: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  renderType: 'rect' | 'triangle' | 'circle' | 'door' | 'window' | 'eye';
}

type TemplateType = 'house' | 'snowman' | 'clown';

const TEMPLATES: Record<TemplateType, { name: string, icon: any, parts: any[], bg: string, prompt: string }> = {
  house: {
    name: 'Casita',
    icon: <Home />,
    bg: 'bg-green-50',
    prompt: '¡Construye una casita! Pon las paredes abajo y el techo arriba.',
    parts: [
      { type: 'wall', name: 'Pared', color: 'bg-red-500', renderType: 'rect', w: 160, h: 120 },
      { type: 'roof', name: 'Techo', color: 'bg-gray-800', renderType: 'triangle', w: 190, h: 90 },
      { type: 'door', name: 'Puerta', color: 'bg-amber-800', renderType: 'door', w: 50, h: 80 },
      { type: 'window', name: 'Ventana', color: 'bg-blue-200', renderType: 'window', w: 45, h: 45 },
    ]
  },
  snowman: {
    name: 'Muñeco',
    icon: <Snowflake />,
    bg: 'bg-blue-50',
    prompt: '¡Haz un muñeco de nieve! Pon las bolas una sobre otra.',
    parts: [
      { type: 'base', name: 'Abajo', color: 'bg-white', renderType: 'circle', w: 140, h: 140 },
      { type: 'middle', name: 'Medio', color: 'bg-white', renderType: 'circle', w: 110, h: 110 },
      { type: 'head', name: 'Cabeza', color: 'bg-white', renderType: 'circle', w: 80, h: 80 },
      { type: 'nose', name: 'Nariz', color: 'bg-orange-500', renderType: 'triangle', w: 18, h: 30 },
      { type: 'hat', name: 'Sombrero', color: 'bg-gray-900', renderType: 'rect', w: 70, h: 45 },
    ]
  },
  clown: {
    name: 'Payaso',
    icon: <Smile />,
    bg: 'bg-yellow-50',
    prompt: '¡Un payaso! Pon la cara, los ojitos y su naricita roja.',
    parts: [
      { type: 'face', name: 'Cara', color: 'bg-white', renderType: 'circle', w: 140, h: 140 },
      { type: 'eye', name: 'Ojo', color: 'bg-black', renderType: 'eye', w: 20, h: 20 },
      { type: 'nose', name: 'Nariz', color: 'bg-red-600', renderType: 'circle', w: 30, h: 30 },
      { type: 'hat', name: 'Gorro', color: 'bg-yellow-400', renderType: 'triangle', w: 110, h: 120 },
      { type: 'bowtie', name: 'Moño', color: 'bg-blue-500', renderType: 'rect', w: 100, h: 40 },
    ]
  }
};

const ShapeRenderer: React.FC<{ part: PlacedPart, active?: boolean }> = ({ part, active }) => {
  const style = { width: `${part.width}px`, height: `${part.height}px` };
  const commonClasses = `border-4 border-black/80 shadow-md ${active ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`;

  switch (part.renderType) {
    case 'triangle':
      return (
        <div 
          style={{
            width: 0, height: 0,
            borderLeft: `${part.width / 2}px solid transparent`,
            borderRight: `${part.width / 2}px solid transparent`,
            borderBottom: `${part.height}px solid currentColor`,
            filter: active ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' : 'drop-shadow(0 4px 2px rgba(0,0,0,0.3))'
          }}
          className={part.color.replace('bg-', 'text-')}
        />
      );
    case 'circle': return <div style={style} className={`${part.color} rounded-full ${commonClasses}`} />;
    case 'eye': return <div style={style} className={`bg-white rounded-full border-2 border-black flex items-center justify-center`}><div className="w-1/2 h-1/2 bg-black rounded-full" /></div>;
    case 'door': return <div style={style} className={`${part.color} ${commonClasses} relative`}><div className="absolute right-1 top-1/2 w-2 h-2 bg-yellow-400 rounded-full border border-black" /></div>;
    case 'window': return <div style={style} className={`${part.color} border-4 border-black overflow-hidden grid grid-cols-2 grid-rows-2`}><div className="border border-black/20" /><div className="border border-black/20" /><div className="border border-black/20" /><div className="border border-black/20" /></div>;
    default: return <div style={style} className={`${part.color} ${commonClasses}`} />;
  }
};

const BuilderGame: React.FC<BuilderGameProps> = ({ level, onComplete }) => {
  const [template, setTemplate] = useState<TemplateType | null>(null);
  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("¿Qué vamos a armar?");
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef(0);

  useEffect(() => {
    speakText("¡Hola! Vamos a armar algo muy bonito.");
  }, []);

  const selectTemplate = (type: TemplateType) => {
    initAudio();
    playSoundEffect('pop');
    setTemplate(type);
    setPlacedParts([]);
    setFeedback(TEMPLATES[type].prompt);
    speakText(TEMPLATES[type].prompt);
  };

  const addPart = (part: any) => {
    initAudio();
    playSoundEffect('pop');
    const newId = Date.now();
    const newPart: PlacedPart = {
      id: newId, type: part.type,
      x: 30 + (Math.random() * 5), y: 30 + (Math.random() * 5),
      width: part.w, height: part.h, color: part.color, renderType: part.renderType
    };
    setPlacedParts(prev => [...prev, newPart]);
    setDraggingId(newId);
  };

  const handlePointerDown = (id: number) => {
    initAudio();
    playSoundEffect('pop');
    setDraggingId(id);
    setPlacedParts(prev => {
      const part = prev.find(p => p.id === id);
      if (!part) return prev;
      return [...prev.filter(p => p.id !== id), part];
    });
  };

  const sendToBack = (e: any, id: number) => {
    e.stopPropagation();
    playSoundEffect('pop');
    setPlacedParts(prev => {
      const part = prev.find(p => p.id === id);
      if (!part) return prev;
      return [part, ...prev.filter(p => p.id !== id)];
    });
  };

  const handlePointerUp = () => {
    if (draggingId !== null) {
      playSoundEffect('drop');
    }
    setDraggingId(null);
  };

  const moveActivePart = (clientX: number, clientY: number) => {
    if (draggingId === null || !containerRef.current) return;
    
    // Throttled drag sound para no saturar el móvil
    const now = Date.now();
    if (now - lastMoveTimeRef.current > 120) {
      playSoundEffect('drag');
      lastMoveTimeRef.current = now;
    }

    const rect = containerRef.current.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    setPlacedParts(parts => parts.map(p => p.id === draggingId ? { ...p, x, y } : p));
  };

  const handleFinish = async () => {
    if (placedParts.length < 2) {
      speakText("¡Pon más piezas!");
      return;
    }
    initAudio();
    setIsFinished(true);
    playSoundEffect('complete');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 } });
    const msg = await getEncouragement("Bruno", "construcción");
    setFeedback(msg);
    speakText(msg);
  };

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-6 bg-orange-50">
        <h2 className="text-3xl font-kids text-orange-700 text-center animate-bounce">{feedback}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
          {(Object.keys(TEMPLATES) as TemplateType[]).map((type) => (
            <button
              key={type}
              onClick={() => selectTemplate(type)}
              className="bg-white p-6 rounded-[2.5rem] shadow-xl border-b-8 border-orange-200 hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-3"
            >
              <div className="p-4 bg-orange-50 rounded-full text-orange-500 scale-125">{TEMPLATES[type].icon}</div>
              <span className="text-xl font-kids text-gray-700 uppercase tracking-tighter">{TEMPLATES[type].name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${TEMPLATES[template].bg} transition-colors duration-500 relative`}>
      <div className="p-2 bg-white/60 backdrop-blur-sm border-b-2 border-orange-100 shrink-0 flex justify-between items-center px-4">
        <button onClick={() => { initAudio(); setTemplate(null); }} className="p-2 bg-orange-100 text-orange-600 rounded-xl font-kids text-xs flex items-center gap-1">
          <RotateCcw size={14} /> Volver
        </button>
        <h2 className="text-sm md:text-base font-kids text-orange-800 text-center flex-grow">{feedback}</h2>
        <div className="w-14" />
      </div>

      <div 
        ref={containerRef}
        onPointerMove={(e) => draggingId && moveActivePart(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex-grow relative overflow-hidden m-2 rounded-[2rem] border-4 border-white shadow-2xl touch-none bg-white/30"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-dashed border-black/5 w-40 h-60 rounded-3xl pointer-events-none" />

        {placedParts.map((part) => (
          <div
            key={part.id}
            onPointerDown={() => handlePointerDown(part.id)}
            style={{ left: `${part.x}%`, top: `${part.y}%`, position: 'absolute', transform: `translate(-50%, -50%) ${draggingId === part.id ? 'scale(1.1)' : 'scale(1)'}`, zIndex: draggingId === part.id ? 50 : 10 }}
            className="select-none"
          >
            <ShapeRenderer part={part} active={draggingId === part.id} />
            {draggingId === part.id && (
              <button
                onPointerDown={(e) => sendToBack(e, part.id)}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white animate-pop-in flex items-center justify-center"
              >
                <ArrowDownToLine size={20} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isFinished ? (
        <>
          <div className="p-4 bg-white/90 border-t-4 border-orange-100 shrink-0 overflow-x-auto no-scrollbar relative z-10">
            <div className="flex gap-4 min-w-max px-2 items-center pr-24">
              {TEMPLATES[template].parts.map((part, idx) => (
                <button
                  key={idx}
                  onClick={() => addPart(part)}
                  className="w-20 h-24 bg-white rounded-3xl shadow-lg border-b-4 border-gray-100 active:translate-y-1 flex flex-col items-center justify-center p-2"
                >
                  <div className="flex-grow flex items-center justify-center scale-[0.5]">
                    <ShapeRenderer part={{ ...part, width: part.w, height: part.h, id: 0, x: 0, y: 0 }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">{part.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleFinish}
            disabled={placedParts.length < 2}
            className={`fixed bottom-8 right-6 w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all active:scale-90 border-4 border-white
              ${placedParts.length >= 2 ? 'bg-green-500 animate-bounce' : 'bg-gray-400 opacity-50'}`}
          >
            <Check size={40} className="text-white" />
            <span className="absolute -top-2 bg-white text-green-600 px-2 rounded-full font-kids text-xs shadow-sm uppercase">Listo</span>
          </button>
        </>
      ) : (
        <div className="p-6 flex flex-col items-center bg-white gap-4">
          <button onClick={() => { initAudio(); onComplete(); }} className="bg-orange-500 text-white px-12 py-5 rounded-full text-3xl font-kids shadow-2xl animate-bounce">
            ¡BRAVO!
          </button>
        </div>
      )}
    </div>
  );
};

export default BuilderGame;
