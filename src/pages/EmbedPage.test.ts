/** Tests for EmbedPage hover labels that also show on keyboard focus (#155) */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('EmbedPage focus-visible labels', () => {
  const source = readFileSync(`${__dirname}/EmbedPage.tsx`, 'utf8');

  it('shows both hover-only labels on keyboard focus', () => {
    const labels = ['Set Tempo & Swing', 'Edit Groove'];
    for (const label of labels) {
      const line = source.split('\n').find((l) => l.includes(`>${label}</span>`));
      expect(line).toBeDefined();
      expect(line).toContain('group-hover:inline');
      expect(line).toContain('group-focus-visible:inline');
    }
  });

  it('names the play button Stop while playing', () => {
    expect(source).toContain("isPlaying ? 'Stop' : 'Play'");
    expect(source).not.toContain("'Pause'");
  });
});
