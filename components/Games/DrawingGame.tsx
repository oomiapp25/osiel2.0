
import React, { useState, useEffect, useRef } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction, initAudio } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Pencil, Eraser, Circle, Square, Triangle, Trash2, Check, Sparkles, ChevronRight, Palette, Wand2, Grid3X3, Minus, Plus, Download } from 'lucide-react';

interface DrawingGameProps {
  level: number;
  onComplete: () => void;
}

type Tool = 'pencil' | 'eraser' | 'circle' | 'square' | 'triangle' | 'magic';
type PaperType = 'blank' | 'grid' | 'dots';

const PALETTE = [
  { name: 'Rojo', hex: '#FF595E' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Amarillo', hex: '#FFCA3A' },
  { name: 'Verde', hex: '#8AC926' },
  { name: 'Azul', hex: '#1982C4' },
  { name: 'Morado', hex: '#6A4C93' },
  { name: 'Rosa', hex: '#F472B6' },
  { name: 'Negro', hex: '#1F2937' }
];

const DrawingGame: React.FC<DrawingGameProps> = ({ level, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activeColor, setActiveColor] = useState(PALETTE[0].hex);
  const [brushSize, setBrushSize] = useState(15);
  const [paperType, setPaperType] = useState<PaperType>('blank');
  const [feedback, setFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const hueRef = useRef(0);

  // Inicialización y gestión de eventos nativos para máxima compatibilidad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const msg = await getDynamicInstruction("drawing", "un dibujo");
      setFeedback(msg);
      speakText(msg);
    };
    init();

    const setupCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    };

    setupCanvas();

    // Handlers directos al DOM para evitar problemas con eventos sintéticos de React en tablets
    const onPointerDown = (e: PointerEvent) => {
      if (isFinished) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (['pencil', 'eraser', 'magic'].includes(activeTool)) {
        isDrawingRef.current = true;
        lastXRef.current = x;
        lastYRef.current = y;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        applyBrushSettings(ctx);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        drawStamp(ctx, x, y, activeTool as Tool);
        setStrokeCount(s => s + 1);
        playSoundEffect('stamp');
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current || isFinished) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastXRef.current, lastYRef.current);
      applyBrushSettings(ctx);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      lastXRef.current = x;
      lastYRef.current = y;
      
      if (Math.random() > 0.98) playSoundEffect('paint');
    };

    const onPointerUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setStrokeCount(s => s + 1);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [level, activeTool, activeColor, brushSize, isFinished]);

  const applyBrushSettings = (ctx: CanvasRenderingContext2D) => {
    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize * 4;
    } else if (activeTool === 'magic') {
      hueRef.current = (hueRef.current + 3) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 100%, 50%)`;
      ctx.lineWidth = brushSize;
    } else {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
    }
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number, type: Tool) => {
    ctx.fillStyle = activeColor;
    const size = brushSize * 4;
    ctx.beginPath();
    if (type === 'circle') ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    else if (type === 'square') ctx.rect(x - size / 2, y - size / 2, size, size);
    else if (type === 'triangle') {
      ctx.moveTo(x, y - size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.closePath();
    }
    ctx.fill();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    playSoundEffect('pop');
    setStrokeCount(0);
  };

  const handleFinish = async () => {
    initAudio();
    setIsFinished(true);
    playSoundEffect('complete');
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    const msg = await getEncouragement("Leo", "dibujo");
    setFeedback(msg);
    speakText(msg);
  };

  const PaperBackground = () => (
    <div className="absolute inset-0 pointer-events-none opacity-5 transition-opacity duration-300">
      {paperType === 'grid' && (
        <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      )}
      {paperType === 'dots' && (
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '40px 40px' }} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 transition-colors duration-500 relative select-none">
      <header className="p-2 md:p-4 bg-white border-b-2 border-slate-100 flex justify-between items-center px-4 md:px-8 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
           <div className="p-2 md:p-3 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl text-white shadow-lg">
             <Palette size={24} className="md:w-8 md:h-8" />
           </div>
           <div className="flex flex-col">
             <h1 className="font-kids text-slate-800 text-sm md:text-2xl leading-tight">Estudio Artístico Pro</h1>
             <p className="text-[8px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Lienzo Creativo para Tablets</p>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setPaperType(p => p === 'blank' ? 'grid' : p === 'grid' ? 'dots' : 'blank'); playSoundEffect('pop'); }}
            className="bg-slate-50 p-2 md:p-3 rounded-xl text-slate-600 hover:bg-white border border-slate-200 transition-colors"
          >
            <Grid3X3 size={20} className="md:w-6 md:h-6" />
          </button>
          <button onClick={clearCanvas} className="bg-red-50 p-2 md:p-3 rounded-xl text-red-500 border border-red-100 active:bg-red-100 transition-colors">
            <Trash2 size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <div className="flex-grow flex relative m-2 md:m-4 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl border-4 md:border-8 border-white bg-white ring-1 ring-slate-200">
        <PaperBackground />
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />

        {/* Barra de Herramientas Izquierda con Animación de Selección */}
        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-4 z-40 bg-white/90 p-2 rounded-3xl shadow-xl border border-white backdrop-blur-sm">
          {[
            { id: 'pencil', icon: <Pencil size={20} />, color: 'bg-orange-500' },
            { id: 'magic', icon: <Wand2 size={20} />, color: 'bg-orange-500' },
            { id: 'eraser', icon: <Eraser size={20} />, color: 'bg-orange-500' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id as Tool); playSoundEffect('pop'); }}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                ${activeTool === tool.id ? `${tool.color} text-white scale-110 shadow-lg animate-wiggle` : 'bg-white text-slate-400 hover:text-orange-400'}`}
            >
              {tool.icon}
            </button>
          ))}
          <div className="h-px bg-slate-100 mx-2" />
          {[
            { id: 'circle', icon: <Circle size={20} />, color: 'bg-blue-500' },
            { id: 'square', icon: <Square size={20} />, color: 'bg-blue-500' },
            { id: 'triangle', icon: <Triangle size={20} />, color: 'bg-blue-500' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id as Tool); playSoundEffect('pop'); }}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                ${activeTool === t.id ? `${t.color} text-white scale-110 shadow-lg animate-wiggle` : 'bg-white text-slate-400 hover:text-blue-400'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Control de Grosor Derecha */}
        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-white/90 p-3 rounded-full shadow-xl border border-white z-40 backdrop-blur-sm">
          <button onClick={() => { setBrushSize(s => Math.min(80, s + 5)); playSoundEffect('pop'); }} className="p-1 md:p-2 text-slate-600 hover:text-orange-500 transition-colors"><Plus size={20}/></button>
          <div className="w-6 h-32 md:h-48 bg-slate-100 rounded-full relative flex flex-col items-center justify-end p-1 overflow-hidden shadow-inner">
            <div className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-full transition-all duration-300" style={{ height: `${(brushSize / 80) * 100}%` }} />
          </div>
          <button onClick={() => { setBrushSize(s => Math.max(2, s - 5)); playSoundEffect('pop'); }} className="p-1 md:p-2 text-slate-600 hover:text-orange-500 transition-colors"><Minus size={20}/></button>
        </div>
      </div>

      <footer className="p-3 md:p-6 bg-white shrink-0 z-40 border-t-2 border-slate-50 shadow-inner">
        <div className="flex flex-wrap justify-center gap-3 md:gap-5 max-w-4xl mx-auto">
          {PALETTE.map(color => (
            <button
              key={color.hex}
              onClick={() => { setActiveColor(color.hex); playSoundEffect('pop'); if(activeTool==='eraser') setActiveTool('pencil'); }}
              style={{ backgroundColor: color.hex }}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-2 transition-all shadow-md active:scale-90
                ${activeColor === color.hex && activeTool !== 'eraser' && activeTool !== 'magic' ? 'scale-125 border-slate-900 ring-4 ring-orange-50' : 'border-white hover:scale-110'}`}
            />
          ))}
        </div>
        
        <div className="absolute -top-14 right-4 md:right-8 flex gap-3">
          <button 
            onClick={handleFinish} 
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex flex-col items-center justify-center border-8 border-white transition-all active:scale-95
              ${strokeCount > 0 ? 'bg-green-500 animate-bounce' : 'bg-slate-200 opacity-50 cursor-not-allowed'}`}
          >
            <Check size={32} className="text-white md:w-12 md:h-12" />
            <span className="text-white font-kids text-[10px] md:text-sm uppercase tracking-tighter">¡Listo!</span>
          </button>
        </div>
      </footer>

      {isFinished && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6 animate-pop-in">
          <div className="text-center bg-white p-10 md:p-20 rounded-[3rem] md:rounded-[5rem] shadow-2xl border-4 md:border-8 border-orange-100 max-w-2xl w-full">
            <div className="w-24 h-24 md:w-40 md:h-40 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-orange-500 animate-wiggle">
              <Sparkles size={64} className="md:w-24 md:h-24" />
            </div>
            <h3 className="text-4xl md:text-7xl font-kids text-slate-900 mb-6 uppercase tracking-tight">¡OBRA MAESTRA!</h3>
            <p className="text-slate-400 mb-10 font-kids text-lg md:text-2xl italic leading-tight">"{feedback}"</p>
            <button 
              onClick={onComplete} 
              className="bg-orange-600 text-white px-8 py-6 md:px-16 md:py-8 rounded-full text-2xl md:text-4xl font-kids shadow-xl border-b-8 border-orange-800 flex items-center justify-center gap-4 mx-auto active:translate-y-2 transition-all"
            >
              ¡SIGUIENTE! <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingGame;
