
import React, { useState, useEffect } from 'react';
import { Home, Settings, Trophy, Sparkles, Baby, Star, Circle, Square, Triangle } from 'lucide-react';
import { BUDDIES } from './constants';
import CountingGame from './components/Games/CountingGame';
import ShapesGame from './components/Games/ShapesGame';
import SizesGame from './components/Games/SizesGame';
import PatternsGame from './components/Games/PatternsGame';
import BodyPartsGame from './components/Games/BodyPartsGame';
import ParentalControl from './components/ParentalControl';
import { speakText, playSoundEffect } from './services/geminiService';
import { BuddyLevels } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'selection' | 'game' | 'rewards'>('welcome');
  const [activeBuddy, setActiveBuddy] = useState<keyof typeof BUDDIES | null>(null);
  const [showParental, setShowParental] = useState(false);
  const [stickers, setStickers] = useState(0);
  const [buddyLevels, setBuddyLevels] = useState<BuddyLevels>({
    toby: 1,
    lila: 1,
    gogo: 1,
    pipo: 1,
    maya: 1
  });

  useEffect(() => {
    if (view === 'welcome') {
      speakText("¡Hola! Soy Osiel. Vamos a jugar con las matemáticas. Toca la pantalla para empezar.");
    }
  }, [view]);

  const startBuddyAventure = (buddyId: keyof typeof BUDDIES) => {
    playSoundEffect('correct');
    setActiveBuddy(buddyId);
    const level = buddyLevels[buddyId];
    speakText(`¡Excelente! ${BUDDIES[buddyId].name} te enseñará ${BUDDIES[buddyId].teach === 'bodyParts' ? 'las partes del cuerpo' : BUDDIES[buddyId].teach}. Nivel ${level}.`);
    setView('game');
  };

  const handleLevelUp = () => {
    if (activeBuddy) {
      const currentLevel = buddyLevels[activeBuddy];
      if (currentLevel >= 10) {
        setView('rewards');
        speakText("¡Felicidades! Has completado todos los niveles de " + BUDDIES[activeBuddy].name);
      } else {
        setBuddyLevels(prev => ({
          ...prev,
          [activeBuddy]: prev[activeBuddy] + 1
        }));
        setStickers(prev => prev + 1);
      }
    }
  };

  const AnimatedTitle = () => {
    const letters = "OSIEL".split("");
    return (
      <h1 className="text-6xl md:text-8xl text-blue-600 mb-6 drop-shadow-xl flex justify-center gap-1">
        {letters.map((char, i) => (
          <span key={i} className={`letter-animate stagger-${i + 1}`}>{char}</span>
        ))}
      </h1>
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-sky-100 select-none flex flex-col">
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <Circle className="absolute top-[10%] left-[5%] text-blue-400 w-16 md:w-24 h-16 md:h-24 drift" />
        <Square className="absolute bottom-[15%] right-[10%] text-green-400 w-24 md:w-32 h-24 md:h-32 drift stagger-2" />
        <Triangle className="absolute top-[40%] right-[15%] text-pink-400 w-16 md:w-20 h-16 md:h-20 drift stagger-4" />
        <Star className="absolute bottom-[20%] left-[20%] text-yellow-400 w-12 md:w-16 h-12 md:h-16 drift stagger-5" />
      </div>

      <header className="relative z-30 p-4 md:p-6 flex justify-between items-center w-full max-w-7xl mx-auto">
        <button 
          onClick={() => { playSoundEffect('correct'); setView('selection'); }} 
          className="bg-white/80 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-lg border-b-4 border-gray-200 active:translate-y-1 transition-all"
        >
          <Home className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />
        </button>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-white/90 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg flex items-center gap-2 md:gap-3 border-b-4 border-yellow-200">
            <Trophy className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
            <span className="font-kids text-lg md:text-xl text-yellow-700">{stickers}</span>
          </div>
          <button 
            onClick={() => { playSoundEffect('correct'); setShowParental(true); }}
            className="bg-white/80 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-lg border-b-4 border-gray-200 active:translate-y-1 transition-all"
          >
            <Settings className="text-gray-500 w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </header>

      <main className="flex-grow w-full flex items-center justify-center p-4 md:p-8 relative z-20">
        
        {view === 'welcome' && (
          <div 
            onClick={() => { playSoundEffect('complete'); setView('selection'); }}
            className="text-center cursor-pointer group w-full"
          >
            <div className="mb-8 md:mb-12 relative inline-block">
              <div className="bg-white p-12 md:p-16 rounded-full inline-block shadow-2xl relative float-animation border-8 border-blue-100 group-hover:border-blue-300 transition-colors">
                <Baby className="w-32 h-32 md:w-40 md:h-40 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                <Sparkles className="absolute -top-6 -right-6 w-12 h-12 md:w-16 md:h-16 text-yellow-400 animate-pulse" />
                <Sparkles className="absolute -bottom-4 -left-4 w-10 h-10 md:w-12 md:h-12 text-pink-400 animate-bounce stagger-3" />
              </div>
            </div>
            <AnimatedTitle />
            <div className="inline-block bg-white/80 px-8 py-3 rounded-full shadow-md border-b-4 border-blue-200 group-hover:scale-110 transition-all">
              <p className="text-xl md:text-2xl text-blue-500 font-kids">TOCA PARA JUGAR</p>
            </div>
          </div>
        )}

        {view === 'selection' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 max-w-7xl w-full px-4 overflow-y-auto max-h-full py-4 scrollbar-hide">
            {(Object.keys(BUDDIES) as Array<keyof typeof BUDDIES>).map((id) => (
              <button
                key={id}
                onClick={() => startBuddyAventure(id)}
                className={`${BUDDIES[id].color} p-6 md:p-8 rounded-[2.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center border-b-8 border-black/5 relative group`}
              >
                {buddyLevels[id] > 10 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg z-10 animate-bounce">
                    <Star className="text-white w-5 h-5 md:w-6 md:h-6 fill-current" />
                  </div>
                )}
                <div className="mb-4 md:mb-6 bg-white p-4 md:p-6 rounded-full shadow-inner group-hover:rotate-12 transition-transform">
                  {BUDDIES[id].icon}
                </div>
                <h3 className="text-xl md:text-2xl font-kids text-gray-800 mb-1 md:mb-2 leading-tight">{BUDDIES[id].name}</h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 leading-tight">{BUDDIES[id].description}</p>
                <div className="bg-white/50 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-gray-500">
                  Nivel {buddyLevels[id] > 10 ? '¡Maestro!' : buddyLevels[id]}
                </div>
              </button>
            ))}
          </div>
        )}

        {view === 'game' && activeBuddy && (
          <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] w-full max-w-5xl h-full max-h-[85vh] shadow-2xl overflow-hidden border-4 md:border-8 border-white relative flex flex-col">
            <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-20 bg-white/80 px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold text-gray-400 border border-gray-100">
               Nivel {buddyLevels[activeBuddy] > 10 ? 10 : buddyLevels[activeBuddy]} / 10
            </div>
            <div className="flex-grow relative overflow-auto">
              {activeBuddy === 'toby' && <CountingGame level={buddyLevels.toby} onComplete={handleLevelUp} />}
              {activeBuddy === 'lila' && <ShapesGame level={buddyLevels.lila} onComplete={handleLevelUp} />}
              {activeBuddy === 'maya' && <BodyPartsGame level={buddyLevels.maya} onComplete={handleLevelUp} />}
              {activeBuddy === 'gogo' && <SizesGame level={buddyLevels.gogo} onComplete={handleLevelUp} />}
              {activeBuddy === 'pipo' && <PatternsGame level={buddyLevels.pipo} onComplete={handleLevelUp} />}
            </div>
          </div>
        )}

        {view === 'rewards' && (
          <div className="text-center animate-bounce p-4">
            <div className="bg-white p-12 md:p-16 rounded-full shadow-2xl mb-6 md:mb-8 relative border-8 border-yellow-200 inline-block">
              <Trophy className="w-32 h-32 md:w-48 md:h-48 text-yellow-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-4xl md:text-6xl">🌟</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-kids text-yellow-600 mb-6 md:mb-8 drop-shadow-sm">¡INCREÍBLE!</h2>
            <button 
              onClick={() => { playSoundEffect('complete'); setView('selection'); }}
              className="bg-green-500 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl text-xl md:text-2xl font-kids shadow-lg hover:bg-green-600 active:translate-y-2 transition-all border-b-8 border-green-700"
            >
              ¡SIGUE JUGANDO!
            </button>
          </div>
        )}

      </main>

      {showParental && <ParentalControl onClose={() => setShowParental(false)} />}
    </div>
  );
};

export default App;
