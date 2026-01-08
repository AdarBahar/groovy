import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface MetadataFieldsProps {
  title: string;
  author: string;
  comments: string;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onCommentsChange: (comments: string) => void;
}

export function MetadataFields({
  title,
  author,
  comments,
  onTitleChange,
  onAuthorChange,
  onCommentsChange,
}: MetadataFieldsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-800/30 rounded-lg border border-slate-700">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 text-left"
      >
        <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Details</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </Button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Title</label>
              <Input
                type="text"
                placeholder="My New Groove"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Author</label>
              <Input
                type="text"
                placeholder="Drummer One"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Comment</label>
              <Input
                type="text"
                placeholder="Add notes..."
                value={comments}
                onChange={(e) => onCommentsChange(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

