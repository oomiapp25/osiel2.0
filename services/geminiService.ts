
// Eliminada la dependencia de @google/genai para usar lógica local
export const getDynamicInstruction = async (gameType: string, target: string) => {
  const instructions: Record<string, string[]> = {
    "contar": [
      `¡Vamos a contar ${target}!`,
      `¿Me ayudas a contar ${target}?`,
      `¡Busca y toca ${target}!`,
      `¡Contemos juntos: ${target}!`,
      `¡Toca cada uno de los ${target}!`
    ],
    "reconocer partes del rostro": [
      `¿Dónde está la ${target}?`,
      `¡Toca la ${target} de Maya!`,
      `¡Maya quiere que busques su ${target}!`,
      `¿Puedes encontrar la ${target}?`,
      `¡Señala la ${target} de la monita!`
    ],
    "shapes": [
      `¿Dónde está el ${target}?`,
      `¡Busca el ${target} de colores!`,
      `¡Toca el ${target} ahora!`,
      `¿Puedes ver el ${target}?`
    ],
    "sizes": [
      `Toca el más ${target}`,
      `¿Cuál es el ${target}?`,
      `¡Busca el objeto ${target}!`
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
    "¡Sigue así, campeón!",
    "¡Excelente trabajo!",
    "¡Me encanta cómo juegas!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.4; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

export type SoundEffectType = 'correct' | 'incorrect' | 'complete' | 'pop';

export const playSoundEffect = (type: SoundEffectType) => {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(); osc.stop(now + 0.2);
    } else if (type === 'pop') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(); osc.stop(now + 0.1);
    } else if (type === 'complete') {
      [523, 659, 783, 1046].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, now + i*0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i*0.1 + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i*0.1); o.stop(now + i*0.1 + 0.3);
      });
    }
  } catch (e) {}
};
