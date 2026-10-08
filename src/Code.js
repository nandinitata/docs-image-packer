/**
 * Menu, sidebar, and the main orchestration. This is the only file that ties
 * the pieces together: read the images, compute the layout, draw the tables.
 */

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Image Packer')
    .addItem('Pack images...', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Image Packer')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

/**
 * Called from the sidebar. Packs all images in the open doc into justified rows.
 * @param {{targetHeight:number, gap:number}} settings
 * @returns {{ok:boolean, message:string}}
 */
function packImages(settings) {
  var targetHeight = Number(settings && settings.targetHeight) || 170;
  var gap = Number(settings && settings.gap);
  if (isNaN(gap)) gap = 6;

  var body = DocumentApp.getActiveDocument().getBody();

  var info = collectImages(body);
  if (!info) {
    return { ok: false, message: 'No images found in this document.' };
  }

  var rows = packRows(info.aspects, {
    usableWidth: usableWidth(body),
    targetHeight: targetHeight,
    gap: gap,
    maxHeight: targetHeight * 1.6,
  });

  // copy first, then remove the originals, then draw the copies
  var copies = [];
  for (var i = 0; i < info.images.length; i++) {
    copies.push(info.images[i].copy());
  }
  removeOriginals(body, info.images);
  renderRows(body, rows, copies, gap);

  return {
    ok: true,
    message: 'Packed ' + info.aspects.length + ' images into ' + rows.length + ' rows. Use Undo (Cmd/Ctrl+Z) to revert.',
  };
}
