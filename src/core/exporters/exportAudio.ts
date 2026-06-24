import { GrooveData, DrumVoice, ALL_DRUM_VOICES, getFlattenedNotes } from '../../types';
import { GrooveUtils } from '../GrooveUtils';
import { DRUM_VOICE_TO_MIDI, getVelocityForVoice } from '../DrumVoiceConfig';
import { AudioExportOptions, generateFilename, triggerDownload, getMidiWriter, getMp3Encoder } from './helpers';

export const DRUM_SAMPLE_FILES: Record<DrumVoice, string> = {
  'hihat-closed': 'Hi Hat Normal.mp3',
  'hihat-open': 'Hi Hat Open.mp3',
  'hihat-accent': 'Hi Hat Accent.mp3',
  'hihat-foot': 'Hi Hat Foot.mp3',
  'hihat-metronome-normal': 'metronomeClick.mp3',
  'hihat-metronome-accent': 'metronome1Count.mp3',
  'hihat-cross': 'Hi Hat Normal.mp3',
  'snare-normal': 'Snare Normal.mp3',
  'snare-accent': 'Snare Accent.mp3',
  'snare-ghost': 'Snare Ghost.mp3',
  'snare-cross-stick': 'Snare Cross Stick.mp3',
  'snare-flam': 'Snare Flam.mp3',
  'snare-rim': 'Rim.mp3',
  'snare-drag': 'Drag.mp3',
  'snare-buzz': 'Buzz.mp3',
  kick: 'Kick.mp3',
  'tom-rack': 'Rack Tom.mp3',
  'tom-floor': 'Floor Tom.mp3',
  'tom-10': '10 Tom.mp3',
  'tom-16': '16 Tom.mp3',
  crash: 'Crash.mp3',
  ride: 'Ride.mp3',
  'ride-bell': 'Bell.mp3',
  cowbell: 'Cowbell.mp3',
  stacker: 'Stacker.mp3',
};

export async function exportToMIDI(groove: GrooveData, options: AudioExportOptions = {}): Promise<Blob> {
  const { loops = 1 } = options;

  const MidiWriter = await getMidiWriter();

  const track = new MidiWriter.Track();
  track.setTempo(groove.tempo);
  track.setTimeSignature(groove.timeSignature.beats, groove.timeSignature.noteValue, 24, 8);

  const ticksPerBeat = 128;
  const ticksPerSubdivision = (ticksPerBeat * 4) / groove.division;

  const flatNotes = getFlattenedNotes(groove);
  const totalPositions = GrooveUtils.getTotalPositions(groove);

  for (let loop = 0; loop < loops; loop++) {
    for (let pos = 0; pos < totalPositions; pos++) {
      const absoluteTick = (loop * totalPositions + pos) * ticksPerSubdivision;

      ALL_DRUM_VOICES.forEach((voice) => {
        if (flatNotes[voice]?.[pos]) {
          if (voice.includes('metronome')) return;

          const midiNote = DRUM_VOICE_TO_MIDI[voice];
          const velocity = getVelocityForVoice(voice);

          track.addEvent(
            new MidiWriter.NoteEvent({
              pitch: [midiNote],
              duration: 'T' + ticksPerSubdivision,
              velocity: velocity,
              startTick: absoluteTick,
              channel: 10,
            })
          );
        }
      });
    }
  }

  const writer = new MidiWriter.Writer([track]);
  const midiData = writer.buildFile();

  return new Blob([midiData], { type: 'audio/midi' });
}

export async function downloadAsMIDI(groove: GrooveData, options: AudioExportOptions = {}): Promise<void> {
  const blob = await exportToMIDI(groove, options);
  triggerDownload(blob, generateFilename(groove, 'midi'));
}

async function loadSamplesForOffline(offlineCtx: OfflineAudioContext): Promise<Map<DrumVoice, AudioBuffer>> {
  const samples = new Map<DrumVoice, AudioBuffer>();
  const basePath = import.meta.env.BASE_URL || '/';

  await Promise.all(
    ALL_DRUM_VOICES.map(async (voice) => {
      if (voice.includes('metronome')) return;

      const soundPath = `${basePath}sounds/${DRUM_SAMPLE_FILES[voice]}`;

      try {
        const response = await fetch(soundPath);
        if (!response.ok) return;

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        samples.set(voice, audioBuffer);
      } catch {
        console.warn(`Failed to load sample for ${voice}`);
      }
    })
  );

  return samples;
}

export async function exportToMP3(groove: GrooveData, options: AudioExportOptions = {}): Promise<Blob> {
  const { loops = 1 } = options;

  const beatDuration = 60 / groove.tempo;
  const noteDuration = beatDuration / (groove.division / 4);
  const totalPositions = GrooveUtils.getTotalPositions(groove);
  const loopDuration = totalPositions * noteDuration;
  const totalDuration = loopDuration * loops + 2;

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);

  const samples = await loadSamplesForOffline(offlineCtx);
  const flatNotes = getFlattenedNotes(groove);

  for (let loop = 0; loop < loops; loop++) {
    for (let pos = 0; pos < totalPositions; pos++) {
      const time = (loop * totalPositions + pos) * noteDuration;

      ALL_DRUM_VOICES.forEach((voice) => {
        if (flatNotes[voice]?.[pos] && !voice.includes('metronome')) {
          const sample = samples.get(voice);
          if (!sample) return;

          const source = offlineCtx.createBufferSource();
          source.buffer = sample;

          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = getVelocityForVoice(voice) / 127;

          source.connect(gainNode);
          gainNode.connect(offlineCtx.destination);
          source.start(time);
        }
      });
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();

  const Mp3Encoder = await getMp3Encoder();
  const mp3encoder = new Mp3Encoder(2, sampleRate, 128);

  const leftChannel = renderedBuffer.getChannelData(0);
  const rightChannel = renderedBuffer.getChannelData(1);

  const sampleBlockSize = 1152;
  const mp3Data: Uint8Array[] = [];

  for (let i = 0; i < leftChannel.length; i += sampleBlockSize) {
    const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
    const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);

    const leftInt16 = new Int16Array(leftChunk.length);
    const rightInt16 = new Int16Array(rightChunk.length);

    for (let j = 0; j < leftChunk.length; j++) {
      leftInt16[j] = Math.max(-32768, Math.min(32767, leftChunk[j] * 32767));
      rightInt16[j] = Math.max(-32768, Math.min(32767, rightChunk[j] * 32767));
    }

    const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

export async function downloadAsMP3(groove: GrooveData, options: AudioExportOptions = {}): Promise<void> {
  const blob = await exportToMP3(groove, options);
  triggerDownload(blob, generateFilename(groove, 'mp3'));
}
