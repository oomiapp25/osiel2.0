
let audioContext: AudioContext | null = null;
let selectedVoice: SpeechSynthesisVoice | null = null;
let isAudioUnlocked = false;

const loadVoice = () => {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    selectedVoice = voices.find(v => v.lang.includes('es-MX')) || 
                    voices.find(v => v.lang.includes('es-US')) ||
                    voices.find(v => v.lang.includes('es-ES')) ||
                    voices.find(v => v.lang.startsWith('es')) ||
                    null;
  }
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoice;
  loadVoice();
}

export const initAudio = () => {
  if (isAudioUnlocked) return;

  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioCtx) {
      audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      g.gain.setValueAtTime(0.001, audioContext.currentTime);
      osc.connect(g);
      g.connect(audioContext.destination);
      osc.start(0);
      osc.stop(audioContext.currentTime + 0.01);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(" ");
      utter.volume = 0;
      window.speechSynthesis.speak(utter);
      loadVoice();
    }
    
    isAudioUnlocked = true;
  } catch (e) {
    console.error("Fallo al activar audio:", e);
  }
};

export const getDynamicInstruction = async (gameType: string, target: string, gender: 'm' | 'f' | 'mp' | 'fp' = 'm') => {
  const articles = { m: 'el', f: 'la', mp: 'los', fp: 'las' };
  const art = articles[gender] || 'el';
  
  const instructions: Record<string, string[]> = {
    "contar": [`¡Contemos ${target} juntitos!`, `¿Me ayudas a contar ${target}?`, `¡Uno, dos, tres... contemos ${target}!`],
    "reconocer partes del rostro": [`¿Dónde está ${art} ${target}?`, `¡Toca ${art} ${target} de la monita!`, `Busca ${art} ${target} pequeñitos.`],
    "shapes": [`Busca ${art} ${target} de colores.`, `¡Toca ${art} ${target} ahora!`, `¿Dónde está ${art} ${target} bonito?`],
    "sizes": [`Toca ${art === 'el' || art === 'los' ? 'el' : 'la'} más ${target}`, `¿Cuál es ${art === 'el' || art === 'los' ? 'el' : 'la'} ${target}?`],
    "patterns": [`¿Qué sigue ahora?`, `¡Haz la cadenita!`],
    "builder": ["¡Vamos a armar una figurita!", "Pon las piezas sobre las sombritas.", "¡Hazlo bonito!"]
  };

  const pool = instructions[gameType] || [`Busca ${target}`];
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEncouragement = async (buddyName: string, action: string) => {
  const messages = ["¡Bravo, lo hiciste súper!", "¡Qué lindo te quedó!", "¡Eres un campeón!", "¡Muy bien, corazón!", "¡Excelente trabajo!"];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const speakText = (text: string, options?: { pitch?: number, rate?: number }) => {
  if (!('speechSynthesis' in window)) return;
  if (!isAudioUnlocked) initAudio();

  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  // Ajuste de fonética para infantes: Tono más alto (pitch 1.3) y velocidad más lenta (rate 0.8)
  utterance.pitch = options?.pitch ?? 1.3; 
  utterance.rate = options?.rate ?? 0.8;
  
  if (!selectedVoice) loadVoice();
  if (selectedVoice) utterance.voice = selectedVoice;
  
  window.speechSynthesis.speak(utterance);
};

export type SoundEffectType = 'correct' | 'incorrect' | 'complete' | 'pop' | 'drag' | 'drop';

export const playSoundEffect = (type: SoundEffectType) => {
  try {
    if (!audioContext) initAudio();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
    } else if (type === 'drag') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(); osc.stop(now + 0.05);
    } else if (type === 'drop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(); osc.stop(now + 0.2);
    } else if (type === 'incorrect') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(); osc.stop(now + 0.3);
    } else if (type === 'complete') {
      [523, 659, 783, 1046].forEach((f, i) => {
        const o = audioContext!.createOscillator();
        const g = audioContext!.createGain();
        o.connect(g); g.connect(audioContext!.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.4);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch (e) {
    console.error("Error al reproducir sonido:", e);
  }
};
