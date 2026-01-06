import './MetadataEditor.css';

interface MetadataEditorProps {
  title: string;
  author: string;
  comments: string;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onCommentsChange: (comments: string) => void;
}

/**
 * Editor for groove metadata (title, author, comments)
 */
export default function MetadataEditor({
  title,
  author,
  comments,
  onTitleChange,
  onAuthorChange,
  onCommentsChange,
}: MetadataEditorProps) {
  return (
    <div className="metadata-editor">
      <div className="metadata-field">
        <label htmlFor="groove-title">Title</label>
        <input
          id="groove-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Groove"
          maxLength={100}
        />
      </div>

      <div className="metadata-field">
        <label htmlFor="groove-author">Author</label>
        <input
          id="groove-author"
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="Anonymous"
          maxLength={50}
        />
      </div>

      <div className="metadata-field">
        <label htmlFor="groove-comments">Notes</label>
        <textarea
          id="groove-comments"
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Add notes about this groove..."
          maxLength={500}
          rows={2}
        />
      </div>
    </div>
  );
}

