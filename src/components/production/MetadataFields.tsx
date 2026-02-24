import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Edit2, Check, X, Save, Download, Printer, Share2 } from 'lucide-react';
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';

const TITLE_MAX_LENGTH = 50;
const AUTHOR_MAX_LENGTH = 50;
const COMMENT_MAX_LENGTH = 300;

function sanitizeMetadataInput(value: string, maxLength: number): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .slice(0, maxLength);
}

interface MetadataFieldsProps {
  title: string;
  author: string;
  comments: string;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onCommentsChange: (comments: string) => void;
  onMetadataSave?: (metadata: { title: string; author: string; comments: string }) => void;
  onEditingStateChange?: (isEditing: boolean) => void;
  onSaveGroove?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
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
  onMetadataSave,
  onEditingStateChange,
  onSaveGroove,
  onDownload,
  onPrint,
  onShare,
  isNotesOnly,
}, ref) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(sanitizeMetadataInput(title, TITLE_MAX_LENGTH));
  const [tempAuthor, setTempAuthor] = useState(sanitizeMetadataInput(author, AUTHOR_MAX_LENGTH));
  const [tempComments, setTempComments] = useState(sanitizeMetadataInput(comments, COMMENT_MAX_LENGTH));
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync temp values when props change (e.g., loading a groove)
  useEffect(() => {
    if (!isEditing) {
      setTempTitle(sanitizeMetadataInput(title, TITLE_MAX_LENGTH));
      setTempAuthor(sanitizeMetadataInput(author, AUTHOR_MAX_LENGTH));
      setTempComments(sanitizeMetadataInput(comments, COMMENT_MAX_LENGTH));
    }
  }, [title, author, comments, isEditing]);

  useEffect(() => {
    onEditingStateChange?.(isEditing);
    return () => onEditingStateChange?.(false);
  }, [isEditing, onEditingStateChange]);

  useImperativeHandle(ref, () => ({
    openAndFocusTitle: () => {
      setTempTitle(sanitizeMetadataInput(title, TITLE_MAX_LENGTH));
      setTempAuthor(sanitizeMetadataInput(author, AUTHOR_MAX_LENGTH));
      setTempComments(sanitizeMetadataInput(comments, COMMENT_MAX_LENGTH));
      setIsEditing(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 100);
    },
  }));

  const handleEdit = () => {
    setTempTitle(sanitizeMetadataInput(title, TITLE_MAX_LENGTH));
    setTempAuthor(sanitizeMetadataInput(author, AUTHOR_MAX_LENGTH));
    setTempComments(sanitizeMetadataInput(comments, COMMENT_MAX_LENGTH));
    setIsEditing(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleSave = () => {
    const sanitizedTitle = sanitizeMetadataInput(tempTitle, TITLE_MAX_LENGTH).trim();
    const sanitizedAuthor = sanitizeMetadataInput(tempAuthor, AUTHOR_MAX_LENGTH).trim();
    const sanitizedComments = sanitizeMetadataInput(tempComments, COMMENT_MAX_LENGTH).trim();

    if (onMetadataSave) {
      onMetadataSave({
        title: sanitizedTitle,
        author: sanitizedAuthor,
        comments: sanitizedComments,
      });
    } else {
      onTitleChange(sanitizedTitle);
      onAuthorChange(sanitizedAuthor);
      onCommentsChange(sanitizedComments);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempTitle(sanitizeMetadataInput(title, TITLE_MAX_LENGTH));
    setTempAuthor(sanitizeMetadataInput(author, AUTHOR_MAX_LENGTH));
    setTempComments(sanitizeMetadataInput(comments, COMMENT_MAX_LENGTH));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayTitle = title || 'Untitled Groove';
  const displayAuthor = author || '';
  const displayComments = comments || '';
  const titleAuthorLine = displayAuthor ? `${displayTitle} / ${displayAuthor}` : displayTitle;
  const isTitleAtLimit = tempTitle.length >= TITLE_MAX_LENGTH;
  const isAuthorAtLimit = tempAuthor.length >= AUTHOR_MAX_LENGTH;
  const isCommentAtLimit = tempComments.length >= COMMENT_MAX_LENGTH;

  // State 1: View-Only Mode (Notes Only)
  if (isNotesOnly) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{titleAuthorLine}</h1>
        {displayComments && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{displayComments}</p>
        )}
      </div>
    );
  }

  // State 3: Editing Mode
  if (isEditing) {
    return (
      <div className="space-y-2">
        {/* Row 1: Title / Author */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,52ch)_auto_minmax(0,52ch)] md:justify-start gap-2 items-start">
          <div className="space-y-1.5 min-w-0 md:max-w-[52ch]">
            <label className="text-xs text-slate-600 dark:text-slate-400 block">Title</label>
            <Input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(sanitizeMetadataInput(e.target.value, TITLE_MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="My New Groove"
              className={`w-full bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable ${
                isTitleAtLimit
                  ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-400/60'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {isTitleAtLimit && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Max {TITLE_MAX_LENGTH} characters are allowed
              </p>
            )}
          </div>

          <div className="hidden md:flex items-center justify-center pt-6 text-slate-400 dark:text-slate-500 text-sm">
            /
          </div>

          <div className="space-y-1.5 min-w-0 md:max-w-[52ch]">
            <label className="text-xs text-slate-600 dark:text-slate-400 block">Author</label>
            <Input
              type="text"
              value={tempAuthor}
              onChange={(e) => setTempAuthor(sanitizeMetadataInput(e.target.value, AUTHOR_MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              maxLength={AUTHOR_MAX_LENGTH}
              placeholder="Drummer One"
              className={`w-full bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable ${
                isAuthorAtLimit
                  ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-400/60'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {isAuthorAtLimit && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Max {AUTHOR_MAX_LENGTH} characters are allowed
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Comments */}
        <div className="space-y-1.5 md:max-w-[110ch]">
          <label className="text-xs text-slate-600 dark:text-slate-400 block">Comments</label>
          <Input
            type="text"
            value={tempComments}
            onChange={(e) => setTempComments(sanitizeMetadataInput(e.target.value, COMMENT_MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="Add notes..."
            className={`w-full bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base selectable ${
              isCommentAtLimit
                ? 'border-amber-500 dark:border-amber-400 ring-1 ring-amber-400/60'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {isCommentAtLimit && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Max {COMMENT_MAX_LENGTH} characters are allowed
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs uppercase px-3 py-1.5 h-auto flex items-center gap-1 touch-target"
          >
            <Check className="w-3 h-3" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs uppercase px-3 py-1.5 h-auto flex items-center gap-1 touch-target"
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
    <div className="flex items-start gap-2.5">
      <div className="space-y-1 flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">{titleAuthorLine}</h1>
        {displayComments && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayComments}</p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5 flex-wrap justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 touch-target"
        >
          <Edit2 className="w-4 h-4" />
          <span className="text-xs uppercase hidden sm:inline">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveGroove}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 touch-target"
          title="Save Groove"
        >
          <Save className="w-4 h-4" />
          <span className="text-xs uppercase hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 touch-target"
          title="Download"
        >
          <Download className="w-4 h-4" />
          <span className="text-xs uppercase hidden lg:inline">Download</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrint}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 touch-target"
          title="Print"
        >
          <Printer className="w-4 h-4" />
          <span className="text-xs uppercase hidden lg:inline">Print</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 touch-target"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs uppercase hidden lg:inline">Share</span>
        </Button>
      </div>
    </div>
  );
});
