type SpeakCallback = () => void;

interface TTS {
  speak: (text: string, callback?: SpeakCallback) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  speaking: boolean;
}

function createTTS(): TTS {
  let utterance: SpeechSynthesisUtterance | null = null;
  let onEnd: SpeakCallback | null = null;

  const tts: TTS = {
    speaking: false,

    speak(text: string, callback?: SpeakCallback) {
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        callback?.();
        return;
      }

      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(text);
      onEnd = callback || null;

      utterance.onend = () => {
        tts.speaking = false;
        onEnd?.();
        onEnd = null;
      };

      utterance.onerror = () => {
        tts.speaking = false;
        onEnd?.();
        onEnd = null;
      };

      tts.speaking = true;
      window.speechSynthesis.speak(utterance);
    },

    stop() {
      tts.speaking = false;
      window.speechSynthesis.cancel();
      onEnd = null;
    },

    pause() {
      window.speechSynthesis.pause();
    },

    resume() {
      window.speechSynthesis.resume();
    },
  };

  return tts;
}

export const tts = createTTS();
