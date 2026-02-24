import { useRef, useState, useEffect } from 'react';
import './VolumeKnob.css';

interface VolumeKnobProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  label?: string;
}

export default function VolumeKnob({ volume, onVolumeChange, label = 'Volume' }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate rotation angle from volume (0-1 -> -135 to 135 degrees)
  const rotationAngle = (volume * 270) - 135;

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < -135) angle += 360;

    let newVolume = (angle + 135) / 270;
    newVolume = Math.max(0, Math.min(1, newVolume));

    onVolumeChange(newVolume);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    onVolumeChange(newVolume);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    containerRef.current?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      containerRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, volume]);

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="volume-knob-container" ref={containerRef}>
      <div className="volume-knob-label">{label}</div>
      <div className="volume-knob-wrapper">
        <div
          ref={knobRef}
          className="volume-knob"
          onMouseDown={handleMouseDown}
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <div className="volume-knob-ring"></div>
          <div className="volume-knob-center"></div>
          <div className="volume-knob-indicator"></div>
          <div className="volume-knob-display">{volumePercent}</div>
        </div>
      </div>
      <div className="volume-knob-range-labels">
        <span>Min</span>
        <span>Max</span>
      </div>
    </div>
  );
}
