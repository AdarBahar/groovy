import './MIDITimingIndicator.css';
import { useEffect, useRef } from 'react';

interface MIDITimingIndicatorProps {
  timingAccuracy: number; // -100 to +100, where 0 is perfect timing
  isPlaying?: boolean; // Whether playback is currently active
  trackingEnabled?: boolean; // Whether MIDI tracking is enabled
  averageScore?: number | null; // Average score from last playback (0-100)
  showingAverage?: boolean; // Whether displaying the average
}

/**
 * MIDITimingIndicator
 *
 * Displays real-time MIDI timing accuracy on a Slow-OnTime-Fast spectrum.
 * Shows different states:
 * - Disabled: Grayed out when tracking is off
 * - Waiting: "Waiting for play to start" when tracking is on but playback is stopped
 * - Active: Green when on-time, red when slow or fast during playback
 * - Average: Shows average score when playback just stopped
 */
export function MIDITimingIndicator({
  timingAccuracy,
  isPlaying = true,
  trackingEnabled = false,
  averageScore = null,
  showingAverage = false,
}: MIDITimingIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Determine the current state
  const isDisabled = !trackingEnabled;
  const isWaiting = trackingEnabled && !isPlaying && !showingAverage;
  const isTrackingActive = trackingEnabled && isPlaying && !showingAverage;
  const isShowingAverage = showingAverage && averageScore !== null;

  // Convert timing accuracy (-100 to +100) to position percentage (0 to 100)
  // -100 = 0% (Slow), 0 = 50% (On-Time), +100 = 100% (Fast)
  const positionPercent = ((timingAccuracy + 100) / 200) * 100;

  // Determine color based on timing accuracy
  const getColor = () => {
    const absAccuracy = Math.abs(timingAccuracy);

    if (absAccuracy < 15) {
      return 'var(--timing-perfect)'; // Green (very good)
    } else if (absAccuracy < 30) {
      return 'var(--timing-good)'; // Light green (good)
    } else if (absAccuracy < 40) {
      return 'var(--timing-warning)'; // Amber (on-time but at edge)
    } else {
      return 'var(--timing-slow-fast)'; // Red (not on-time)
    }
  };

  // Get color for average score display
  const getAverageColor = (score: number) => {
    // Score is 0-100, where 50 is perfect
    const absDistance = Math.abs(score - 50);

    if (absDistance < 7.5) {
      return 'var(--timing-perfect)'; // Green (very good)
    } else if (absDistance < 15) {
      return 'var(--timing-good)'; // Light green (good)
    } else if (absDistance < 20) {
      return 'var(--timing-warning)'; // Amber (on-time but at edge)
    } else {
      return 'var(--timing-slow-fast)'; // Red (not on-time)
    }
  };

  // Determine label based on timing accuracy
  const getLabel = () => {
    if (Math.abs(timingAccuracy) < 40) {
      return 'On-Time';
    } else if (timingAccuracy < -40) {
      return 'Slow';
    } else {
      return 'Fast';
    }
  };

  useEffect(() => {
    if (indicatorRef.current && isTrackingActive) {
      // Use CSS custom properties for smooth transitions
      indicatorRef.current.style.setProperty('--timing-position', `${positionPercent}%`);
      indicatorRef.current.style.setProperty('--timing-color', getColor());

      // Debug: Log indicator update
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Timing Indicator: accuracy=${timingAccuracy}, position=${positionPercent.toFixed(1)}%, label=${getLabel()}, color=${getColor()}`);
      }
    }
  }, [timingAccuracy, positionPercent, isTrackingActive]);

  // Disabled state - grayed out range
  if (isDisabled) {
    return (
      <div className="midi-timing-indicator-wrapper opacity-50">
        <div className="midi-timing-indicator relative">
          {/* Spectrum background */}
          <div className="spectrum-track">
            <div className="spectrum-gradient" />
          </div>

          {/* Message below spectrum */}
          <div className="absolute left-0 right-0 top-1 flex items-center justify-center">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              MIDI Tracking disabled
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Waiting state - tracking on but playback off
  if (isWaiting) {
    return (
      <div className="midi-timing-indicator-wrapper">
        <div className="midi-timing-indicator relative">
          {/* Spectrum background */}
          <div className="spectrum-track">
            <div className="spectrum-gradient" />
          </div>

          {/* Waiting message below spectrum */}
          <div className="absolute left-0 right-0 top-1 flex items-center justify-center">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
              Waiting for play to start
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Showing average state
  if (isShowingAverage) {
    const avgColor = getAverageColor(averageScore);
    return (
      <div className="midi-timing-indicator-wrapper">
        <div className="midi-timing-indicator">
          {/* Spectrum background */}
          <div className="spectrum-track">
            <div className="spectrum-gradient" />
          </div>

          {/* Average indicator dot positioned on spectrum based on score */}
          <div
            className="absolute"
            style={{
              left: `${averageScore}%`,
              top: '1.8rem',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: avgColor,
                boxShadow: `0 0 12px ${avgColor}, 0 0 24px rgba(0, 0, 0, 0.15)`,
              }}
            />
          </div>

          {/* Status label and score display - same line */}
          <div className="absolute left-0 right-0 top-1 flex items-center justify-center gap-1">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing average score
            </div>
            <div
              style={{
                color: avgColor,
              }}
              className="text-sm font-bold font-mono"
            >
              {Math.round(averageScore)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active tracking state
  return (
    <div className="midi-timing-indicator-wrapper">
      <div ref={indicatorRef} className="midi-timing-indicator">
        {/* Spectrum background */}
        <div className="spectrum-track">
          <div className="spectrum-gradient" />
        </div>

        {/* Animated indicator dot and label */}
        <div className="indicator-container">
          <div className="indicator-dot" />
          <div className="indicator-label">{getLabel()}</div>
        </div>

        {/* Accuracy value display */}
        <div className="accuracy-value">
          {timingAccuracy >= 0 ? '+' : ''}{timingAccuracy.toFixed(0)}ms
        </div>
      </div>
    </div>
  );
}

export default MIDITimingIndicator;
