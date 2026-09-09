/**
 * e-typing Keyboard Event Dispatcher (V6 - Tương Thích Tuyệt Đối)
 * Phát chuẩn xác chuỗi sự kiện bàn phím native (keydown -> keypress -> keyup)
 * với đúng mã keyCode, charCode, và which vào ngữ cảnh game.
 */
(function() {
  'use strict';

  window.ETypingDispatcher = {
    getCodeAndKey(char) {
      if (!char || char.length === 0) return null;

      const upper = char.toUpperCase();
      const lower = char.toLowerCase();
      const codePoint = upper.charCodeAt(0);

      let key = lower;
      let code = '';
      let keyCode = codePoint;
      let shiftKey = false;

      if (/[A-Z]/.test(upper)) {
        code = 'Key' + upper;
        key = lower;
        keyCode = codePoint;
      } else if (/[0-9]/.test(char)) {
        code = 'Digit' + char;
        key = char;
        keyCode = codePoint;
      } else {
        switch (char) {
          case ' ':
            code = 'Space';
            key = ' ';
            keyCode = 32;
            break;
          case '-':
            code = 'Minus';
            key = '-';
            keyCode = 189;
            break;
          case '^':
            code = 'Equal';
            key = '^';
            keyCode = 222;
            break;
          case '\\':
            code = 'IntlYen';
            key = '\\';
            keyCode = 220;
            break;
          case '@':
            code = 'BracketLeft';
            key = '@';
            keyCode = 192;
            break;
          case '[':
            code = 'BracketRight';
            key = '[';
            keyCode = 219;
            break;
          case ']':
            code = 'Backslash';
            key = ']';
            keyCode = 221;
            break;
          case ';':
            code = 'Semicolon';
            key = ';';
            keyCode = 187;
            break;
          case ':':
            code = 'Quote';
            key = ':';
            keyCode = 186;
            break;
          case ',':
            code = 'Comma';
            key = ',';
            keyCode = 188;
            break;
          case '.':
            code = 'Period';
            key = '.';
            keyCode = 190;
            break;
          case '/':
            code = 'Slash';
            key = '/';
            keyCode = 191;
            break;
          case '!':
            code = 'Digit1';
            key = '!';
            keyCode = 49;
            shiftKey = true;
            break;
          case '?':
            code = 'Slash';
            key = '?';
            keyCode = 191;
            shiftKey = true;
            break;
          default:
            code = 'Key' + upper;
            key = lower;
            keyCode = codePoint;
            break;
        }
      }

      return { key, code, keyCode, which: keyCode, shiftKey };
    },

    /**
     * Dispatch ký tự chính xác vào ngữ cảnh game
     */
    dispatchChar(char) {
      const mapping = this.getCodeAndKey(char);
      if (!mapping) return false;

      // Đảm bảo cửa sổ game và body có focus
      try {
        if (window.focus) window.focus();
        if (document.body && document.body.focus) document.body.focus();
      } catch (e) {}

      // Ưu tiên activeElement nếu có, nếu không phát vào document.body
      const target = (document.activeElement && document.activeElement !== document.body && document.activeElement.dispatchEvent)
        ? document.activeElement
        : (document.body || document.documentElement || window);

      const eventInit = {
        key: mapping.key,
        code: mapping.code,
        keyCode: mapping.keyCode,
        which: mapping.which,
        charCode: 0,
        shiftKey: mapping.shiftKey,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        repeat: false,
        isComposing: false,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window
      };

      try {
        // 1. Keydown event
        const keydownEvt = new KeyboardEvent('keydown', eventInit);
        target.dispatchEvent(keydownEvt);

        // 2. Keypress event (cần thiết cho các web game gõ phím bắt sự kiện ký tự in được)
        const charCode = mapping.key.charCodeAt(0);
        const keypressInit = {
          ...eventInit,
          charCode: charCode,
          keyCode: charCode,
          which: charCode
        };
        const keypressEvt = new KeyboardEvent('keypress', keypressInit);
        target.dispatchEvent(keypressEvt);

        // 3. Keyup event
        const keyupEvt = new KeyboardEvent('keyup', eventInit);
        target.dispatchEvent(keyupEvt);
      } catch (e) {
        console.error('[Dispatcher] Lỗi phát phím:', e);
      }

      return true;
    },

    dispatchSpace() {
      return this.dispatchChar(' ');
    }
  };
})();
