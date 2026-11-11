interface KeyboardShortcutsProps {
  inline?: boolean;
}

export function KeyboardShortcuts({ inline = false }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: 'Space', description: 'Play/pause' },
    { key: 'Arrows', description: 'Move editor cursor' },
    { key: 'Enter', description: 'Toggle note' },
    { key: 'Tab', description: 'Note menu' },
    { key: '⌘/Ctrl+C/V', description: 'Copy/paste measure' },
    { key: '⌘/Ctrl', description: '+drag Paint' },
    { key: '⇧/Alt', description: '+drag Erase' },
    { key: '⌘Z', description: 'Undo' },
    { key: '⌘⇧Z', description: 'Redo' },
  ];

  if (inline) {
    return (
      <div className="hidden md:flex items-center justify-start gap-x-5 gap-y-2 flex-wrap">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <kbd className="bg-surface-3 text-ink-2 border border-line-strong border-b-2 px-1.5 h-6 min-w-6 inline-flex items-center justify-center rounded-md font-mono text-xs leading-none">
              {shortcut.key}
            </kbd>
            <span className="text-ink-3">{shortcut.description}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    // Hidden on mobile - keyboard shortcuts not relevant for touch devices
    <div className="hidden md:block bg-surface-0 border-t border-line py-2 px-6">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <kbd className="bg-surface-3 text-ink-2 border border-line-strong border-b-2 px-1.5 h-6 min-w-6 inline-flex items-center justify-center rounded-md font-mono text-xs leading-none">
              {shortcut.key}
            </kbd>
            <span className="text-ink-3">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
