/**
 * e-typing Content Script Bootstrap & Cross-Frame Bridge (V5)
 * Điều phối lệnh từ Top Window Widget xuống Frame bài test và đồng bộ thống kê ngược lại.
 */
(function() {
  'use strict';

  const isTopWindow = (window.top === window);

  // Hàm tìm kiếm chính xác iframe bài test e-typing
  function getGameIframe() {
    const selectors = [
      'iframe#typing_content',
      'iframe[name="typing_content"]',
      '#pp_full_res iframe',
      'iframe[src*="standard.asp"]',
      'iframe[src*="app"]',
      'iframe[src*="check"]'
    ];
    for (const sel of selectors) {
      const frame = document.querySelector(sel);
      if (frame && frame.contentWindow) return frame;
    }
    return null;
  }

  // Gửi lệnh xuống Frame bài test
  window.ETypingSendCommand = function(action, data = null) {
    const gameIframe = getGameIframe();
    if (gameIframe && gameIframe.contentWindow) {
      // 1. Thử gọi trực tiếp nếu cùng origin
      try {
        if (gameIframe.contentWindow.ETypingEngine) {
          const engine = gameIframe.contentWindow.ETypingEngine;
          switch (action) {
            case 'START': engine.start(); break;
            case 'PAUSE': engine.pause(); break;
            case 'RESUME': engine.resume(); break;
            case 'STOP': engine.stop(); break;
            case 'PRESS_SPACE': engine.pressSpace(); break;
            case 'UPDATE_CONFIG': if (data) engine.updateConfig(data); break;
          }
        }
      } catch (e) {}

      // 2. Gửi qua postMessage đảm bảo 100% truyền tin cậy
      try {
        gameIframe.contentWindow.postMessage({
          source: 'ETYPING_MASTER_CMD',
          action,
          data
        }, '*');
        return true;
      } catch (e) {}
    }
    return false;
  };

  // 1. Nhận tin nhắn từ Popup Extension
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const { action, config } = request;

      if (action === 'GET_STATUS') {
        if (window.ETypingEngine) {
          sendResponse({
            state: window.ETypingEngine.state,
            config: window.ETypingEngine.config,
            stats: window.ETypingEngine.stats
          });
        } else {
          sendResponse({ state: 'UNAVAILABLE' });
        }
        return true;
      }

      // Gửi lệnh tới iframe hoặc chạy engine cục bộ
      const sent = window.ETypingSendCommand(action, config);
      if (!sent && window.ETypingEngine) {
        switch (action) {
          case 'START': window.ETypingEngine.start(); break;
          case 'PAUSE': window.ETypingEngine.pause(); break;
          case 'RESUME': window.ETypingEngine.resume(); break;
          case 'STOP': window.ETypingEngine.stop(); break;
          case 'PRESS_SPACE': window.ETypingEngine.pressSpace(); break;
          case 'UPDATE_CONFIG': if (config) window.ETypingEngine.updateConfig(config); break;
        }
      }

      sendResponse({ success: true });
      return true;
    });
  }

  // 2. Lắng nghe thông điệp giữa các Frame
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    // A. Iframe nhận lệnh điều khiển từ Top Window
    if (event.data.source === 'ETYPING_MASTER_CMD' && !isTopWindow) {
      const { action, data } = event.data;
      if (!window.ETypingEngine) return;

      console.log('[Iframe Game] Nhận lệnh Master CMD:', action, data);
      switch (action) {
        case 'START':
          window.ETypingEngine.start();
          break;
        case 'PAUSE':
          window.ETypingEngine.pause();
          break;
        case 'RESUME':
          window.ETypingEngine.resume();
          break;
        case 'STOP':
          window.ETypingEngine.stop();
          break;
        case 'PRESS_SPACE':
          window.ETypingEngine.pressSpace();
          break;
        case 'UPDATE_CONFIG':
          if (data) window.ETypingEngine.updateConfig(data);
          break;
      }
    }

    // B. Top Window nhận sự kiện cập nhật từ Game Frame
    if (event.data.source === 'ETYPING_FRAME_EVENT' && isTopWindow) {
      const { event: evtName, data } = event.data;
      if (window.ETypingEngine) {
        if (evtName === 'stateChange') {
          window.ETypingEngine.setState(data);
        }
        if (evtName === 'statsUpdate') {
          window.ETypingEngine.stats = { ...window.ETypingEngine.stats, ...data };
          window.ETypingEngine.notify('statsUpdate', data);
        }
      }
    }
  });

  console.log('[e-typing V5] Khởi tạo thành công tại:', isTopWindow ? 'Top Window (UI Host)' : 'Iframe (Game Worker)');
})();
