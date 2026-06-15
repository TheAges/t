// PhotoSwipe integration for work images.
// - Loads PhotoSwipe v5 (self-hosted ES module) from js/lib/photoswipe/.
// - Targets ONLY work images: #pageWork .imageWapper img (hero image is excluded).
// - Single image per open (no gallery / no prev-next), close + zoom buttons, crisp source-res zoom.
// - Barba-safe: delegated click on document, so it keeps working after content swaps.
//
// NOTE: a static `import ... from EXPRESSION` is illegal (the path must be a literal), so we
// use dynamic import() with SITE_ROOT, which resolves correctly on the subpath, a custom
// domain, and offline.

const ROOT = (window.SITE_ROOT || "/");

let PhotoSwipePromise = null;
function loadPhotoSwipe() {
  if (!PhotoSwipePromise) {
    PhotoSwipePromise = import(ROOT + "js/lib/photoswipe/photoswipe.esm.js")
      .then((mod) => mod.default);
  }
  return PhotoSwipePromise;
}

function openSingle(imgEl) {
  const w = imgEl.naturalWidth || imgEl.width;
  const h = imgEl.naturalHeight || imgEl.height;
  const src = imgEl.currentSrc || imgEl.src;

  loadPhotoSwipe().then((PhotoSwipe) => {
    const pswp = new PhotoSwipe({
      dataSource: [{ src: src, width: w, height: h, alt: imgEl.getAttribute("alt") || "" }],
      index: 0,

      // Minimal UI: keep close + zoom buttons, drop counter / arrows.
      counter: false,
      arrowPrev: false,
      arrowNext: false,
      zoom: true,
      close: true,

      // Zoom levels:
      //  - "fit": show the whole image fitted to the viewport when opened.
      //  - secondaryZoomLevel 1 = one click goes to 100% actual pixels (crisp, not aggressive).
      //    For small images "fit" may already exceed 100%, so we use max("fill", 1)-style by
      //    keeping 1; PhotoSwipe will not zoom below fit.
      //  - maxZoomLevel 1.5 caps how far the continuous zoom can push beyond actual size.
      initialZoomLevel: "fit",
      secondaryZoomLevel: 1,
      maxZoomLevel: 1.5,

      bgOpacity: 0.85,
      showHideAnimationType: "fade"
    });
    pswp.init();
  }).catch((err) => {
    console.error("PhotoSwipe failed to load:", err);
  });
}

// Delegated click: only work images inside #pageWork .imageWapper (hero excluded).
document.addEventListener("click", function (e) {
  const img = e.target.closest("#pageWork .imageWapper img");
  if (!img) return;
  e.preventDefault();
  openSingle(img);
});
