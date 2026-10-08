# Image Packer for Google Docs

A Google Docs add-on that takes all the images in your document and arranges them into tidy rows that fill the page width, instead of stacking one per line with gaps down the side. Good for a photo sheet, a contact sheet, a moodboard, or any page that is mostly images.

It keeps every image whole (no cropping, no stretching). Each row of images is scaled to a shared height and stretched to fill the full width, the way Google Photos lays out a gallery. Images flow onto more pages if there are a lot of them.

## How it works

1. Open the add-on from **Extensions -> Image Packer -> Pack images**.
2. In the sidebar, set the image size and the spacing, then click **Pack images**.
3. It reads every image, works out the best row breaks for your page width, removes the loose images, and drops them back in as borderless tables, one row at a time.
4. Don't like it? Plain **Undo** (Cmd/Ctrl+Z) reverts the whole thing.

The row math is the Flickr justified-layout idea: for a row of images with aspect ratios that sum to `A`, the shared height that fills a width `W` is `H = (W - gaps) / A`. Images are added to a row until that height drops to your target, then the row is closed.

## Honest limits

- Google Docs has no free image positioning. The only way to build a grid is a table, and table cells keep a little padding that cannot be fully removed. So the gaps are very small, not pixel-zero.
- The last page can have some empty space at the bottom. That is expected for a gallery that flows at a comfortable size.
- The sizing constants (cell padding and a small fit factor in `src/render.js`) may need one small tweak the first time you run it on your own page size. The row algorithm itself is exact and tested.

## Install

**The quick way (no tools):**

1. Open your Google Doc.
2. **Extensions -> Apps Script.**
3. Recreate the files from `src/`: paste each `.js` file into a script file of the same name with a `.gs` extension (`Code.gs`, `layout.gs`, `docImages.gs`, `render.gs`), and add an HTML file named `Sidebar` with the contents of `Sidebar.html`. In Project Settings, tick "Show appsscript.json" and paste `src/appsscript.json`.
4. Save, then reload your document. An **Image Packer** menu appears.

**With clasp (for development):**

```
npm install -g @google/clasp
clasp login
clasp create --type docs --title "Image Packer"   # or clasp clone an existing project
cp .clasp.json.example .clasp.json                 # paste your scriptId
clasp push
```

## Tests

The layout math is pure and has no Google dependency, so it runs locally:

```
npm test
```

It checks that full rows fill the page width exactly, images stay undistorted, order is preserved, and odd inputs (one image, an ultra-wide image) behave.

## Layout of the code

```
src/
  layout.js      the justified-rows math (pure, tested)
  docImages.js   read images from the doc + remove the originals
  render.js      build the borderless tables
  Code.js        menu, sidebar, orchestration
  Sidebar.html   the small settings panel
test/
  layout.test.js tests for the math
```

## License

MIT. See [LICENSE](LICENSE).
