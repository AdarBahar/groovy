import { Link } from 'react-router-dom';
import { HelpCircle, Sun } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  metronome?: 'off' | '4th' | '8th' | '16th';
  onMetronomeChange?: (value: 'off' | '4th' | '8th' | '16th') => void;
}

export function Header({ metronome = 'off', onMetronomeChange }: HeaderProps) {
  const metronomeOptions: Array<'off' | '4th' | '8th' | '16th'> = ['off', '4th', '8th', '16th'];

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-white font-semibold text-lg">Groovy</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Metronome:</span>
          {metronomeOptions.map((option) => (
            <button
              key={option}
              onClick={() => onMetronomeChange?.(option)}
              className={`${metronome === option ? 'text-white' : 'text-slate-500'} hover:text-white transition-colors uppercase`}
            >
              {option === 'off' ? 'OFF' : option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/poc">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            📁 My Grooves
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
          <Sun className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

