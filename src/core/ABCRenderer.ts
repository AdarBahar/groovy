/**
 * ABC Renderer
 * 
 * Wrapper around abcjs library for rendering ABC notation to SVG.
 * Provides a simplified API with sensible defaults for drum notation.
 */

import abcjs from 'abcjs';

export interface ABCRenderOptions {
  /** Width of the staff in pixels (default: 800) */
  staffWidth?: number;
  /** Scale factor for the notation (default: 1.0) */
  scale?: number;
  /** Padding around the notation in pixels */
  padding?: number;
  /** Whether to make the SVG responsive (resize with container) */
  responsive?: boolean;
  /** Foreground color for notes and lines */
  foregroundColor?: string;
  /** Add CSS classes to elements for styling */
  addClasses?: boolean;
}

export interface ABCRenderResult {
  /** Whether rendering was successful */
  success: boolean;
  /** Error message if rendering failed */
  error?: string;
  /** The tune object returned by abcjs (for advanced use) */
  tuneObject?: abcjs.TuneObject;
}

/**
 * Default render options for drum notation
 */
const DEFAULT_OPTIONS: ABCRenderOptions = {
  staffWidth: 740,
  scale: 1.0,
  padding: 10,
  responsive: true,
  addClasses: true,
};

/**
 * Render ABC notation string to an HTML element as SVG
 * 
 * @param abc - The ABC notation string to render
 * @param element - The HTML element to render into (will be cleared)
 * @param options - Rendering options
 * @returns Result object with success status and any errors
 */
export function renderABC(
  abc: string,
  element: HTMLElement | string,
  options: ABCRenderOptions = {}
): ABCRenderResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Build abcjs params
    const params: abcjs.AbcVisualParams = {
      staffwidth: opts.staffWidth,
      scale: opts.scale,
      paddingtop: opts.padding,
      paddingbottom: opts.padding,
      paddingleft: opts.padding,
      paddingright: opts.padding,
      responsive: opts.responsive ? 'resize' : undefined,
      add_classes: opts.addClasses,
      foregroundColor: opts.foregroundColor,
    };

    // Render the ABC notation
    const tuneObjects = abcjs.renderAbc(element, abc, params);

    // tuneObjects is typed as [TuneObject] (tuple with exactly 1 element)
    // but we still check for safety at runtime
    if (!tuneObjects) {
      return {
        success: false,
        error: 'No tune objects returned from abcjs',
      };
    }

    return {
      success: true,
      tuneObject: tuneObjects[0],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Render ABC notation to an SVG string (without DOM)
 * Useful for server-side rendering or testing
 * 
 * @param abc - The ABC notation string to render
 * @param options - Rendering options
 * @returns SVG string or null if rendering failed
 */
export function renderABCToString(
  abc: string,
  options: ABCRenderOptions = {}
): string | null {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const result = renderABC(abc, container, options);
    if (!result.success) {
      return null;
    }
    // Safely extract SVG using DOM traversal instead of innerHTML
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      return null;
    }
    // Use XMLSerializer to safely convert SVG to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Clear the rendered notation from an element
 */
export function clearRenderedABC(element: HTMLElement | string): void {
  const el = typeof element === 'string'
    ? document.querySelector(element)
    : element;
  if (el) {
    // Safely remove all child nodes instead of using innerHTML
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
}

// Export namespace for convenience
export const ABCRenderer = {
  render: renderABC,
  renderToString: renderABCToString,
  clear: clearRenderedABC,
};

