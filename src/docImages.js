/**
 * Reading the images out of the open document and removing the originals.
 * These functions talk to the Google Docs API, so they only run inside Apps
 * Script, not in node.
 */

/**
 * Collect every image in the body, in document order, with the info the layout
 * needs. Returns null if there are no images.
 */
function collectImages(body) {
  var images = body.getImages(); // InlineImage[], in document order
  if (!images || images.length === 0) return null;

  var aspects = [];
  for (var i = 0; i < images.length; i++) {
    var w = images[i].getWidth();
    var h = images[i].getHeight();
    aspects.push(h > 0 ? w / h : 1);
  }

  // where the first image sits, so the packed table lands in the same spot
  var firstTop = topLevelAncestor(body, images[0]);
  var insertIndex = firstTop ? body.getChildIndex(firstTop) : body.getNumChildren();

  return { images: images, aspects: aspects, insertIndex: insertIndex };
}

/** Walk up from an element to the child of the body that contains it. */
function topLevelAncestor(body, element) {
  var el = element;
  var parent = el.getParent();
  while (parent && parent.getType() !== DocumentApp.ElementType.BODY_SECTION) {
    el = parent;
    parent = el.getParent();
  }
  return parent ? el : null;
}

/** Usable content width in points: page width minus the side margins. */
function usableWidth(body) {
  return body.getPageWidth() - body.getMarginLeft() - body.getMarginRight();
}

/**
 * Remove the original images and any paragraph that is now empty because it
 * only held an image. Leaves text paragraphs alone.
 */
function removeOriginals(body, images) {
  var parents = [];
  for (var i = 0; i < images.length; i++) {
    var p = images[i].getParent();
    images[i].removeFromParent();
    if (p) parents.push(p);
  }
  // clean up paragraphs that are now empty, but never remove the last child
  for (var j = 0; j < parents.length; j++) {
    var par = parents[j];
    try {
      if (
        par.getType() === DocumentApp.ElementType.PARAGRAPH &&
        par.asParagraph().getText() === '' &&
        par.asParagraph().getNumChildren() === 0 &&
        body.getNumChildren() > 1
      ) {
        par.removeFromParent();
      }
    } catch (e) {
      // the paragraph may already be gone; ignore
    }
  }
}
