/** Tests for MIDISettingsModal MIDI availability status */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MIDISettingsModal } from './MIDISettingsModal';
import { DEFAULT_MIDI_CONFIG, MIDIAvailability, MIDIDeviceInfo } from '../../midi/types';

vi.mock('../../utils/analytics', () => ({
  trackMIDISettingsOpen: vi.fn(),
  trackMIDIDeviceSelected: vi.fn(),
  trackMIDIDrumKitSelected: vi.fn(),
  trackMIDIDeviceConnected: vi.fn(),
}));

const NO_DEVICES = 'No MIDI devices detected. Connect your device and try again.';

function renderModal(availability: MIDIAvailability, devices: MIDIDeviceInfo[] = []) {
  return render(
    <MIDISettingsModal
      isOpen
      onClose={vi.fn()}
      config={DEFAULT_MIDI_CONFIG}
      onConfigChange={vi.fn()}
      devices={devices}
      currentDevice={null}
      onConnectDevice={vi.fn()}
      availability={availability}
    />
  );
}

describe('MIDISettingsModal availability status', () => {
  it('shows the unsupported text and hides the no-devices text', () => {
    renderModal('unsupported');
    expect(screen.getByRole('status').textContent).toContain(
      'Web MIDI is not available in this browser. Use Chrome or Edge.'
    );
    expect(screen.queryByText(NO_DEVICES)).toBeNull();
  });

  it('shows the blocked text when permission is denied', () => {
    renderModal('denied');
    expect(screen.getByRole('status').textContent).toContain('MIDI access was blocked');
  });

  it('shows the could-not-start text on error', () => {
    renderModal('error');
    expect(screen.getByRole('status').textContent).toContain('MIDI could not start');
  });

  it('keeps the no-devices text when MIDI is available and no device exists', () => {
    renderModal('available');
    expect(screen.getByRole('status').textContent).toContain(NO_DEVICES);
  });

  it('shows no status when MIDI is available and a device exists', () => {
    renderModal('available', [{ id: 'a', name: 'Kit', manufacturer: '', state: 'connected' }]);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
