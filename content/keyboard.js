/**
 * e-typing keyboard Blocker
 * Prevent user from inserting keys from keyboard (except F8 and Ctrl + Shift + X)
 * Toggle simultaneously with auto typing
 */
(function() {
  'use strict';

  function blockPhysicalKeys(e) {
    // 1. Accept only false events (bot input)
    if (!e.isTrusted) return;

    // 2. F8 and Ctrl + Shift + X are allowed, all other keys are blocked
    const isF8 = e.key === 'F8' || e.code === 'F8';
    const isFallback = (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x' || e.code === 'KeyX'));
    if (isF8 || isFallback) return;

    // 3. Only block keys when auto typing is active
    const engine = window.ETypingEngine;
    const isAutoTypingActive = engine && (
      engine.state === 'TYPING' ||
      engine.state === 'WAITING_FOR_START' ||
      engine.state === 'BETWEEN_SENTENCES'
    );

    if (isAutoTypingActive) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  // Catching all keyboard events and block them before game engine receives
  ['keydown', 'keypress', 'keyup'].forEach(type => {
    window.addEventListener(type, blockPhysicalKeys, true);
  });
})();