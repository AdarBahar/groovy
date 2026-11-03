/** Tests for PlaybackControls transport button accessible names */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackControls } from './PlaybackControls';
import { TimeSignature } from '../../types';

vi.mock('../../hooks/useMIDITimingAccuracy', () => ({
  useMIDITimingAccuracy: () => ({ timingAccuracy: null, averageScore: null, showingAverage: false }),
}));
vi.mock('../../hooks/useMIDIPerformedBpm', () => ({
  useMIDIPerformedBpm: () => ({ performedBpm: null }),
}));
// The Radix slider is not under test and needs browser layout APIs jsdom lacks
vi.mock('../ui/slider', () => ({ Slider: () => null }));

const baseProps = {
  isPlaying: false,
  onPlay: vi.fn(),
  onPlayWithSpeedUp: vi.fn(),
  isAutoSpeedUpActive: false,
  timeSignature: { beats: 4, noteValue: 4 } as TimeSignature,
  tempo: 120,
  swing: 0,
  onTempoChange: vi.fn(),
  onSwingChange: vi.fn(),
};

describe('PlaybackControls accessible names', () => {
  it('names both transport buttons when stopped', () => {
    render(<PlaybackControls {...baseProps} />);
    expect(screen.getByRole('button', { name: /^play$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /play with auto speed-up/i })).toBeTruthy();
  });

  it('names the main button Stop while playing normally', () => {
    render(<PlaybackControls {...baseProps} isPlaying />);
    expect(screen.getByRole('button', { name: /^stop$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /pause/i })).toBeNull();
    expect(screen.getByRole('button', { name: /play with auto speed-up/i })).toBeTruthy();
  });

  it('names the speed-up button Stop while auto speed-up is active', () => {
    render(<PlaybackControls {...baseProps} isPlaying isAutoSpeedUpActive />);
    expect(screen.getByRole('button', { name: /stop auto speed-up/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^play$/i })).toBeTruthy();
  });

  it('announces the count-in number on the button that triggered it', () => {
    render(<PlaybackControls {...baseProps} countingInButton="play" countdownNumber={3} />);
    expect(screen.getByRole('button', { name: /counting in: 3/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /play with auto speed-up/i })).toBeTruthy();
  });
});
