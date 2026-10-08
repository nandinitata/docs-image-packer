/**
 * Turning the computed rows into the document: one borderless table per row.
 *
 * Why one table per row (not one big table): a Google Docs table forces every
 * row to share the same column widths. Justified rows have different images and
 * widths per row, so each row gets its own one-row table with its own column
 * widths. The small empty paragraph Docs puts between tables is shrunk to act as
 * the vertical gap.
 *
 * Runs inside Apps Script only.
 */

/**
 * @param {Body} body
 * @param {Array} rows            output of packRows
 * @param {InlineImage[]} copies  detached copies of the originals, same order
 * @param {number} gap            spacing in points
 */
function renderRows(body, rows, copies, gap) {
  var pad = Math.max(0, gap / 2);
  // a little headroom so a padded cell still fits inside the page width
  var fit = 0.98;

  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var table = body.appendTable();
    table.setBorderWidth(0);
    var tr = table.appendTableRow();

    for (var c = 0; c < row.items.length; c++) {
      var item = row.items[c];
      var cell = tr.appendTableCell();
      cell.setPaddingTop(pad).setPaddingBottom(pad).setPaddingLeft(pad).setPaddingRight(pad);

      var para = cell.getChild(0).asParagraph();
      para.setSpacingBefore(0).setSpacingAfter(0);
      var img = para.appendInlineImage(copies[item.index]);
      img.setWidth(round1(item.width * fit)).setHeight(round1(item.height * fit));
    }

    for (var c2 = 0; c2 < row.items.length; c2++) {
      table.setColumnWidth(c2, round1(row.items[c2].width * fit + pad * 2));
    }
  }

  tightenGaps(body, gap);
}

/**
 * Shrink the empty paragraphs Docs inserts between tables down to the gap size,
 * so rows sit close together instead of a full blank line apart.
 */
function tightenGaps(body, gap) {
  var size = Math.max(1, Math.round(gap));
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var p = child.asParagraph();
      if (p.getText() === '' && p.getNumChildren() === 0) {
        p.setSpacingBefore(0).setSpacingAfter(0);
        try {
          p.editAsText().setFontSize(size);
        } catch (e) {
          // empty text cannot always take a font size; ignore
        }
      }
    }
  }
}

function round1(x) {
  return Math.round(x * 10) / 10;
}
