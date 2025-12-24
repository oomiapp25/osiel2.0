
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
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activeColor, setActiveColor] = useState(PALETTE[0].hex);
  const [brushSize, setBrushSize] = useState(15);
  const [paperType, setPaperType] = useState<PaperType>('blank');
  const [feedback, setFeedback] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  // Refs cruciales para el motor de dibujo sin lag
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const hueRef = useRef(0);

  useEffect(() => {
    initCanvas();
    const init = async () => {
      const msg = await getDynamicInstruction("drawing", "un dibujo");
      setFeedback(msg);
      speakText(msg);
    };
    init();
    
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [level]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    
    // Configurar dimensiones reales y visuales
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fondo blanco inicial
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFinished) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (['pencil', 'eraser', 'magic'].includes(activeTool)) {
      isDrawingRef.current = true;
      lastXRef.current = x;
      lastYRef.current = y;
      
      // Empezar punto inicial
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      setupContext(ctx);
      ctx.stroke();
    } else {
      drawStamp(x, y, activeTool as Tool);
      setStrokeCount(s => s + 1);
      playSoundEffect('stamp');
    }
  };

  const setupContext = (ctx: CanvasRenderingContext2D) => {
    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = brushSize * 4;
    } else if (activeTool === 'magic') {
      hueRef.current = (hueRef.current + 10) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 100%, 50%)`;
      ctx.lineWidth = brushSize;
    } else {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isFinished) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);
    setupContext(ctx);
    ctx.stroke();
    
    lastXRef.current = x;
    lastYRef.current = y;
    
    if (Math.random() > 0.97) playSoundEffect('paint');
  };

  const handleEnd = () => {
    if (isDrawingRef.current) {
      setStrokeCount(s => s + 1);
      isDrawingRef.current = false;
    }
  };

  const drawStamp = (x: number, y: number, type: Tool) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = activeColor;
    const size = brushSize * 5;

    ctx.beginPath();
    if (type === 'circle') {
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    } else if (type === 'square') {
      ctx.rect(x - size / 2, y - size / 2, size, size);
    } else if (type === 'triangle') {
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
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    playSoundEffect('pop');
    speakText("Lienzo reiniciado.", { pitch: 1.0 });
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

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mi-obra-leo-leon-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    playSoundEffect('pop');
  };

  const PaperBackground = () => (
    <div className="absolute inset-0 pointer-events-none opacity-10 transition-opacity duration-300">
      {paperType === 'grid' && (
        <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      )}
      {paperType === 'dots' && (
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '30px 30px' }} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 transition-colors duration-500 relative select-none">
      <header className="p-3 md:p-5 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 flex justify-between items-center px-4 md:px-10 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl text-white shadow-xl">
             <Palette size={32} />
           </div>
           <div className="flex flex-col">
             <h1 className="font-kids text-slate-800 text-lg md:text-3xl leading-none">Estudio de Leo León</h1>
             <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Lienzo Creativo Profesional</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPaperType(p => p === 'blank' ? 'grid' : p === 'grid' ? 'dots' : 'blank')}
            className="bg-slate-50 p-3 rounded-2xl shadow-sm text-slate-600 hover:bg-white active:scale-90 border border-slate-200 transition-all flex items-center gap-2"
            title="Cambiar tipo de papel"
          >
            <Grid3X3 size={24} />
            <span className="hidden lg:inline text-xs font-bold uppercase">{paperType === 'blank' ? 'Blanco' : paperType === 'grid' ? 'Cuadrícula' : 'Puntos'}</span>
          </button>
          <button 
            onClick={clearCanvas}
            className="bg-red-50 p-3 rounded-2xl shadow-sm text-red-500 hover:bg-white active:scale-90 border border-red-100 transition-all"
            title="Borrar todo"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </header>

      <div className="flex-grow flex relative m-2 md:m-6 rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white ring-1 ring-slate-200 bg-white">
        <PaperBackground />
        <canvas 
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />

        {/* Barra Lateral de Herramientas Izquierda */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40 bg-white/80 p-3 rounded-[2.5rem] shadow-2xl border border-white backdrop-blur-sm">
          {[
            { id: 'pencil', icon: <Pencil />, label: 'Lápiz' },
            { id: 'magic', icon: <Wand2 />, label: 'Magia' },
            { id: 'eraser', icon: <Eraser />, label: 'Goma' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id as Tool); playSoundEffect('pop'); }}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 group relative
                ${activeTool === tool.id ? 'bg-orange-600 text-white scale-110 shadow-orange-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              {tool.icon}
              <span className="text-[8px] md:text-[10px] font-bold uppercase mt-1 opacity-60">{tool.label}</span>
              {activeTool === tool.id && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-orange-400 rounded-full" />}
            </button>
          ))}
          <div className="h-px bg-slate-100 mx-2" />
          {[
            { id: 'circle', icon: <Circle /> },
            { id: 'square', icon: <Square /> },
            { id: 'triangle', icon: <Triangle /> }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id as Tool); playSoundEffect('pop'); }}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] shadow-lg flex items-center justify-center transition-all active:scale-95
                ${activeTool === tool.id ? 'bg-blue-600 text-white scale-110 shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Control de Grosor Derecha */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 bg-white/80 p-4 rounded-full shadow-2xl border border-white backdrop-blur-sm z-40">
          <button onClick={() => setBrushSize(s => Math.min(80, s + 5))} className="p-3 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-100 active:scale-90 transition-all"><Plus size={24} /></button>
          <div className="w-10 h-40 md:h-64 bg-slate-100 rounded-full relative flex flex-col items-center justify-end p-1.5 overflow-hidden">
            <div 
              className="w-full bg-gradient-to-t from-orange-500 to-red-400 rounded-full transition-all duration-300 shadow-inner" 
              style={{ height: `${(brushSize / 80) * 100}%` }}
            />
          </div>
          <button onClick={() => setBrushSize(s => Math.max(2, s - 5))} className="p-3 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-100 active:scale-90 transition-all"><Minus size={24} /></button>
          <div className="mt-2 w-12 h-12 rounded-2xl border-2 border-slate-200 flex items-center justify-center bg-white shadow-inner overflow-hidden">
            <div className="bg-slate-800 rounded-full" style={{ width: brushSize/2, height: brushSize/2 }} />
          </div>
        </div>
      </div>

      {/* Footer de Colores */}
      <div className="p-4 md:p-8 bg-white/95 shrink-0 relative z-40 border-t-2 border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-6xl mx-auto mb-2">
          {PALETTE.map(color => (
            <button
              key={color.hex}
              onClick={() => { setActiveColor(color.hex); playSoundEffect('pop'); if(activeTool==='eraser') setActiveTool('pencil'); }}
              style={{ backgroundColor: color.hex }}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-3xl border-4 transition-all active:scale-90 shadow-lg relative group
                ${activeColor === color.hex && activeTool !== 'eraser' && activeTool !== 'magic' ? 'border-orange-500 scale-125 -translate-y-3 ring-8 ring-orange-50' : 'border-white hover:scale-110'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent rounded-[inherit]" />
              {activeColor === color.hex && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full animate-bounce" />}
            </button>
          ))}
        </div>
        
        {/* Botones de acción flotantes */}
        <div className="absolute -top-16 right-8 flex gap-4">
          <button
            onClick={saveImage}
            className="w-20 h-20 bg-blue-500 text-white rounded-full shadow-2xl flex flex-col items-center justify-center transition-all hover:bg-blue-600 active:scale-95 border-4 border-white"
            title="Guardar imagen"
          >
            <Download size={32} />
            <span className="text-[10px] font-bold uppercase mt-1">Guardar</span>
          </button>
          <button
            onClick={handleFinish}
            className={`w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all active:scale-95 border-8 border-white group
              ${strokeCount > 0 ? 'bg-green-500 animate-bounce cursor-pointer' : 'bg-slate-200 cursor-not-allowed opacity-50'}`}
          >
            <Check size={48} className="text-white group-hover:scale-110 transition-transform" />
            <span className="text-white font-kids text-xs md:text-xl uppercase mt-1">¡Listo!</span>
          </button>
        </div>

        {/* Modal de Finalización */}
        {isFinished && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-8 animate-pop-in">
            <div className="text-center bg-white p-12 md:p-24 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-8 border-orange-100 max-w-5xl">
              <div className="w-40 h-40 md:w-60 md:h-60 bg-gradient-to-br from-orange-400 to-red-500 rounded-[4rem] flex items-center justify-center mx-auto mb-12 text-white animate-wiggle shadow-2xl rotate-6">
                <Sparkles size={100} />
              </div>
              <h3 className="text-5xl md:text-9xl font-kids text-slate-900 mb-8 uppercase tracking-tighter leading-none">¡OBRA DE ARTE!</h3>
              <p className="text-slate-400 mb-16 font-kids text-2xl md:text-5xl italic leading-tight px-10">"{feedback}"</p>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                 <button 
                  onClick={onComplete} 
                  className="bg-orange-600 text-white px-12 py-8 md:px-24 md:py-12 rounded-full text-3xl md:text-6xl font-kids shadow-[0_20px_40px_rgba(234,88,12,0.4)] hover:bg-orange-700 active:translate-y-2 transition-all border-b-[16px] border-orange-800 flex items-center justify-center gap-6"
                >
                  SIGUIENTE <ChevronRight size={80} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingGame;
