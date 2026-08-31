/* ==========================================================================
   invaders-bg.js — the drifting wall of pixel invaders behind every page.
   Pure canvas, no dependencies. Drops itself into <canvas id="bg-invaders">.
   Deliberately slow and low-contrast so it never fights with the foreground.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-invaders");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  /* Each sprite is two frames of an 8-or-11 column bitmap, exactly the way the
     1978 cabinet did it: the whole animation is two poses swapped on a timer. */
  var SPRITES = [
    {
      w: 11,
      frames: [
        [
          "..#.....#..",
          "...#...#...",
          "..#######..",
          ".##.###.##.",
          "###########",
          "#.#######.#",
          "#.#.....#.#",
          "...##.##..."
        ],
        [
          "..#.....#..",
          "#..#...#..#",
          "#.#######.#",
          "###.###.###",
          "###########",
          ".#########.",
          "..#.....#..",
          ".#.......#."
        ]
      ]
    },
    {
      w: 8,
      frames: [
        [
          "...##...",
          "..####..",
          ".######.",
          "##.##.##",
          "########",
          "..#..#..",
          ".#.##.#.",
          "#.#..#.#"
        ],
        [
          "...##...",
          "..####..",
          ".######.",
          "##.##.##",
          "########",
          ".#.##.#.",
          "#......#",
          ".#....#."
        ]
      ]
    },
    {
      w: 12,
      frames: [
        [
          "....####....",
          ".##########.",
          "############",
          "###..##..###",
          "############",
          "..###..###..",
          ".##..##..##.",
          "....##..##.."
        ],
        [
          "....####....",
          ".##########.",
          "############",
          "###..##..###",
          "############",
          "..##.##.##..",
          ".#..####..#.",
          "##........##"
        ]
      ]
    }
  ];

  var invaders = [];
  var dpr = 1;
  var frameFlip = 0;
  var lastFlip = 0;

  function buildGrid() {
    invaders = [];
    var w = window.innerWidth;
    var h = window.innerHeight;

    /* Columns/rows scale with the viewport so the wall reads the same on a
       laptop and on a phone. Roughly one invader every 150px. */
    var colGap = 155;
    var rowGap = 135;
    var cols = Math.ceil(w / colGap) + 2;
    var rows = Math.ceil(h / rowGap) + 2;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // Skip a scattered few so the grid doesn't look machine-perfect.
        if (((r * 7 + c * 13) % 11) === 0) continue;

        var sprite = SPRITES[(r + c) % SPRITES.length];
        // Depth: back rows are smaller, dimmer and drift slower (parallax).
        var depth = ((r * 3 + c * 5) % 3);
        invaders.push({
          sprite: sprite,
          px: 2 + depth,                       // pixel size of one sprite cell
          x: c * colGap - colGap + ((r % 2) * colGap * 0.5),
          y: r * rowGap - rowGap,
          speed: 4 + depth * 5,                // px per second
          alpha: 0.05 + depth * 0.045,
          phase: (r + c) % 2
        });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    buildGrid();
  }

  function drawInvader(inv) {
    var rowsArr = inv.sprite.frames[(frameFlip + inv.phase) % 2];
    var px = inv.px;
    ctx.fillStyle = "rgba(124, 255, 107, " + inv.alpha.toFixed(3) + ")";
    for (var y = 0; y < rowsArr.length; y++) {
      var line = rowsArr[y];
      for (var x = 0; x < line.length; x++) {
        if (line.charAt(x) === "#") {
          ctx.fillRect(
            Math.round(inv.x + x * px),
            Math.round(inv.y + y * px),
            px,
            px
          );
        }
      }
    }
  }

  var prev = 0;
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loop(now) {
    var dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0;
    prev = now;

    if (now - lastFlip > 900) {
      frameFlip = (frameFlip + 1) % 2;
      lastFlip = now;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    var wrapAt = window.innerWidth + 200;
    for (var i = 0; i < invaders.length; i++) {
      var inv = invaders[i];
      if (!reduced) inv.x += inv.speed * dt;
      if (inv.x > wrapAt) inv.x = -200;
      drawInvader(inv);
    }

    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(loop);
})();
