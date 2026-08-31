/* ==========================================================================
   center-game.js — park the playfield in the middle of the window on arrival.

   Every game page is taller than the screen once you count the header, the
   controls and the notes underneath, so landing at scroll position 0 puts the
   board low and clips its bottom. This scrolls straight to the board on load
   instead, so the game is the first thing centred in front of you.

   It runs twice — once as soon as the DOM is parsed, once after webfonts and
   images have settled and the layout has stopped moving — but the second pass
   backs off if you've scrolled in the meantime, so it never yanks the page out
   from under you.
   ========================================================================== */
(function () {
  "use strict";

  var placedAt = null;

  function target() {
    var el = document.querySelector("[data-center]");
    if (!el) return null;

    var box = el.getBoundingClientRect();
    var docTop = box.top + window.pageYOffset;
    var y;

    if (box.height <= window.innerHeight) {
      // Fits: sit it dead centre.
      y = docTop + box.height / 2 - window.innerHeight / 2;
    } else {
      /* Taller than the window. Centring here would hide the top of the
         cabinet, and the top is where the controls live — the mode buttons,
         the opponent picker. So pin the top just inside the viewport instead
         and let the notes underneath be the part you scroll for. */
      y = docTop - 16;
    }

    var max = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    return Math.min(Math.max(0, y), max);
  }

  function center() {
    // A deep link to an anchor wins over us.
    if (window.location.hash) return;

    var y = target();
    if (y === null) return;

    // Second pass: if the reader has moved since we placed them, leave it.
    if (placedAt !== null && Math.abs(window.pageYOffset - placedAt) > 4) return;

    window.scrollTo(0, y);
    placedAt = Math.round(y);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", center);
  } else {
    center();
  }
  window.addEventListener("load", center);
})();
