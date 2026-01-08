export function KeyboardShortcuts() {
  const shortcuts = [
    { key: 'Space', description: 'Play/Pause' },
    { key: 'E', description: 'Edit Mode' },
    { key: '⌘/Ctrl', description: '+drag Paint' },
    { key: '⇧/Alt', description: '+drag Erase' },
    { key: '⌘Z', description: 'Undo' },
    { key: '⌘⇧Z', description: 'Redo' },
  ];

  return (
    <div className="bg-slate-800/50 border-t border-slate-700 py-3 px-6">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <kbd className="bg-slate-700 text-slate-300 px-2 py-1 rounded font-mono">
              {shortcut.key}
            </kbd>
            <span className="text-slate-400">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
