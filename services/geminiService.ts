
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDynamicInstruction = async (gameType: string, target: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un narrador de juegos para niños de 3 años. 
      Estamos jugando a ${gameType}. El objetivo es ${target}. 
      Dame una instrucción MUY CORTA (máximo 6 palabras), divertida y diferente. 
      Ejemplo para nariz: "¡Toca la naricita de Maya!" o "¡Maya quiere oler flores, busca su nariz!".
      Responde solo con la frase.`,
    });
    return response.text?.trim() || `Busca ${target}`;
  } catch (error) {
    return `¿Dónde está ${target}?`;
  }
};

export const getEncouragement = async (buddyName: string, action: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres ${buddyName}, un amiguito tierno para niños de 3 años. 
      El niño acaba de ${action}. Dale un mensaje de ánimo cortísimo y alegre.`,
    });
    return response.text?.trim() || "¡Muy bien!";
  } catch (error) {
    return "¡Increíble!";
  }
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
