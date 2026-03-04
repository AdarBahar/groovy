/**
 * Unit tests for escapeXml function
 *
 * Security focus: Ensures that the escapeXml function properly escapes all
 * dangerous XML/SVG characters that could lead to injection attacks.
 *
 * These tests verify the core sanitization logic that protects against
 * metadata injection attacks from URL parameters.
 */

import { describe, it, expect } from 'vitest';
import { escapeXml } from './ExportUtils';

describe('escapeXml - XML/SVG Injection Prevention', () => {
  describe('XML special character escaping', () => {
    /**
     * Test escaping of the five main XML special characters
     */
    it('escapes ampersand (&)', () => {
      expect(escapeXml('Rock & Roll')).toBe('Rock &amp; Roll');
    });

    it('escapes less-than (<)', () => {
      expect(escapeXml('A < B')).toBe('A &lt; B');
    });

    it('escapes greater-than (>)', () => {
      expect(escapeXml('A > B')).toBe('A &gt; B');
    });

    it('escapes double quote (")', () => {
      expect(escapeXml('Say "Hello"')).toBe('Say &quot;Hello&quot;');
    });

    it('escapes single quote (\') to &apos;', () => {
      expect(escapeXml("It's mine")).toBe("It&apos;s mine");
    });

    it('escapes backtick (`) to &#96;', () => {
      expect(escapeXml('Template `${x}`')).toBe('Template &#96;${x}&#96;');
    });
  });

  describe('Control character removal', () => {
    /**
     * Test removal of dangerous control characters
     * while preserving safe ones (tab, newline, carriage return)
     */
    it('removes null byte (\\x00)', () => {
      expect(escapeXml('Hello\x00World')).toBe('HelloWorld');
    });

    it('removes other control chars (\\x01-\\x08)', () => {
      expect(escapeXml('A\x01B\x02C\x03D')).toBe('ABCD');
    });

    it('preserves tab character', () => {
      expect(escapeXml('A\tB')).toBe('A\tB');
    });

    it('preserves newline character', () => {
      expect(escapeXml('A\nB')).toBe('A\nB');
    });

    it('preserves carriage return character', () => {
      expect(escapeXml('A\rB')).toBe('A\rB');
    });

    it('removes DEL character (\\x7F)', () => {
      expect(escapeXml('A\x7FB')).toBe('AB');
    });

    it('removes form feed (\\x0C)', () => {
      expect(escapeXml('A\x0CB')).toBe('AB');
    });

    it('removes vertical tab (\\x0B)', () => {
      expect(escapeXml('A\x0BB')).toBe('AB');
    });
  });

  describe('Edge cases', () => {
    it('handles empty string', () => {
      expect(escapeXml('')).toBe('');
    });

    it('handles null input', () => {
      expect(escapeXml(null as any)).toBe('');
    });

    it('handles undefined input', () => {
      expect(escapeXml(undefined as any)).toBe('');
    });

    it('handles string with only control characters', () => {
      expect(escapeXml('\x00\x01\x02')).toBe('');
    });

    it('handles very long string', () => {
      const longStr = 'A'.repeat(10000) + '&' + 'B'.repeat(10000);
      const escaped = escapeXml(longStr);
      expect(escaped).toContain('&amp;');
      expect(escaped.length).toBeGreaterThan(longStr.length);
    });
  });

  describe('XSS payload prevention', () => {
    /**
     * Test common XSS payloads that attackers might try through URL parameters
     */
    it('prevents basic script injection', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
    });

    it('prevents event handler injection', () => {
      const input = '" onload="alert(1)';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&quot;');
      expect(escaped).not.toContain('" onload=');
    });

    it('prevents SVG injection', () => {
      const input = '<image href="x" onerror="alert(1)">';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&lt;image');
      expect(escaped).toContain('&quot;');
      expect(escaped).not.toContain('<image');
    });

    it('prevents comment breakout', () => {
      const input = '--><script>alert(1)</script><!--';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('prevents template expression injection by escaping backticks', () => {
      // Template expressions require backticks in JavaScript
      const input = '`${7*7}`';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&#96;');
      expect(escaped).toBe('&#96;${7*7}&#96;');
    });

    it('prevents CDATA injection', () => {
      const input = ']]><![CDATA[INJECTION';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain(']]>');
    });
  });

  describe('Multiple special characters', () => {
    it('escapes all XML special chars together', () => {
      const input = '&<>"\'`';
      const escaped = escapeXml(input);

      expect(escaped).toBe('&amp;&lt;&gt;&quot;&apos;&#96;');
    });

    it('escapes mixed safe and unsafe content', () => {
      const input = 'Hello & <World> "Beautiful" \'Day\'';
      const escaped = escapeXml(input);

      expect(escaped).toBe('Hello &amp; &lt;World&gt; &quot;Beautiful&quot; &apos;Day&apos;');
    });

    it('handles repeated special chars', () => {
      const input = '&&&';
      const escaped = escapeXml(input);

      expect(escaped).toBe('&amp;&amp;&amp;');
      // Should NOT double-escape
      expect(escaped).not.toContain('&amp;amp;');
    });

    it('handles alternating pattern', () => {
      const input = '<tag attr="value">';
      const escaped = escapeXml(input);

      expect(escaped).toBe('&lt;tag attr=&quot;value&quot;&gt;');
    });
  });

  describe('Unicode and special characters', () => {
    it('preserves unicode characters', () => {
      expect(escapeXml('Café')).toBe('Café');
    });

    it('preserves emoji', () => {
      expect(escapeXml('🥁 Drum')).toBe('🥁 Drum');
    });

    it('preserves accented characters', () => {
      expect(escapeXml('Naïve')).toBe('Naïve');
    });

    it('preserves Chinese characters', () => {
      expect(escapeXml('鼓 Drum')).toBe('鼓 Drum');
    });

    it('escapes XML chars mixed with unicode', () => {
      const input = 'Café <Groove> & "Mix" 🥁';
      const escaped = escapeXml(input);

      expect(escaped).toContain('Café');
      expect(escaped).toContain('&lt;Groove&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('🥁');
    });
  });

  describe('Performance and robustness', () => {
    it('handles string with many escape sequences', () => {
      const input = '&'.repeat(100);
      const escaped = escapeXml(input);

      expect(escaped).toBe('&amp;'.repeat(100));
    });

    it('does not cause ReDoS', () => {
      // This should complete quickly even with complex patterns
      const input = 'A'.repeat(1000) + '&<>"\'`' + 'B'.repeat(1000);
      const start = performance.now();
      const escaped = escapeXml(input);
      const duration = performance.now() - start;

      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
      expect(escaped).toBeDefined();
    });
  });

  describe('Practical metadata examples', () => {
    /**
     * Test real-world examples of metadata that might come from URL parameters
     */
    it('handles drum groove title', () => {
      const input = 'Rock & Roll > Hip-Hop "Classic" Mix';
      const escaped = escapeXml(input);

      expect(escaped).toBe('Rock &amp; Roll &gt; Hip-Hop &quot;Classic&quot; Mix');
    });

    it('handles author with special characters', () => {
      const input = 'Smith & Associates <NYC>';
      const escaped = escapeXml(input);

      expect(escaped).toBe('Smith &amp; Associates &lt;NYC&gt;');
    });

    it('handles comment with HTML-like content', () => {
      const input = 'A section for <background> "loops" & effects';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&lt;background&gt;');
      expect(escaped).toContain('&quot;loops&quot;');
      expect(escaped).toContain('&amp;');
    });

    it('handles URL-like strings', () => {
      const input = 'https://example.com?a=1&b=2&c="test"';
      const escaped = escapeXml(input);

      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
    });
  });

  describe('Order of escape operations', () => {
    /**
     * Verify that escape operations happen in the correct order
     * to avoid double-escaping
     */
    it('escapes ampersand first', () => {
      const input = '&<';
      const escaped = escapeXml(input);

      // Should be &amp;&lt;, not &lt;amp;
      expect(escaped).toBe('&amp;&lt;');
    });

    it('does not double-escape ampersands', () => {
      const input = '&';
      const escaped = escapeXml(input);

      expect(escaped).toBe('&amp;');
      expect(escaped).not.toContain('&amp;amp;');
    });

    it('handles complex sequence correctly', () => {
      const input = '<tag attr="&value">';
      const escaped = escapeXml(input);

      expect(escaped).toBe('&lt;tag attr=&quot;&amp;value&quot;&gt;');
    });
  });

  describe('Boundary conditions', () => {
    it('handles input at validation limits', () => {
      // From GrooveURLCodec: TITLE_MAX_LENGTH is 200
      const maxTitle = 'A'.repeat(200);
      const escaped = escapeXml(maxTitle);

      expect(escaped).toBe('A'.repeat(200));
    });

    it('handles large author with special chars', () => {
      // From GrooveURLCodec: AUTHOR_MAX_LENGTH is 100
      const maxAuthor = ('A'.repeat(50) + ' & ').repeat(2);
      const escaped = escapeXml(maxAuthor);

      expect(escaped).toContain('&amp;');
    });

    it('handles large comments with special chars', () => {
      // From GrooveURLCodec: COMMENTS_MAX_LENGTH is 1000
      const maxComments = ('<comment> & "text"'.repeat(50));
      const escaped = escapeXml(maxComments);

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
    });
  });
});
