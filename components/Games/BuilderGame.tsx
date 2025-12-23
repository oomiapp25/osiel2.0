
import React, { useState, useEffect, useRef } from 'react';
import { getEncouragement, speakText, playSoundEffect, initAudio } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Sparkles, RotateCcw, Home, Snowflake, Smile, ArrowDownToLine, Check, Car, Train, Rocket, Cat, ChevronRight } from 'lucide-react';

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
  renderType: 'rect' | 'triangle' | 'circle' | 'door' | 'window' | 'eye' | 'wheel' | 'whiskers' | 'cat-mouth' | 'tail' | 'pom-pom' | 'fin';
  name: string;
}

interface BlueprintPart {
  x: number;
  y: number;
  w: number;
  h: number;
  renderType: PlacedPart['renderType'];
  rotation?: number;
}

type TemplateType = 'house' | 'snowman' | 'clown' | 'car' | 'train' | 'rocket' | 'cat';

const TEMPLATE_SEQUENCE: TemplateType[] = ['house', 'snowman', 'clown', 'car', 'train', 'rocket', 'cat'];

const TEMPLATES: Record<TemplateType, { name: string, icon: any, parts: any[], blueprint: BlueprintPart[], bg: string, prompt: string }> = {
  house: {
    name: 'Casita',
    icon: <Home />,
    bg: 'bg-green-50',
    prompt: '¡Nivel 1! Construye una casita. Pon las paredes y el techo.',
    parts: [
      { type: 'wall', name: 'Pared', color: 'bg-orange-400', renderType: 'rect', w: 140, h: 100 },
      { type: 'roof', name: 'Techo', color: 'bg-red-500', renderType: 'triangle', w: 160, h: 80 },
      { type: 'door', name: 'Puerta', color: 'bg-amber-800', renderType: 'door', w: 45, h: 70 },
      { type: 'window', name: 'Ventana', color: 'bg-sky-200', renderType: 'window', w: 45, h: 45 },
    ],
    blueprint: [
      { x: 50, y: 60, w: 140, h: 100, renderType: 'rect' },
      { x: 50, y: 35, w: 160, h: 80, renderType: 'triangle' },
      { x: 50, y: 68, w: 45, h: 70, renderType: 'door' },
      { x: 70, y: 55, w: 40, h: 40, renderType: 'window' },
    ]
  },
  snowman: {
    name: 'Muñeco de Nieve',
    icon: <Snowflake />,
    bg: 'bg-blue-50',
    prompt: '¡Nivel 2! Hagamos un muñeco de nieve. Apila las bolas blancas.',
    parts: [
      { type: 'base', name: 'Bola Grande', color: 'bg-slate-50', renderType: 'circle', w: 130, h: 130 },
      { type: 'middle', name: 'Bola Media', color: 'bg-slate-50', renderType: 'circle', w: 95, h: 95 },
      { type: 'head', name: 'Cabeza', color: 'bg-slate-50', renderType: 'circle', w: 75, h: 75 },
      { type: 'nose', name: 'Nariz', color: 'bg-orange-500', renderType: 'triangle', w: 18, h: 30 },
      { type: 'hat', name: 'Sombrero', color: 'bg-zinc-800', renderType: 'rect', w: 65, h: 45 },
    ],
    blueprint: [
      { x: 50, y: 75, w: 130, h: 130, renderType: 'circle' },
      { x: 50, y: 55, w: 95, h: 95, renderType: 'circle' },
      { x: 50, y: 38, w: 75, h: 75, renderType: 'circle' },
      { x: 50, y: 38, w: 15, h: 25, renderType: 'triangle' },
      { x: 50, y: 22, w: 60, h: 40, renderType: 'rect' },
    ]
  },
  clown: {
    name: 'Payasito',
    icon: <Smile />,
    bg: 'bg-yellow-50',
    prompt: '¡Nivel 3! ¡Un payaso! Pon la cara y su nariz roja.',
    parts: [
      { type: 'face', name: 'Cara', color: 'bg-amber-50', renderType: 'circle', w: 140, h: 140 },
      { type: 'eye', name: 'Ojo', color: 'bg-black', renderType: 'eye', w: 22, h: 22 },
      { type: 'nose', name: 'Nariz Roja', color: 'bg-red-600', renderType: 'circle', w: 30, h: 30 },
      { type: 'hat', name: 'Gorro', color: 'bg-yellow-400', renderType: 'triangle', w: 110, h: 120 },
      { type: 'pom-pom', name: 'Pompón', color: 'bg-white', renderType: 'pom-pom', w: 25, h: 25 },
      { type: 'bowtie', name: 'Moño', color: 'bg-purple-500', renderType: 'rect', w: 100, h: 40 },
    ],
    blueprint: [
      { x: 50, y: 55, w: 140, h: 140, renderType: 'circle' },
      { x: 40, y: 50, w: 20, h: 20, renderType: 'eye' },
      { x: 60, y: 50, w: 20, h: 20, renderType: 'eye' },
      { x: 50, y: 60, w: 30, h: 30, renderType: 'circle' },
      { x: 50, y: 30, w: 110, h: 120, renderType: 'triangle' },
      { x: 50, y: 18, w: 25, h: 25, renderType: 'circle' },
      { x: 50, y: 80, w: 100, h: 40, renderType: 'rect' },
    ]
  },
  car: {
    name: 'Cochito',
    icon: <Car />,
    bg: 'bg-blue-100',
    prompt: '¡Nivel 4! Hagamos un coche. Pon las ruedas negras.',
    parts: [
      { type: 'body', name: 'Cuerpo', color: 'bg-red-500', renderType: 'rect', w: 170, h: 65 },
      { type: 'cabin', name: 'Cabina', color: 'bg-red-400', renderType: 'rect', w: 100, h: 45 },
      { type: 'window', name: 'Vidrio', color: 'bg-sky-100', renderType: 'rect', w: 70, h: 30 },
      { type: 'wheel', name: 'Rueda', color: 'bg-zinc-900', renderType: 'wheel', w: 50, h: 50 },
    ],
    blueprint: [
      { x: 50, y: 60, w: 170, h: 65, renderType: 'rect' },
      { x: 50, y: 45, w: 100, h: 45, renderType: 'rect' },
      { x: 35, y: 75, w: 50, h: 50, renderType: 'wheel' },
      { x: 65, y: 75, w: 50, h: 50, renderType: 'wheel' },
    ]
  },
  train: {
    name: 'Trencito',
    icon: <Train />,
    bg: 'bg-slate-100',
    prompt: '¡Nivel 5! ¡Chucu-chucu! Vamos a armar el trencito.',
    parts: [
      { type: 'engine', name: 'Máquina', color: 'bg-green-600', renderType: 'rect', w: 130, h: 90 },
      { type: 'chimney', name: 'Chimenea', color: 'bg-zinc-700', renderType: 'rect', w: 30, h: 45 },
      { type: 'wheel', name: 'Rueda Grande', color: 'bg-zinc-900', renderType: 'wheel', w: 45, h: 45 },
      { type: 'cabin', name: 'Cabina', color: 'bg-green-500', renderType: 'rect', w: 60, h: 60 },
    ],
    blueprint: [
      { x: 45, y: 65, w: 130, h: 90, renderType: 'rect' },
      { x: 35, y: 45, w: 30, h: 45, renderType: 'rect' },
      { x: 40, y: 80, w: 45, h: 45, renderType: 'wheel' },
      { x: 60, y: 80, w: 45, h: 45, renderType: 'wheel' },
      { x: 65, y: 55, w: 60, h: 60, renderType: 'rect' },
    ]
  },
  rocket: {
    name: 'Cohete',
    icon: <Rocket />,
    bg: 'bg-indigo-950',
    prompt: '¡Nivel 6! ¡A la luna! Hagamos un cohete espacial.',
    parts: [
      { type: 'fuselage', name: 'Cuerpo', color: 'bg-slate-50', renderType: 'rect', w: 70, h: 160 },
      { type: 'nosecone', name: 'Punta', color: 'bg-red-600', renderType: 'triangle', w: 70, h: 75 },
      { type: 'fin', name: 'Aleta', color: 'bg-red-500', renderType: 'fin', w: 45, h: 50 },
      { type: 'window', name: 'Ventanilla', color: 'bg-sky-200', renderType: 'circle', w: 35, h: 35 },
    ],
    blueprint: [
      { x: 50, y: 60, w: 70, h: 160, renderType: 'rect' },
      { x: 50, y: 25, w: 70, h: 75, renderType: 'triangle' },
      { x: 40, y: 75, w: 45, h: 50, renderType: 'fin', rotation: 180 },
      { x: 60, y: 75, w: 45, h: 50, renderType: 'fin' },
      { x: 50, y: 55, w: 35, h: 35, renderType: 'circle' },
    ]
  },
  cat: {
    name: 'Gatito',
    icon: <Cat />,
    bg: 'bg-purple-100',
    prompt: '¡Nivel 7! Hagamos un gatito suave.',
    parts: [
      { type: 'body', name: 'Cuerpo', color: 'bg-orange-300', renderType: 'circle', w: 120, h: 120 },
      { type: 'head', name: 'Cabeza', color: 'bg-orange-200', renderType: 'circle', w: 90, h: 90 },
      { type: 'ear', name: 'Oreja', color: 'bg-orange-400', renderType: 'triangle', w: 35, h: 35 },
      { type: 'eye', name: 'Ojo', color: 'bg-black', renderType: 'eye', w: 14, h: 14 },
      { type: 'tail', name: 'Cola', color: 'bg-orange-400', renderType: 'tail', w: 25, h: 80 },
      { type: 'whiskers', name: 'Bigotes', color: 'text-zinc-400', renderType: 'whiskers', w: 60, h: 30 },
      { type: 'mouth', name: 'Boca', color: 'text-pink-400', renderType: 'cat-mouth', w: 35, h: 20 },
    ],
    blueprint: [
      { x: 50, y: 70, w: 120, h: 120, renderType: 'circle' },
      { x: 50, y: 40, w: 90, h: 90, renderType: 'circle' },
      { x: 40, y: 30, w: 30, h: 30, renderType: 'triangle' },
      { x: 60, y: 30, w: 30, h: 30, renderType: 'triangle' },
      { x: 40, y: 40, w: 14, h: 14, renderType: 'eye' },
      { x: 60, y: 40, w: 14, h: 14, renderType: 'eye' },
      { x: 50, y: 48, w: 35, h: 20, renderType: 'cat-mouth' },
      { x: 68, y: 65, w: 25, h: 80, renderType: 'tail' },
    ]
  }
};

const ShapeRenderer: React.FC<{ part: PlacedPart | any, active?: boolean, isGhost?: boolean }> = ({ part, active, isGhost }) => {
  const style = { 
    width: `${part.width || part.w}px`, 
    height: `${part.height || part.h}px`,
    opacity: isGhost ? 0.25 : 1,
  };
  
  const commonClasses = isGhost 
    ? `border-4 border-dashed border-gray-400 bg-transparent relative overflow-hidden`
    : `border-4 border-black/10 shadow-lg relative overflow-hidden ${active ? 'ring-4 ring-yellow-400 scale-110 shadow-2xl' : ''}`;
  
  const GlossyOverlay = () => isGhost ? null : (
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/30 to-transparent opacity-60" />
  );

  switch (part.renderType) {
    case 'triangle':
      return (
        <div className="relative" style={{ filter: active ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))' : 'none' }}>
          <div 
            style={{
              width: 0, height: 0,
              borderLeft: `${(part.width || part.w) / 2}px solid transparent`,
              borderRight: `${(part.width || part.w) / 2}px solid transparent`,
              borderBottom: `${(part.height || part.h)}px solid ${isGhost ? '#cbd5e1' : 'currentColor'}`,
              borderRadius: '8px',
              borderStyle: isGhost ? 'dashed' : 'solid'
            }}
            className={isGhost ? '' : (part.color || '').replace('bg-', 'text-')}
          />
        </div>
      );
    case 'circle': 
      return (
        <div style={style} className={`${isGhost ? 'rounded-full border-4 border-dashed border-gray-300' : `${part.color} rounded-full ${commonClasses}`}`}>
          <GlossyOverlay />
        </div>
      );
    case 'wheel': 
      return (
        <div style={style} className={`${isGhost ? 'rounded-full border-4 border-dashed border-gray-300' : `bg-zinc-900 rounded-full border-4 border-zinc-700 shadow-md relative flex items-center justify-center ${active ? 'scale-110' : ''}`}`}>
          {!isGhost && (
            <div className="w-1/2 h-1/2 bg-zinc-600 rounded-full border-2 border-zinc-400 flex items-center justify-center">
               <div className="w-1/3 h-1/3 bg-zinc-800 rounded-full" />
            </div>
          )}
          <GlossyOverlay />
        </div>
      );
    case 'eye': 
      return (
        <div style={style} className={`${isGhost ? 'rounded-full border-2 border-dashed border-gray-300' : `bg-white rounded-full border-2 border-black/20 flex items-center justify-center overflow-hidden shadow-inner`}`}>
          {!isGhost && (
            <div className="w-3/5 h-3/5 bg-black rounded-full relative">
              <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80" />
            </div>
          )}
        </div>
      );
    case 'door': 
      return (
        <div style={style} className={`${isGhost ? 'border-4 border-dashed border-gray-300 rounded-t-2xl' : `${part.color} ${commonClasses} rounded-t-2xl`}`}>
          {!isGhost && <div className="absolute right-2 top-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black/20 shadow-sm" />}
          <GlossyOverlay />
        </div>
      );
    case 'window': 
      return (
        <div style={style} className={`${isGhost ? 'border-4 border-dashed border-gray-300 rounded-xl' : `${part.color} border-4 border-white/80 rounded-xl grid grid-cols-2 grid-rows-2 shadow-lg`}`}>
          {!isGhost && (
            <>
              <div className="border border-white/40" /><div className="border border-white/40" />
              <div className="border border-white/40" /><div className="border border-white/40" />
            </>
          )}
          <GlossyOverlay />
        </div>
      );
    case 'whiskers':
      return (
        <div style={style} className="flex flex-col justify-center items-center gap-3">
          <div className={`w-full h-[3px] ${isGhost ? 'bg-gray-300' : 'bg-zinc-400/80'} rounded-full rotate-2`} />
          <div className={`w-full h-[3px] ${isGhost ? 'bg-gray-300' : 'bg-zinc-400/80'} rounded-full -rotate-1`} />
          <div className={`w-full h-[3px] ${isGhost ? 'bg-gray-300' : 'bg-zinc-400/80'} rounded-full -rotate-3`} />
        </div>
      );
    case 'cat-mouth':
      return (
        <svg viewBox="0 0 35 20" style={style}>
          <path d="M5,5 Q12,18 17.5,5 Q23,18 30,5" fill="none" stroke={isGhost ? "#cbd5e1" : "#F472B6"} strokeWidth="4" strokeLinecap="round" strokeDasharray={isGhost ? "4 2" : "none"} />
        </svg>
      );
    case 'tail':
      return (
        <div style={{ ...style, borderRadius: '40px 40px 10px 10px', transform: 'rotate(15deg)', borderStyle: isGhost ? 'dashed' : 'solid', borderColor: isGhost ? '#cbd5e1' : 'rgba(0,0,0,0.05)' }} className={`${isGhost ? 'border-4' : `${part.color} border-4 shadow-inner relative`}`}>
          <GlossyOverlay />
        </div>
      );
    case 'pom-pom':
      return (
        <div style={style} className={`${isGhost ? 'rounded-full border-2 border-dashed border-gray-300' : `bg-white rounded-full border-2 border-zinc-200 shadow-md`}`}>
           {!isGhost && <div className="absolute inset-0 border-4 border-white/30 rounded-full blur-[1px]" />}
        </div>
      );
    case 'fin':
      return (
        <div style={{ ...style, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} className={`${isGhost ? 'bg-gray-200 opacity-20' : `${part.color} shadow-lg relative`}`}>
          <GlossyOverlay />
        </div>
      );
    default: 
      return (
        <div style={style} className={`${isGhost ? 'border-4 border-dashed border-gray-300 rounded-2xl' : `${part.color} rounded-2xl ${commonClasses}`}`}>
          <GlossyOverlay />
        </div>
      );
  }
};

const BuilderGame: React.FC<BuilderGameProps> = ({ level, onComplete }) => {
  const templateIndex = Math.min(level - 1, TEMPLATE_SEQUENCE.length - 1);
  const currentTemplateType = TEMPLATE_SEQUENCE[templateIndex];
  
  const [placedParts, setPlacedParts] = useState<PlacedPart[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef(0);

  useEffect(() => {
    setPlacedParts([]);
    setIsFinished(false);
    const templateData = TEMPLATES[currentTemplateType];
    setFeedback(templateData.prompt);
    
    const timer = setTimeout(() => {
      speakText(templateData.prompt, { pitch: 0.85 });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [level, currentTemplateType]);

  const addPart = (part: any) => {
    initAudio();
    playSoundEffect('pop');
    speakText(`¡Una ${part.name}!`, { pitch: 0.9, rate: 1.1 });
    const newId = Date.now() + Math.random();
    const newPart: PlacedPart = {
      id: newId, type: part.type, name: part.name,
      x: 20 + (Math.random() * 20), y: 30 + (Math.random() * 20),
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

  const handlePartHover = (partName: string) => {
    if (isFinished) return;
    playSoundEffect('pop');
    speakText(`¡${partName}!`, { pitch: 0.85 });
  };

  const sendToBack = (e: React.PointerEvent, id: number) => {
    e.stopPropagation();
    playSoundEffect('pop');
    setPlacedParts(prev => {
      const part = prev.find(p => p.id === id);
      if (!part) return prev;
      return [part, ...prev.filter(p => p.id !== id)];
    });
  };

  const moveActivePart = (clientX: number, clientY: number) => {
    if (draggingId === null || !containerRef.current) return;
    
    const now = Date.now();
    if (now - lastMoveTimeRef.current > 150) {
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
      speakText("¡Pon más piezas!", { pitch: 0.8 });
      return;
    }
    initAudio();
    setIsFinished(true);
    playSoundEffect('complete');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 } });
    const msg = await getEncouragement("Bruno", "construcción");
    setFeedback(msg);
    speakText(msg, { pitch: 0.85 });
  };

  const handleNextLevel = () => {
    initAudio();
    playSoundEffect('pop');
    onComplete();
  };

  const currentTemplateData = TEMPLATES[currentTemplateType];

  return (
    <div className={`flex flex-col h-full ${currentTemplateData.bg} transition-colors duration-500 relative select-none`}>
      <header className="p-3 md:p-4 bg-white/80 backdrop-blur-md border-b-4 border-black/5 flex justify-between items-center px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-orange-500 rounded-2xl text-white shadow-lg animate-bounce">
             {currentTemplateData.icon}
           </div>
           <div className="flex flex-col">
             <span className="font-kids text-orange-800 text-xs md:text-sm uppercase opacity-50">Constructor</span>
             <span className="font-kids text-orange-900 text-sm md:text-xl">Nivel {level}</span>
           </div>
        </div>
        <h2 className="text-sm md:text-xl font-kids text-orange-800 text-center flex-grow max-w-[50%] line-clamp-1 bg-white/50 px-4 py-2 rounded-full">
          {feedback}
        </h2>
        <div className="w-16 md:w-20" />
      </header>

      <div 
        ref={containerRef}
        onPointerMove={(e) => draggingId !== null && moveActivePart(e.clientX, e.clientY)}
        onPointerUp={() => { if(draggingId !== null) playSoundEffect('drop'); setDraggingId(null); }}
        onPointerLeave={() => setDraggingId(null)}
        className="flex-grow relative overflow-hidden m-2 md:m-6 rounded-[2.5rem] md:rounded-[4rem] border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] touch-none bg-white/60"
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Silhouette Blueprint Guide */}
        {currentTemplateData.blueprint.map((bp, i) => (
          <div
            key={`bp-${i}`}
            style={{ 
              left: `${bp.x}%`, 
              top: `${bp.y}%`, 
              position: 'absolute', 
              transform: `translate(-50%, -50%) rotate(${bp.rotation || 0}deg)`, 
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            <ShapeRenderer part={bp} isGhost={true} />
          </div>
        ))}

        {placedParts.map((part) => (
          <div
            key={part.id}
            onPointerDown={() => handlePointerDown(part.id)}
            style={{ 
              left: `${part.x}%`, 
              top: `${part.y}%`, 
              position: 'absolute', 
              transform: `translate(-50%, -50%)`, 
              zIndex: draggingId === part.id ? 100 : 10 
            }}
            className="select-none cursor-pointer transition-transform duration-75"
          >
            <ShapeRenderer part={part} active={draggingId === part.id} />
            {draggingId === part.id && !isFinished && (
              <button
                onPointerDown={(e) => sendToBack(e, part.id)}
                className="absolute -top-16 left-1/2 -translate-x-1/2 bg-blue-500 text-white w-12 h-12 rounded-full shadow-2xl border-4 border-white animate-pop-in flex items-center justify-center z-[110] active:scale-90"
              >
                <ArrowDownToLine size={24} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isFinished ? (
        <div className="p-4 md:p-8 bg-white/95 border-t-8 border-black/5 shrink-0 relative z-40">
          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-2 px-2 items-center">
            {currentTemplateData.parts.map((part, idx) => (
              <button
                key={idx}
                onPointerDown={() => { initAudio(); addPart(part); }}
                onPointerEnter={() => handlePartHover(part.name)}
                className="w-24 h-28 md:w-32 md:h-36 bg-white rounded-[2.5rem] shadow-[0_10px_20px_rgba(0,0,0,0.05)] border-b-8 border-slate-100 active:translate-y-2 flex flex-col items-center justify-center p-3 hover:bg-orange-50 transition-all shrink-0 group"
              >
                <div className="flex-grow flex items-center justify-center scale-[0.6] group-hover:scale-[0.7] transition-transform">
                  <ShapeRenderer part={{ ...part, width: part.w, height: part.h, id: 0, x: 0, y: 0 }} />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{part.name}</span>
              </button>
            ))}
            <div className="w-24 md:w-32 shrink-0" />
          </div>
          
          <button
            onClick={handleFinish}
            disabled={placedParts.length < 2}
            className={`absolute -top-16 right-6 md:right-12 w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl z-50 flex flex-col items-center justify-center transition-all active:scale-95 border-8 border-white
              ${placedParts.length >= 2 ? 'bg-green-500 animate-bounce' : 'bg-slate-300 opacity-50'}`}
          >
            <Check size={40} className="text-white md:size-56" />
            <span className="text-white font-kids text-xs md:text-sm uppercase mt-1">¡Listo!</span>
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 md:p-8 animate-pop-in">
          <div className="bg-white p-10 md:p-16 rounded-[4rem] md:rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] text-center border-8 border-green-100 max-w-sm md:max-w-lg w-full">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500 animate-wiggle">
              <Sparkles size={48} />
            </div>
            <h3 className="text-4xl md:text-6xl font-kids text-green-600 mb-6 animate-bounce uppercase tracking-tight">¡LO LOGRASTE!</h3>
            <p className="text-slate-500 mb-10 font-kids text-lg md:text-2xl italic leading-tight">"{feedback}"</p>
            <button 
              onClick={handleNextLevel} 
              className="bg-orange-500 text-white w-full py-6 md:py-10 rounded-full text-2xl md:text-4xl font-kids shadow-[0_20px_40px_rgba(249,115,22,0.3)] hover:bg-orange-600 active:translate-y-2 transition-all border-b-[12px] border-orange-700 flex items-center justify-center gap-4"
            >
              ¡SIGUIENTE NIVEL! <ChevronRight size={40} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderGame;
