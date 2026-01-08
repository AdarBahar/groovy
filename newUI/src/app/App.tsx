import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlaybackControls } from './components/PlaybackControls';
import { Sequencer } from './components/Sequencer';
import { MetadataFields } from './components/MetadataFields';
import { TrackEditor } from './components/TrackEditor';
import { BottomToolbar } from './components/BottomToolbar';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { Button } from './components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function App() {
  const [isNotesOnly, setIsNotesOnly] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isNotesOnly={isNotesOnly} 
          onToggleNotesOnly={() => setIsNotesOnly(!isNotesOnly)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Playback controls */}
              <PlaybackControls />
              
              {/* Main sequencer */}
              <Sequencer />
              
              {!isNotesOnly && (
                <>
                  {/* Metadata fields */}
                  <MetadataFields />
                  
                  {/* Clear and Stickings buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white flex items-center gap-2 h-auto py-2 px-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs uppercase">Clear</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white flex items-center gap-2 h-auto py-2 px-4"
                    >
                      <div className="w-4 h-4 flex items-center justify-center font-bold text-sm">
                        S
                      </div>
                      <span className="text-xs uppercase">Stickings</span>
                    </Button>
                  </div>
                  
                  {/* Track editor */}
                  <TrackEditor />
                </>
              )}
            </div>
          </main>
          
          {!isNotesOnly && <KeyboardShortcuts />}
        </div>
      </div>
      
      <BottomToolbar />
    </div>
  );
}