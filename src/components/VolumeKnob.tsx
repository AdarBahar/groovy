import { useRef, useEffect } from 'react';
import './VolumeKnob.css';

interface VolumeKnobProps {
  volume: number; // 0-1
  onVolumeChange: (volume: number) => void;
  label?: string;
}

/**
 * Master Volume Knob Component
 *
 * Visual knob control for master playback volume. Uses mouse/touch interaction
 * to rotate the knob and update volume. Positioned absolutely to avoid pushing
 * page content down.
 *
 * Features:
 * - Smooth circular rotation based on mouse Y position
 * - Visual feedback with color gradient
 * - Light and dark theme support
 * - Touch-friendly with visual scale feedback
 */
function VolumeKnob({ volume, onVolumeChange, label = 'Volume' }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startVolumeRef = useRef(0);

  // Calculate rotation angle from volume (0-1 maps to 0-360 degrees)
  const rotationDegrees = volume * 360;

  // Calculate visual percentage for display
  const volumePercent = Math.round(volume * 100);

  // Handle mouse/touch down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startVolumeRef.current = volume;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  // Handle mouse/touch move
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      // Calculate vertical distance moved (negative = up = increase volume)
      const deltaY = startYRef.current - e.clientY;

      // Convert pixel movement to volume change (1 pixel = ~0.002 volume change)
      // This creates smooth, controllable volume adjustment
      const volumeDelta = (deltaY / 500) * 1; // Sensitivity: ~500px to full range
      let newVolume = startVolumeRef.current + volumeDelta;

      // Clamp to 0-1
      newVolume = Math.max(0, Math.min(1, newVolume));

      onVolumeChange(newVolume);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    if (isDraggingRef.current) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [volume, onVolumeChange]);

  // Handle mouse wheel for volume adjustment
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = (e.deltaY / 1000) * 0.1; // Convert wheel delta to volume change
    let newVolume = volume - delta; // Negative because scroll down = decrease in most UIs
    newVolume = Math.max(0, Math.min(1, newVolume));
    onVolumeChange(newVolume);
  };

  return (
    <div className="volume-knob-container">
      <label className="volume-knob-label">{label}</label>

      <div className="volume-knob-wrapper">
        <div
          ref={knobRef}
          className="volume-knob"
          onPointerDown={handlePointerDown}
          onWheel={handleWheel}
          style={{
            transform: `rotate(${rotationDegrees}deg)`,
            cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          }}
        >
          {/* Outer ring */}
          <div className="volume-knob-ring" />

          {/* Center dot */}
          <div className="volume-knob-center" />

          {/* Indicator line */}
          <div className="volume-knob-indicator" />
        </div>

        {/* Volume percentage display */}
        <div className="volume-knob-display">{volumePercent}%</div>
      </div>

      {/* Min/Max labels */}
      <div className="volume-knob-range-labels">
        <span>Min</span>
        <span>Max</span>
      </div>
    </div>
  );
}

export default VolumeKnob;
