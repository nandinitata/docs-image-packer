/**
 * Justified-rows layout. Pure math, no Google Docs calls, so it can be unit
 * tested on its own with node.
 *
 * Given each image's aspect ratio (width / height), the usable page width, a
 * target row height, and a gap between images, it groups the images into rows.
 * Every row is scaled so its images share one height and the row fills the full
 * width. That removes the side gaps you get when images stack one per line.
 *
 * The same file runs inside Apps Script (where `module` does not exist) and in
 * node (where it does), thanks to the export guard at the bottom.
 */

/**
 * @param {number[]} aspects  width/height for each image, in document order
 * @param {Object} opts
 * @param {number} opts.usableWidth   page width minus left/right margins (pt)
 * @param {number} opts.targetHeight  the comfortable row height to aim for (pt)
 * @param {number} opts.gap           space between images in a row (pt)
 * @param {number} [opts.maxHeight]   a row is never taller than this (pt)
 * @returns {{height:number, items:{index:number, width:number, height:number}[]}[]}
 */
function packRows(aspects, opts) {
  var usableWidth = opts.usableWidth;
  var targetHeight = opts.targetHeight;
  var gap = opts.gap || 0;
  var maxHeight = opts.maxHeight || targetHeight * 1.5;

  if (!aspects || aspects.length === 0) return [];

  var rows = [];
  var current = []; // list of {index, aspect}

  function rowHeightFor(items) {
    // height H such that sum(H*aspect) + gaps = usableWidth
    var aspectSum = 0;
    for (var i = 0; i < items.length; i++) aspectSum += items[i].aspect;
    var gaps = gap * (items.length - 1);
    if (aspectSum <= 0) return targetHeight;
    return (usableWidth - gaps) / aspectSum;
  }

  function closeRow(items, stretch) {
    var height;
    if (stretch) {
      height = rowHeightFor(items);
      // one very wide image could force a tiny height; keep it sane
      if (height > maxHeight) height = maxHeight;
    } else {
      // the last row is left at the target height instead of blown up
      height = Math.min(targetHeight, maxHeight);
    }
    var out = { height: round(height), items: [] };
    for (var i = 0; i < items.length; i++) {
      out.items.push({
        index: items[i].index,
        width: round(height * items[i].aspect),
        height: round(height),
      });
    }
    return out;
  }

  for (var i = 0; i < aspects.length; i++) {
    current.push({ index: i, aspect: clampAspect(aspects[i]) });
    // once the row, scaled to fill the width, would be no taller than the
    // target, this row is full, so close it (stretched to fill the width).
    if (rowHeightFor(current) <= targetHeight) {
      rows.push(closeRow(current, true));
      current = [];
    }
  }
  // leftover images form a final, non-stretched row at the target height
  if (current.length > 0) rows.push(closeRow(current, false));

  return rows;
}

// a single ultra-wide or ultra-tall image should not break the row math
function clampAspect(a) {
  if (!isFinite(a) || a <= 0) return 1;
  if (a > 6) return 6;
  if (a < 1 / 6) return 1 / 6;
  return a;
}

function round(x) {
  return Math.round(x * 100) / 100;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { packRows: packRows, clampAspect: clampAspect };
}
