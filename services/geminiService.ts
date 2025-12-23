
let audioContext: AudioContext | null = null;
let selectedVoice: SpeechSynthesisVoice | null = null;
let isAudioUnlocked = false;

/**
 * Intenta encontrar la mejor voz en español disponible.
 */
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

// Escuchar cuando las voces cambian (común en móviles tras el primer toque)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoice;
  loadVoice();
}

/**
 * Desbloquea el audio en dispositivos móviles.
 * Debe ser llamado dentro de un evento de usuario (onClick/onTouch).
 */
export const initAudio = () => {
  if (isAudioUnlocked) return;

  // 1. Desbloquear AudioContext (Sonidos)
  if (!audioContext) {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // 2. Desbloquear SpeechSynthesis (Voz)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    // Enviar una locución vacía inmediata dentro del evento de usuario
    const utter = new SpeechSynthesisUtterance("");
    utter.volume = 0; // Silencioso
    window.speechSynthesis.speak(utter);
    loadVoice();
  }
  
  isAudioUnlocked = true;
};

export const getDynamicInstruction = async (gameType: string, target: string, gender: 'm' | 'f' | 'mp' | 'fp' = 'm') => {
  const articles = { m: 'el', f: 'la', mp: 'los', fp: 'las' };
  const art = articles[gender] || 'el';
  
  const instructions: Record<string, string[]> = {
    "contar": [`¡Vamos a contar ${target}!`, `¿Me ayudas a contar ${target}?`, `¡Contemos juntos ${target}!`],
    "reconocer partes del rostro": [`¿Dónde están ${art} ${target}?`, `¡Toca ${art} ${target} de Maya!`, `¿Puedes encontrar ${art} ${target}?`],
    "shapes": [`¿Dónde está ${art} ${target}?`, `¡Busca ${art} ${target} de colores!`, `¡Toca ${art} ${target} ahora!`],
    "sizes": [`Toca ${art === 'el' || art === 'los' ? 'el' : 'la'} más ${target}`, `¿Cuál es ${art === 'el' || art === 'los' ? 'el' : 'la'} ${target}?`],
    "patterns": [`¿Qué sigue ahora?`, `¡Completa el patrón!`],
    "builder": ["¡Vamos a construir!", "Pon las piezas donde quieras.", "¡Haz un dibujo increíble!"]
  };

  const pool = instructions[gameType] || [`Busca ${target}`];
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEncouragement = async (buddyName: string, action: string) => {
  const messages = ["¡Lo hiciste genial!", "¡Eres increíble!", "¡Muy bien hecho!", "¡Qué inteligente!", "¡Excelente trabajo!"];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Si el audio no ha sido desbloqueado por el usuario, no intentamos hablar
  // para evitar el error 'not-allowed' en la consola.
  if (!isAudioUnlocked && typeof window !== 'undefined') {
    console.warn("Intento de hablar antes de desbloquear el audio del usuario.");
    return;
  }

  window.speechSynthesis.cancel();
  
  const runSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.pitch = 1.1; 
    utterance.rate = 1.0;
    
    if (!selectedVoice) loadVoice();
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onerror = (e: any) => {
      // 'interrupted' es normal cuando cancelamos. 
      // 'not-allowed' ocurre si el navegador bloquea la reproducción.
      if (e.error !== 'interrupted' && e.error !== 'not-allowed') {
        console.error("Error en SpeechSynthesis:", e.error);
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Un pequeño retardo ayuda a que el motor procese el 'cancel'
  setTimeout(runSpeak, 50);
};

export type SoundEffectType = 'correct' | 'incorrect' | 'complete' | 'pop' | 'drag' | 'drop';

export const playSoundEffect = (type: SoundEffectType) => {
  try {
    if (!audioContext) initAudio();
    if (!audioContext) return;
    
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
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
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
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
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
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch (e) {
    console.error("Error al reproducir sonido:", e);
  }
};
