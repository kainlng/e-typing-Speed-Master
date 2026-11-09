/**
  * e-typing Global Hotkey Controller (Independent of UI Widget)
  */
(function() {
  'use strict';

  function handleHotkey(e) {
    const isF8 = e.key === 'F8' || e.code === 'F8';
    const isFallback = (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x' || e.code === 'KeyX'));

    if (!isF8 && !isFallback) return;

    // Prevent default browser/game handling
    e.preventDefault();
    e.stopPropagation();

    // 1. Try controlling local engine first
    const engine = window.ETypingEngine;
    if (engine) {
      if (engine.state === 'TYPING') {
        engine.pause();
      } else if (engine.state === 'PAUSED') {
        engine.resume();
      } else {
        engine.start();
      }
      return;
    }

    // 2. Fallback: If top window and engine not directly ready, use bridge
    if (window.ETypingSendCommand) {
      window.ETypingSendCommand('START');
    }
  }

  // Use capturing phase (true) so the event is intercepted before game listeners
  window.addEventListener('keydown', handleHotkey, true);
})();
