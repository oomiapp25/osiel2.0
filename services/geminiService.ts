
export const getDynamicInstruction = async (gameType: string, target: string, gender: 'm' | 'f' | 'mp' | 'fp' = 'm') => {
  // Mapeo de artículos correcto para concordancia gramatical
  const articles = {
    m: 'el',
    f: 'la',
    mp: 'los',
    fp: 'las'
  };
  
  const art = articles[gender] || 'el';
  
  const instructions: Record<string, string[]> = {
    "contar": [
      `¡Vamos a contar ${target}!`,
      `¿Me ayudas a contar ${target}?`,
      `¡Toca cada uno de los ${target}!`,
      `¡Contemos juntos ${target}!`
    ],
    "reconocer partes del rostro": [
      `¿Dónde están ${art} ${target}?`,
      `¡Toca ${art} ${target} de Maya!`,
      `¿Puedes encontrar ${art} ${target}?`,
      `¡Señala ${art} ${target} de la monita!`
    ],
    "shapes": [
      `¿Dónde está ${art} ${target}?`,
      `¡Busca ${art} ${target} de colores!`,
      `¡Toca ${art} ${target} ahora!`,
      `¿Puedes ver ${art} ${target}?`
    ],
    "sizes": [
      `Toca ${art === 'el' || art === 'los' ? 'el' : 'la'} más ${target}`,
      `¿Cuál es ${art === 'el' || art === 'los' ? 'el' : 'la'} ${target}?`,
      `¡Busca el objeto ${target}!`
    ],
    "patterns": [
      `¿Qué sigue ahora?`,
      `¡Completa el patrón!`,
      `¿Cuál va en el espacio vacío?`
    ],
    "builder": [
      "¡Vamos a construir!",
      "Pon las piezas donde quieras.",
      "¡Haz un dibujo increíble!"
    ]
  };

  const pool = instructions[gameType] || [`Busca ${target}`];
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEncouragement = async (buddyName: string, action: string) => {
  const messages = [
    "¡Lo hiciste genial!",
    "¡Eres increíble!",
    "¡Muy bien hecho!",
    "¡Qué inteligente!",
    "¡Excelente trabajo!",
    "¡Me encanta!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancelar cualquier voz en curso para que no se amontonen
    window.speechSynthesis.cancel();
    
    // Un pequeño retardo ayuda a que los motores de voz móviles (iOS/Android) procesen el cambio
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.pitch = 1.3; 
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }, 100);
  }
};

export type SoundEffectType = 'correct' | 'incorrect' | 'complete' | 'pop';

// Función para sintetizar sonidos simples sin necesidad de archivos externos
export const playSoundEffect = (type: SoundEffectType) => {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Reanudar el contexto si está suspendido (requerido en navegadores móviles)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
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
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
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
