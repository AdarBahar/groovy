import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

interface MetadataFieldsProps {
  title: string;
  author: string;
  comments: string;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onCommentsChange: (comments: string) => void;
  isNotesOnly: boolean;
}

export interface MetadataFieldsRef {
  openAndFocusTitle: () => void;
}

export const MetadataFields = forwardRef<MetadataFieldsRef, MetadataFieldsProps>(function MetadataFields({
  title,
  author,
  comments,
  onTitleChange,
  onAuthorChange,
  onCommentsChange,
  isNotesOnly,
}, ref) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempAuthor, setTempAuthor] = useState(author);
  const [tempComments, setTempComments] = useState(comments);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync temp values when props change (e.g., loading a groove)
  useEffect(() => {
    if (!isEditing) {
      setTempTitle(title);
      setTempAuthor(author);
      setTempComments(comments);
    }
  }, [title, author, comments, isEditing]);

  useImperativeHandle(ref, () => ({
    openAndFocusTitle: () => {
      setTempTitle(title);
      setTempAuthor(author);
      setTempComments(comments);
      setIsEditing(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 100);
    },
  }));

  const handleEdit = () => {
    setTempTitle(title);
    setTempAuthor(author);
    setTempComments(comments);
    setIsEditing(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleSave = () => {
    onTitleChange(tempTitle);
    onAuthorChange(tempAuthor);
    onCommentsChange(tempComments);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempTitle(title);
    setTempAuthor(author);
    setTempComments(comments);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayTitle = title || 'Untitled Groove';
  const displayAuthor = author || '';

  // State 1: View-Only Mode (Notes Only)
  if (isNotesOnly) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{displayTitle}</h1>
        {displayAuthor && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{displayAuthor}</p>
        )}
      </div>
    );
  }

  // State 3: Editing Mode
  if (isEditing) {
    return (
      <div className="space-y-3">
        {/* Grid: 1 column on mobile, 3 columns on tablet+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 block">Title</label>
            <Input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My New Groove"
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 block">Author</label>
            <Input
              type="text"
              value={tempAuthor}
              onChange={(e) => setTempAuthor(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Drummer One"
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 block">Comment</label>
            <Input
              type="text"
              value={tempComments}
              onChange={(e) => setTempComments(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add notes..."
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs uppercase px-3 py-2 h-auto flex items-center gap-1 touch-target"
          >
            <Check className="w-3 h-3" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs uppercase px-3 py-2 h-auto flex items-center gap-1 touch-target"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Display Mode (Edit Mode - Not Editing)
  return (
    <div className="flex items-start gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 mt-1 touch-target"
      >
        <Edit2 className="w-4 h-4" />
        <span className="text-xs uppercase hidden sm:inline">Edit</span>
      </Button>
      <div className="space-y-1 flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">{displayTitle}</h1>
        {displayAuthor && (
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{displayAuthor}</p>
        )}
      </div>
    </div>
  );
});
