import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Edit2, Check, X, Save, Download, Printer, Share2, Hand } from 'lucide-react';
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
//import { ChevronDown, ChevronUp } from 'lucide-react';

const TITLE_MAX_LENGTH = 50;
const AUTHOR_MAX_LENGTH = 50;
const COMMENT_MAX_LENGTH = 300;

function sanitizeMetadataInput(value: string, maxLength: number): string {
  return value
    .normalize('NFKC')
    // eslint-disable-next-line no-control-regex -- Intentional: remove control characters from user input.
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
  isStickingSetupActive?: boolean;
  onStickingSetupToggle?: () => void;
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
  isStickingSetupActive = false,
  onStickingSetupToggle,
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
        <h1 className="text-2xl sm:text-[28px] sm:leading-8 font-medium break-words text-ink-1">{titleAuthorLine}</h1>
        {displayComments && (
          <p className="text-sm break-words text-ink-2">{displayComments}</p>
        )}
      </div>
    );
  }

  // State 3: Editing Mode
  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Row 1: Title / Author */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,52ch)_auto_minmax(0,52ch)] md:justify-start gap-3 items-start">
          <div className="space-y-2 min-w-0 md:max-w-[52ch]">
            <label htmlFor="groove-title" className="text-xs leading-4 font-normal text-ink-2 block">Title</label>
            <Input
              ref={titleInputRef}
              id="groove-title"
              name="title"
              autoComplete="off"
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(sanitizeMetadataInput(e.target.value, TITLE_MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="My New Groove"
              className={`w-full bg-surface-3 dark:bg-surface-3 text-ink-1 placeholder:text-ink-3 text-base selectable ${
                isTitleAtLimit
                  ? 'border-brass-text ring-1 ring-brass-text'
                  : 'border-line-strong'
              }`}
            />
            {isTitleAtLimit && (
              <p role="status" aria-live="polite" className="text-xs text-brass-text">
                Max {TITLE_MAX_LENGTH} characters are allowed
              </p>
            )}
          </div>

          <div className="hidden md:flex items-center justify-center pt-8 text-ink-3 text-sm">
            /
          </div>

          <div className="space-y-2 min-w-0 md:max-w-[52ch]">
            <label htmlFor="groove-author" className="text-xs leading-4 font-normal text-ink-2 block">Author</label>
            <Input
              id="groove-author"
              name="author"
              autoComplete="off"
              type="text"
              value={tempAuthor}
              onChange={(e) => setTempAuthor(sanitizeMetadataInput(e.target.value, AUTHOR_MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              maxLength={AUTHOR_MAX_LENGTH}
              placeholder="Drummer One"
              className={`w-full bg-surface-3 dark:bg-surface-3 text-ink-1 placeholder:text-ink-3 text-base selectable ${
                isAuthorAtLimit
                  ? 'border-brass-text ring-1 ring-brass-text'
                  : 'border-line-strong'
              }`}
            />
            {isAuthorAtLimit && (
              <p role="status" aria-live="polite" className="text-xs text-brass-text">
                Max {AUTHOR_MAX_LENGTH} characters are allowed
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Comments */}
        <div className="space-y-2 md:max-w-[110ch]">
          <label htmlFor="groove-comments" className="text-xs leading-4 font-normal text-ink-2 block">Comments</label>
          <Input
            id="groove-comments"
            name="comments"
            autoComplete="off"
            type="text"
            value={tempComments}
            onChange={(e) => setTempComments(sanitizeMetadataInput(e.target.value, COMMENT_MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="Add notes…"
            className={`w-full bg-surface-3 dark:bg-surface-3 text-ink-1 placeholder:text-ink-3 text-base selectable ${
              isCommentAtLimit
                ? 'border-brass-text ring-1 ring-brass-text'
                : 'border-line-strong'
            }`}
          />
          {isCommentAtLimit && (
            <p role="status" aria-live="polite" className="text-xs text-brass-text">
              Max {COMMENT_MAX_LENGTH} characters are allowed
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-ink-1 hover:bg-ink-1/90 text-surface-1 text-sm h-9 px-4 has-[>svg]:px-4 flex items-center gap-2 touch-target"
          >
            <Check className="w-4 h-4" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 text-sm font-normal h-9 px-3 has-[>svg]:px-3 flex items-center gap-2 touch-target"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Display Mode (Edit Mode - Not Editing)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="space-y-1 flex-1 min-w-0">
        <div className="group max-w-full flex items-center gap-3 text-left text-ink-1 transition-colors">
          <h1 className="text-2xl sm:text-[28px] sm:leading-8 font-medium break-words min-w-0">
            <button
              type="button"
              onClick={handleEdit}
              className="text-left"
              title="Edit groove details"
            >
              {titleAuthorLine}
            </button>
          </h1>
          <button
            type="button"
            onClick={handleEdit}
            aria-label="Edit groove details"
            className="flex items-center gap-2 h-9 px-2 rounded-md text-ink-3 group-hover:text-ink-1 hover:bg-surface-3 transition-colors"
          >
            <Edit2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm hidden sm:inline">
              Edit
            </span>
          </button>
        </div>
        {displayComments && (
          <p className="text-sm text-ink-2 truncate">{displayComments}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-wrap max-sm:-ml-3 sm:justify-end">
        {onStickingSetupToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStickingSetupToggle}
            aria-pressed={isStickingSetupActive}
            className={`h-9 px-3 has-[>svg]:px-3 font-normal flex items-center gap-2 touch-target ${
              isStickingSetupActive
                ? 'bg-surface-3 hover:bg-surface-4 dark:hover:bg-surface-4 text-ink-1 shadow-[inset_0_0_0_1px_var(--ui-line),inset_0_-2px_0_var(--ui-brass-text)]'
                : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
            }`}
            title="Toggle sticking setup"
            aria-label="Toggle sticking setup"
          >
            <Hand className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Sticking</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveGroove}
          className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 px-3 has-[>svg]:px-3 font-normal flex items-center gap-2 touch-target"
          title="Save Groove"
          aria-label="Save Groove"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 px-3 has-[>svg]:px-3 font-normal flex items-center gap-2 touch-target"
          title="Download"
          aria-label="Download"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm hidden lg:inline">Download</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrint}
          className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 px-3 has-[>svg]:px-3 font-normal flex items-center gap-2 touch-target"
          title="Print"
          aria-label="Print"
        >
          <Printer className="w-4 h-4" />
          <span className="text-sm hidden lg:inline">Print</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 px-3 has-[>svg]:px-3 font-normal flex items-center gap-2 touch-target"
          title="Share"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm hidden lg:inline">Share</span>
        </Button>
      </div>
    </div>
  );
});
