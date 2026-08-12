/**
 * Web Speech API helper wrapper for text-to-speech pronunciation of English vocabulary questions.
 */

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeech(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
}

export interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: () => void;
}

export function speakText(text: string, options: TTSOptions = {}): boolean {
  if (!isTTSSupported()) {
    if (options.onError) options.onError();
    return false;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate ?? 0.9;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  const targetLangPrefix = utterance.lang.slice(0, 2).toLowerCase();
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchingVoice = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith(targetLangPrefix)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }
  } catch {
    // Fallback to default utterance voice if getVoices fails
  }

  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
  return true;
}
