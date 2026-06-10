class TTS {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null;
  
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
  }

  speak(text: string, onEnd?: () => void) {
    this.stop();
    
    setTimeout(() => {
      this.utterance = new SpeechSynthesisUtterance(text);
      
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Premium')));
      if (preferredVoice) {
        this.utterance.voice = preferredVoice;
      }
      
      if (onEnd) {
        this.utterance.onend = onEnd;
        this.utterance.onerror = () => onEnd();
      }
      
      this.synth.speak(this.utterance);
    }, 50);
  }

  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  stop() {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
  }
}

export const tts = new TTS();
