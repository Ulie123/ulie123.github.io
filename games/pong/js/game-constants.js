/* ==========================================================================
   game-constants.js  —  port of GameConstants.java
   Every tunable number lives here and nowhere else, same as the original.
   ========================================================================== */
window.GameConstants = Object.freeze({
  WINDOW_WIDTH:     700,
  WINDOW_HEIGHT:    500,
  BORDER:            30,
  BALL_SIZE:         14,
  TIMER_DELAY:       16,
  PADDLE_WIDTH:      12,
  PADDLE_HEIGHT:     70,
  PADDLE_FILLER:     10,
  SCROLL_AMOUNT:     15,
  DASH_GAP:          20,
  DASH_HEIGHT:       10,
  DASH_WIDTH:         2,
  SOLO_SCORE_X:      30 + 20,
  SOLO_MISSES_X:     30 + 120,
  SCORE_Y:           20,
  CPU_SCORE_OFFSET: 100,

  /* Not in GameConstants.java. The Swing version had only a mouse wheel, so
     it needed no held-button speed. Applied once per 16ms tick while a paddle
     button is held down: 9px/tick is 1.5x the CPU paddle's 6, fast enough to
     cross the court in about three quarters of a second. */
  BUTTON_PADDLE_STEP: 9
});
