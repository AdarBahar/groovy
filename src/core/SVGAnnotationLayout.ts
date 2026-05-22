import { GrooveData, StickingValue } from '../types';

const TEMPO_TO_STICKING_GAP = 5;
const NOTE_ROW_GAP = 4;
const ROW_GAP = 1;
const ANNOTATION_FONT_SIZE = '11px';
const COUNT_FONT_WEIGHT = 'normal';
const MEASURES_PER_LINE = 3;

interface SvgBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CountAnchor {
  x: number;
  noteLineTop: number;
}

function getCountLabel(position: number, division: number, beats: number): string {
  const subdivisionsPerBeat = division / 4;
  const beatIndex = Math.floor(position / subdivisionsPerBeat);
  const subIndex = position % subdivisionsPerBeat;

  if (beatIndex >= beats) {
    return '';
  }

  const beatNum = beatIndex + 1;

  if (subdivisionsPerBeat === 1) {
    return String(beatNum);
  }
  if (subdivisionsPerBeat === 2) {
    return subIndex === 0 ? String(beatNum) : '&';
  }
  if (subdivisionsPerBeat === 3) {
    const tripletLabels = ['', 'trip', 'let'];
    return subIndex === 0 ? String(beatNum) : tripletLabels[subIndex] || '';
  }
  if (subdivisionsPerBeat === 4) {
    const sixteenthLabels = ['', 'e', '&', 'a'];
    return subIndex === 0 ? String(beatNum) : sixteenthLabels[subIndex] || '';
  }

  return subIndex === 0 ? String(beatNum) : '';
}

function getSvgBox(element: SVGGraphicsElement): SvgBox | null {
  try {
    const box = element.getBBox();
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    };
  } catch {
    return null;
  }
}

function setTextPosition(text: SVGTextElement, x: number, y: number): void {
  text.setAttribute('x', String(x));
  text.setAttribute('y', String(y));
  text.setAttribute('font-size', ANNOTATION_FONT_SIZE);
  text.setAttribute('text-anchor', 'middle');

  text.querySelectorAll('tspan').forEach((tspan) => {
    tspan.setAttribute('x', String(x));
    tspan.setAttribute('y', String(y));
    tspan.setAttribute('font-size', ANNOTATION_FONT_SIZE);
  });
}

function setCountTextPosition(text: SVGTextElement, x: number, y: number): void {
  setTextPosition(text, x, y);
  text.setAttribute('font-weight', COUNT_FONT_WEIGHT);
  text.style.fontWeight = COUNT_FONT_WEIGHT;

  text.querySelectorAll('tspan').forEach((tspan) => {
    tspan.setAttribute('font-weight', COUNT_FONT_WEIGHT);
    tspan.style.fontWeight = COUNT_FONT_WEIGHT;
  });
}

function alignTextBottom(
  text: SVGTextElement,
  x: number,
  targetBottom: number,
  setPosition: (text: SVGTextElement, x: number, y: number) => void = setTextPosition
): SvgBox | null {
  const box = getSvgBox(text);
  if (!box) {
    setPosition(text, x, targetBottom);
    return null;
  }

  const currentY = Number.parseFloat(text.getAttribute('y') || '') || box.y + box.height;
  const adjustedY = currentY + targetBottom - (box.y + box.height);
  setPosition(text, x, adjustedY);
  return getSvgBox(text);
}

function getCountLabels(groove: GrooveData): string[] {
  const labels: string[] = [];

  groove.measures.forEach((measure) => {
    const ts = measure.timeSignature || groove.timeSignature;
    const notesPerMeasure = (groove.division / ts.noteValue) * ts.beats;

    for (let position = 0; position < notesPerMeasure; position++) {
      labels.push(getCountLabel(position, groove.division, ts.beats));
    }
  });

  return labels;
}

function getStickingValues(groove: GrooveData): StickingValue[] {
  const values: StickingValue[] = [];

  groove.measures.forEach((measure) => {
    const ts = measure.timeSignature || groove.timeSignature;
    const notesPerMeasure = (groove.division / ts.noteValue) * ts.beats;

    for (let position = 0; position < notesPerMeasure; position++) {
      const stickingValue =
        measure.sticking && measure.sticking.length === notesPerMeasure
          ? measure.sticking[position]
          : null;
      values.push(stickingValue || null);
    }
  });

  return values;
}

function getNoteContentBoxesForElement(element: SVGGraphicsElement): SvgBox[] {
  const wrapper = element.closest<SVGGElement>('.abcjs-staff-wrapper');
  const scope = wrapper || element.ownerSVGElement;
  if (!scope) {
    return [];
  }

  return Array.from(scope.querySelectorAll<SVGGraphicsElement>(
    '.abcjs-note .abcjs-notehead, .abcjs-note .abcjs-stem, .abcjs-rest, .abcjs-beam-elem'
  ))
    .filter((noteElement) => !noteElement.closest('.abcjs-tempo'))
    .map(getSvgBox)
    .filter((box): box is SvgBox => box !== null);
}

function getNoteLineTopForElement(element: SVGGraphicsElement): number {
  const noteBoxes = getNoteContentBoxesForElement(element);
  if (noteBoxes.length === 0) {
    const box = getSvgBox(element);
    return box ? box.y : 0;
  }

  return noteBoxes.reduce((top, box) => Math.min(top, box.y), Infinity);
}

function getCountAnchorX(element: SVGGraphicsElement): number {
  const notehead = element.querySelector<SVGGraphicsElement>('.abcjs-notehead');
  const box = getSvgBox(notehead || element);
  return box ? box.x + box.width / 2 : 0;
}

function getMeasureNotePoints(wrapper: SVGGraphicsElement, measureIndex: number): Array<{ index: number; x: number }> {
  return Array.from(wrapper.querySelectorAll<SVGGraphicsElement>('.abcjs-note, .abcjs-rest'))
    .map((element) => {
      const className = element.getAttribute('class') || '';
      const measureMatch = className.match(/\babcjs-m(\d+)\b/);
      const noteMatch = className.match(/\babcjs-n(\d+)\b/);
      if (!measureMatch || !noteMatch || Number(measureMatch[1]) !== measureIndex) {
        return null;
      }

      return {
        index: Number(noteMatch[1]),
        x: getCountAnchorX(element),
      };
    })
    .filter((point): point is { index: number; x: number } => point !== null)
    .sort((a, b) => a.index - b.index);
}

function getInferredMeasureXs(
  notePoints: Array<{ index: number; x: number }>,
  positionCount: number
): number[] | null {
  const uniquePoints = notePoints.filter((point, index, points) =>
    index === 0 || point.index !== points[index - 1].index
  );

  if (uniquePoints.length < 2) {
    return null;
  }

  const first = uniquePoints[0];
  const last = uniquePoints[uniquePoints.length - 1];
  if (last.index === first.index) {
    return null;
  }

  const step = (last.x - first.x) / (last.index - first.index);
  return Array.from({ length: positionCount }, (_, position) =>
    first.x + step * (position - first.index)
  );
}

function getCountAnchors(svg: SVGSVGElement): CountAnchor[] {
  return Array.from(svg.querySelectorAll<SVGGraphicsElement>('.abcjs-v0.abcjs-note, .abcjs-v0.abcjs-rest'))
    .filter((element) => !element.closest('.abcjs-tempo'))
    .map((element) => ({
      x: getCountAnchorX(element),
      noteLineTop: getNoteLineTopForElement(element),
    }));
}

function getPositionsPerMeasure(groove: GrooveData): number[] {
  return groove.measures.map((measure) => {
    const ts = measure.timeSignature || groove.timeSignature;
    return (groove.division / ts.noteValue) * ts.beats;
  });
}

function getSyntheticCountAnchors(svg: SVGSVGElement, groove: GrooveData): CountAnchor[] {
  const wrappers = Array.from(svg.querySelectorAll<SVGGraphicsElement>('.abcjs-staff-wrapper'));
  const positionsPerMeasure = getPositionsPerMeasure(groove);
  const anchors: CountAnchor[] = [];

  wrappers.forEach((wrapper, lineIndex) => {
    const firstMeasureIndex = lineIndex * MEASURES_PER_LINE;
    if (firstMeasureIndex >= positionsPerMeasure.length) {
      return;
    }

    const measureCount = Math.min(MEASURES_PER_LINE, positionsPerMeasure.length - firstMeasureIndex);
    const barXs = Array.from(wrapper.querySelectorAll<SVGGraphicsElement>('.abcjs-bar'))
      .map(getSvgBox)
      .filter((box): box is SvgBox => box !== null)
      .map((box) => box.x + box.width / 2)
      .sort((a, b) => a - b);

    if (barXs.length === 0) {
      return;
    }

    const staffStart = Array.from(wrapper.querySelectorAll<SVGGraphicsElement>(
      '.abcjs-staff-extra, .abcjs-clef, .abcjs-time-signature'
    ))
      .map(getSvgBox)
      .filter((box): box is SvgBox => box !== null)
      .reduce((right, box) => Math.max(right, box.x + box.width), 0);

    const noteLineTop = getNoteLineTopForElement(wrapper);

    for (let measureOffset = 0; measureOffset < measureCount; measureOffset++) {
      const measureIndex = firstMeasureIndex + measureOffset;
      const positionCount = positionsPerMeasure[firstMeasureIndex + measureOffset];
      const inferredXs = getInferredMeasureXs(
        getMeasureNotePoints(wrapper, measureIndex),
        positionCount
      );

      if (inferredXs) {
        inferredXs.forEach((x) => {
          anchors.push({ x, noteLineTop });
        });
        continue;
      }

      const leftBoundary = measureOffset === 0 ? staffStart : barXs[measureOffset - 1];
      const rightBoundary = barXs[measureOffset] ?? barXs[barXs.length - 1];
      const measureWidth = rightBoundary - leftBoundary;
      const step = measureWidth / positionCount;

      for (let position = 0; position < positionCount; position++) {
        anchors.push({
          x: leftBoundary + step * (position + 0.5),
          noteLineTop,
        });
      }
    }
  });

  return anchors;
}

function getLayoutCountAnchors(svg: SVGSVGElement, groove: GrooveData): CountAnchor[] {
  const renderedAnchors = getCountAnchors(svg);
  const expectedCount = getCountLabels(groove).length;
  if (renderedAnchors.length === expectedCount) {
    return renderedAnchors;
  }

  const syntheticAnchors = getSyntheticCountAnchors(svg, groove);
  return syntheticAnchors.length === expectedCount ? syntheticAnchors : renderedAnchors;
}

function createCountText(x: number, y: number, label: string): SVGTextElement {
  const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  countText.setAttribute('class', 'abcjs-annotation groovy-count-row');
  setCountTextPosition(countText, x, y);

  const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  tspan.textContent = label;
  countText.appendChild(tspan);
  setCountTextPosition(countText, x, y);

  return countText;
}

function createStickingText(x: number, y: number, value: Exclude<StickingValue, null>): SVGTextElement {
  const stickingText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  stickingText.setAttribute('class', 'abcjs-annotation groovy-sticking-row');
  setTextPosition(stickingText, x, y);

  const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  tspan.textContent = value.replace(/\//g, '⁄');
  stickingText.appendChild(tspan);
  setTextPosition(stickingText, x, y);

  return stickingText;
}

function moveTempoAboveFirstRow(svg: SVGSVGElement, firstRowElements: SVGGraphicsElement[]): void {
  const tempo = svg.querySelector<SVGGraphicsElement>('.abcjs-tempo');
  if (!tempo) {
    return;
  }

  const tempoBox = getSvgBox(tempo);
  if (!tempoBox) {
    return;
  }

  const rowTops = firstRowElements
    .map((element) => getSvgBox(element)?.y)
    .filter((y): y is number => typeof y === 'number');
  if (rowTops.length === 0) {
    return;
  }

  const firstRowTop = Math.min(...rowTops);
  const targetY = Math.max(8, firstRowTop - TEMPO_TO_STICKING_GAP - tempoBox.height);
  const dy = targetY - tempoBox.y;
  tempo.setAttribute('transform', `translate(0 ${dy})`);
}

export function hasVisibleStickings(groove: GrooveData): boolean {
  return groove.measures.some((measure) => measure.sticking?.some(Boolean));
}

export function layoutStickingAndCountRows(svg: SVGSVGElement, groove: GrooveData): void {
  svg.querySelectorAll('.groovy-count-row').forEach((node) => node.remove());
  svg.querySelectorAll('.groovy-sticking-row').forEach((node) => node.remove());

  svg.querySelectorAll<SVGTextElement>('text').forEach((text) => {
    const currentFontSize = text.getAttribute('font-size') || '16';
    const sizePx = Number.parseInt(currentFontSize, 10);
    if (!Number.isNaN(sizePx) && sizePx > 11) {
      text.setAttribute('font-size', ANNOTATION_FONT_SIZE);
    }
    text.querySelectorAll('tspan').forEach((tspan) => {
      tspan.setAttribute('font-size', ANNOTATION_FONT_SIZE);
    });
  });

  const countAnchors = getLayoutCountAnchors(svg, groove);
  if (countAnchors.length === 0) {
    return;
  }

  const countLabels = getCountLabels(groove);
  const stickingValues = getStickingValues(groove);
  const countBoxes: Array<SvgBox | null> = [];
  const countTexts: SVGTextElement[] = [];
  const stickingTexts: SVGTextElement[] = [];

  countAnchors.forEach((anchor, index) => {
    const countLabel = countLabels[index];
    if (!countLabel) {
      countBoxes.push(null);
      return;
    }

    const noteLineTop = anchor.noteLineTop;
    const countBottom = Math.max(8, noteLineTop - NOTE_ROW_GAP);
    const countText = createCountText(anchor.x, countBottom, countLabel);
    svg.appendChild(countText);
    countBoxes.push(alignTextBottom(countText, anchor.x, countBottom, setCountTextPosition));
    countTexts.push(countText);
  });

  stickingValues.forEach((stickingValue, index) => {
    const anchor = countAnchors[index];
    if (!stickingValue || !anchor) {
      return;
    }

    const countBox = countBoxes[index];
    const stickingBottom = countBox
      ? Math.max(8, countBox.y - ROW_GAP)
      : Math.max(8, anchor.noteLineTop - NOTE_ROW_GAP);

    const stickingText = createStickingText(anchor.x, stickingBottom, stickingValue);
    svg.appendChild(stickingText);
    alignTextBottom(stickingText, anchor.x, stickingBottom);
    stickingTexts.push(stickingText);
  });

  const firstRowElements = stickingTexts.length > 0
    ? stickingTexts
    : countTexts;
  moveTempoAboveFirstRow(svg, firstRowElements);
}
