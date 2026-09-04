/**
 * Audio Synthesizer - Sound completely disabled per user requirement
 */
class JourneyAudioEngine {
  constructor() {
    this.muted = true;
  }
  init() {}
  isMuted() { return true; }
  toggle() { return true; }
  setMuted() {}
  playTick() {}
  playWhoosh() {}
  playTrophyChime() {}
  playDigitalPulse() {}
}

export const journeyAudio = new JourneyAudioEngine();
