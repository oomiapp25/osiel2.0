
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getEncouragement, speakText, playSoundEffect, getDynamicInstruction, initAudio } from '../../services/geminiService.ts';
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Pencil, Eraser, Circle, Square, Triangle, Trash2, Check, Sparkles, ChevronRight, Palette, Wand2, Grid3X3, Minus, Plus } from 'lucide-react';

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

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hueRef = useRef(0);
  
  const settingsRef = useRef({
    tool: activeTool,
    color: activeColor,
    size: brushSize
  });

  useEffect(() => {
    settingsRef.current = { tool: activeTool, color: activeColor, size: brushSize };
  }, [activeTool, activeColor, brushSize]);

  useEffect(() => {
    const init = async () => {
      const msg = await getDynamicInstruction("drawing", "un dibujo");
      setFeedback(msg);
      speakText(msg);
    };
    init();
  }, [level]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      
      // Guardar lo pintado
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Restaurar
        if (tempCanvas.width > 0) {
          ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
        ctxRef.current = ctx;
      }
    };

    setupCanvas();
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(containerRef.current!);
    return () => ro.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isFinished) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    lastPosRef.current = { x, y };

    const { tool, color, size } = settingsRef.current;
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (['pencil', 'eraser', 'magic'].includes(tool)) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      applyStyles(ctx);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      drawStamp(x, y, ctx, tool, color, size);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current || isFinished) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (['pencil', 'eraser', 'magic'].includes(settingsRef.current.tool)) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      applyStyles(ctx);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPosRef.current = { x, y };
      if (Math.random() > 0.95) playSoundEffect('paint');
    }
  };

  const applyStyles = (ctx: CanvasRenderingContext2D) => {
    const { tool, color, size } = settingsRef.current;
    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = size * 3;
    } else if (tool === 'magic') {
      hueRef.current = (hueRef.current + 10) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 100%, 50%)`;
      ctx.lineWidth = size;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
  };

  const drawStamp = (x: number, y: number, ctx: CanvasRenderingContext2D, tool: string, color: string, size: number) => {
    ctx.fillStyle = color;
    const s = size * 4;
    ctx.beginPath();
    if (tool === 'circle') ctx.arc(x, y, s/2, 0, Math.PI*2);
    else if (tool === 'square') ctx.rect(x - s/2, y - s/2, s, s);
    else if (tool === 'triangle') {
      ctx.moveTo(x, y - s/2);
      ctx.lineTo(x - s/2, y + s/2);
      ctx.lineTo(x + s/2, y + s/2);
      ctx.closePath();
    }
    ctx.fill();
    playSoundEffect('stamp');
    setStrokeCount(v => v + 1);
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setStrokeCount(v => v + 1);
    }
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    playSoundEffect('pop');
    setStrokeCount(0);
  };

  const handleFinish = async () => {
    initAudio();
    setIsFinished(true);
    playSoundEffect('complete');
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const msg = await getEncouragement("Leo", "dibujo");
    setFeedback(msg);
    speakText(msg);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative select-none overflow-hidden touch-none">
      {/* Header Compacto */}
      <header className="p-2 md:p-3 bg-white border-b flex justify-between items-center px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl text-white shadow-md">
             <Palette size={20} />
           </div>
           <h1 className="font-kids text-slate-800 text-sm md:text-xl">Lienzo Mágico</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setPaperType(p => p === 'blank' ? 'grid' : 'blank')} className="bg-slate-50 p-2 rounded-xl text-slate-500 border active:scale-90">
            <Grid3X3 size={20} />
          </button>
          <button onClick={clearCanvas} className="bg-red-50 p-2 rounded-xl text-red-500 border border-red-100 active:scale-90">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* Contenido Principal con DVH */}
      <div className="flex-grow flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
        
        {/* Barra Lateral Izquierda */}
        <aside className="flex md:flex-col gap-2 z-40 bg-white p-2 rounded-2xl shadow-lg border self-center md:self-auto shrink-0">
          {[
            { id: 'pencil', icon: <Pencil size={20} />, color: 'orange' },
            { id: 'magic', icon: <Wand2 size={20} />, color: 'purple' },
            { id: 'eraser', icon: <Eraser size={20} />, color: 'slate' },
            { id: 'circle', icon: <Circle size={20} />, color: 'blue' },
            { id: 'square', icon: <Square size={20} />, color: 'blue' },
            { id: 'triangle', icon: <Triangle size={20} />, color: 'blue' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id as Tool); playSoundEffect('pop'); }}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all
                ${activeTool === tool.id ? `bg-${tool.color}-500 text-white scale-110 shadow-lg` : 'bg-white text-slate-400'}`}
            >
              {tool.icon}
            </button>
          ))}
        </aside>

        {/* Canvas centralizado */}
        <div ref={containerRef} className="flex-grow relative rounded-2xl overflow-hidden shadow-inner border-4 border-white bg-white touch-none">
          {paperType === 'grid' && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          )}
          <canvas 
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Control de Grosor Derecho */}
        <aside className="flex md:flex-col items-center gap-3 bg-white p-2 md:p-3 rounded-full shadow-lg border self-center md:self-auto">
          <button onClick={() => setBrushSize(s => Math.min(80, s + 5))} className="p-1 text-slate-500"><Plus size={20}/></button>
          <div className="w-16 md:w-4 h-4 md:h-32 bg-slate-100 rounded-full relative flex items-end">
            <div className="w-full bg-orange-400 rounded-full transition-all" style={{ height: `${(brushSize/80)*100}%`, width: window.innerWidth < 768 ? `${(brushSize/80)*100}%` : '100%' }} />
          </div>
          <button onClick={() => setBrushSize(s => Math.max(5, s - 5))} className="p-1 text-slate-500"><Minus size={20}/></button>
        </aside>
      </div>

      {/* Footer Colores */}
      <footer className="p-2 md:p-4 bg-white border-t relative shrink-0">
        <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-1">
          {PALETTE.map(color => (
            <button
              key={color.hex}
              onClick={() => { setActiveColor(color.hex); playSoundEffect('pop'); if(activeTool==='eraser') setActiveTool('pencil'); }}
              style={{ backgroundColor: color.hex }}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-2 shrink-0 transition-transform
                ${activeColor === color.hex && !['eraser','magic','circle','square','triangle'].includes(activeTool) ? 'scale-125 border-slate-800' : 'border-white shadow'}`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleFinish} 
          className={`absolute -top-12 right-4 w-20 h-20 md:w-24 md:h-24 rounded-full shadow-xl flex flex-col items-center justify-center border-4 border-white transition-all
            ${strokeCount > 0 ? 'bg-green-500 scale-100' : 'bg-slate-300 opacity-50 pointer-events-none'}`}
        >
          <Check size={32} className="text-white" />
          <span className="text-white font-kids text-[10px] uppercase font-bold">Listo</span>
        </button>
      </footer>

      {isFinished && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full animate-pop-in">
            <Sparkles size={48} className="text-orange-500 mx-auto mb-4 animate-wiggle" />
            <h3 className="text-3xl font-kids text-slate-900 mb-2 uppercase">¡GENIAL!</h3>
            <p className="text-slate-500 mb-8 font-kids italic leading-tight">"{feedback}"</p>
            <button onClick={onComplete} className="bg-orange-500 text-white w-full py-4 rounded-2xl text-xl font-kids shadow-lg border-b-4 border-orange-700 active:translate-y-1 transition-all">
              ¡OTRO JUEGO!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingGame;
