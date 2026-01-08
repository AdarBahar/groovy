import { Download, Printer, Share2, Save } from 'lucide-react';
import { Button } from './ui/button';

export function BottomToolbar() {
  return (
    <div className="bg-slate-900 border-t border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-slate-400 text-sm">
          Groovy by Adar Bahar © 2026
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-4"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs uppercase">Download</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-4"
          >
            <Printer className="w-5 h-5" />
            <span className="text-xs uppercase">Print</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white flex flex-col items-center gap-1 h-auto py-2 px-4"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs uppercase">Share</span>
          </Button>
          
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 h-auto py-3 px-6 ml-4"
          >
            <Save className="w-5 h-5" />
            <span className="uppercase font-semibold">Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
}