import { HelpCircle, Sun } from 'lucide-react';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-white font-semibold text-lg">Groovy</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Metronome:</span>
          <button className="text-slate-500 hover:text-white transition-colors">OFF</button>
          <button className="text-slate-400 hover:text-white transition-colors">4th</button>
          <button className="text-slate-400 hover:text-white transition-colors">8th</button>
          <button className="text-slate-400 hover:text-white transition-colors">16th</button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          <span className="mr-2">📁</span> My Grooves
        </Button>
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
