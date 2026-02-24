import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import './VolumeKnob.css';

interface VolumeKnobProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  label?: string;
}

const DEG_RANGE = 135;
const STEP = 32;

export default function VolumeKnob({ volume, onVolumeChange, label = 'Volume' }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<SVGCircleElement>(null);
  const sliderShadowRef = useRef<SVGCircleElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert volume (0-1) to degrees (-135 to 135)
  const degreeValue = (volume * 270) - 135;

  // Generate gradient lines
  const gradateLines = useMemo(() => {
    const lines = [];
    const Q = DEG_RANGE / STEP;
    for (let i = DEG_RANGE * -1; i <= DEG_RANGE; i += Q) {
      const hue = i + DEG_RANGE * 2;
      const isActive = i <= degreeValue;
      lines.push({
        deg: i,
        hue,
        isActive,
      });
    }
    return lines;
  }, [degreeValue]);

  // Calculate angle from coordinates
  const getRadians = useCallback((x: number, y: number) => Math.atan2(y, x), []);
  const toDegrees = useCallback((radians: number) => (radians / Math.PI) * 180, []);

  const setByCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!knobRef.current) return;

      const rect = knobRef.current.getBoundingClientRect();
      const CX = rect.width / 2;
      const CY = rect.height / 2;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const r = getRadians(x - CX, y - CY);
      let res = Math.round(toDegrees(r)) + 90;

      let value = res <= 180 ? res : res - 360;
      value = value <= DEG_RANGE * -1 ? DEG_RANGE * -1 : value;
      value = value >= DEG_RANGE ? DEG_RANGE : value;

      // Convert degrees to volume (0-1)
      const newVolume = (value + DEG_RANGE) / 270;
      onVolumeChange(Math.max(0, Math.min(1, newVolume)));
    },
    [getRadians, toDegrees, onVolumeChange]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      setByCoords(e.clientX, e.clientY);
    },
    [setByCoords]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setByCoords(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      setByCoords(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, setByCoords]);

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="volume-knob-container" ref={knobRef}>
      <div className="volume-knob-label">{label}</div>
      <div className="volume-button-knob" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <svg
          viewBox="0 0 600 600"
          onClick={handleClick}
          className={isDragging ? 'without-animate' : ''}
        >
          <defs>
            <radialGradient id="radial-gradient" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#202528" />
              <stop offset="0.849" stopColor="#272c2f" />
              <stop offset="0.866" stopColor="#6a6d6f" />
              <stop offset="0.87" stopColor="#202528" />
              <stop offset="0.879" stopColor="#6a6d6f" />
              <stop offset="0.908" stopColor="#202528" />
              <stop offset="1" stopColor="#6a6d6f" />
            </radialGradient>
            <filter id="shadow" filterUnits="userSpaceOnUse">
              <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
              <feFlood result="color" />
              <feComposite operator="in" in="blur" />
              <feComposite in="SourceGraphic" />
            </filter>
            <filter id="inset-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feFlood result="color" />
              <feComposite operator="out" in="SourceGraphic" in2="blur" />
              <feComposite operator="in" in="color" />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Main circle */}
          <circle className="circle" cx="300" cy="300" r="200" />

          {/* Gradient tick marks */}
          <g id="gradate" className="gradate">
            {gradateLines.map((line) => (
              <line
                key={line.deg}
                data-deg={line.deg}
                className={`gradate-line ${line.isActive ? 'active' : ''}`}
                style={
                  {
                    '--deg': `${line.deg}deg`,
                    '--h': line.hue,
                  } as React.CSSProperties & { '--deg': string; '--h': number }
                }
                x1="300"
                y1="30"
                x2="300"
                y2="70"
              />
            ))}
          </g>

          {/* Slider (visible) */}
          <circle
            ref={sliderRef}
            id="slider"
            className="slider"
            cx="300"
            cy="130"
            r="10"
            style={
              {
                '--deg': `${degreeValue}deg`,
                '--h': degreeValue + DEG_RANGE * 2,
              } as React.CSSProperties & { '--deg': string; '--h': number }
            }
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          />

          {/* Slider shadow (for interaction) */}
          <g className="slider-wrap">
            <circle
              ref={sliderShadowRef}
              id="slider-shadow"
              className="slider"
              cx="300"
              cy="130"
              r="10"
              style={
                {
                  '--deg': `${degreeValue}deg`,
                  '--h': degreeValue + DEG_RANGE * 2,
                } as React.CSSProperties & { '--deg': string; '--h': number }
              }
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            />
          </g>
        </svg>
      </div>

      {/* Volume percentage display */}
      <div className="volume-knob-display">{volumePercent}%</div>
    </div>
  );
}
