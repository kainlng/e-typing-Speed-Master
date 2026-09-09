/**
 * e-typing Auto-Typing Engine (V6 - Bắt Câu Siêu Nhạy & Đảm Bảo Typing 100%)
 * Điều phối chính xác giữa Host Window và Game Frame, tự động kích hoạt Start/Space,
 * trích xuất Romaji sạch và gõ mượt mà từng câu.
 */
(function() {
  'use strict';

  const QWERTY_ADJACENT = {
    'a': ['s', 'q', 'z', 'w'],
    'b': ['v', 'g', 'h', 'n'],
    'c': ['x', 'd', 'f', 'v'],
    'd': ['s', 'e', 'r', 'f', 'c', 'x'],
    'e': ['w', 's', 'd', 'r'],
    'f': ['d', 'r', 't', 'g', 'v', 'c'],
    'g': ['f', 't', 'y', 'h', 'b', 'v'],
    'h': ['g', 'y', 'u', 'j', 'n', 'b'],
    'i': ['u', 'j', 'k', 'o'],
    'j': ['h', 'u', 'i', 'k', 'm', 'n'],
    'k': ['j', 'i', 'o', 'l', 'm'],
    'l': ['k', 'o', 'p'],
    'm': ['n', 'j', 'k'],
    'n': ['b', 'h', 'j', 'm'],
    'o': ['i', 'k', 'l', 'p'],
    'p': ['o', 'l'],
    'q': ['w', 'a'],
    'r': ['e', 'd', 'f', 't'],
    's': ['a', 'w', 'e', 'd', 'x', 'z'],
    't': ['r', 'f', 'g', 'y'],
    'u': ['y', 'h', 'j', 'i'],
    'v': ['c', 'f', 'g', 'b'],
    'w': ['q', 'a', 's', 'e'],
    'x': ['z', 's', 'd', 'c'],
    'y': ['t', 'g', 'h', 'u'],
    'z': ['a', 's', 'x'],
    '-': ['0', 'p', '^'],
    ',': ['m', '.'],
    '.': [',', '/']
  };

  const isHostWindow = (window.top === window && !document.getElementById('sentenceText') && !location.pathname.includes('/app/'));

  class TypingEngine {
    constructor() {
      this.isHost = isHostWindow;
      this.state = 'IDLE'; // IDLE, WAITING_FOR_START, TYPING, BETWEEN_SENTENCES, PAUSED, COMPLETED

      this.config = {
        wpm: 120,
        accuracy: 98,
        humanize: true,
        autoSpace: true,
        sentenceDelay: 200
      };

      this.stats = {
        sentenceIndex: 0,
        typedChars: 0,
        errorsCount: 0,
        currentSentence: '',
        currentCharIndex: 0,
        startTime: null
      };

      this.currentSentenceText = '';
      this.typingTimer = null;
      this.stopObserving = null;
      this.hostPingInterval = null;

      this.listeners = {
        stateChange: [],
        statsUpdate: []
      };
    }

    on(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event].push(callback);
      }
    }

    notify(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch(e) {}
        });
      }

      // Nếu đang chạy trong Iframe, gửi ngay về Top Window để cập nhật Widget
      if (window.top !== window) {
        try {
          window.top.postMessage({
            source: 'ETYPING_FRAME_EVENT',
            event,
            data
          }, '*');
        } catch (e) {}
      }
    }

    setState(newState) {
      if (this.state === newState) return;
      console.log(`[e-typing Engine] Trạng thái: ${this.state} -> ${newState}`);
      this.state = newState;
      this.notify('stateChange', newState);
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      if (this.isHost && window.ETypingSendCommand) {
        window.ETypingSendCommand('UPDATE_CONFIG', newConfig);
      }
    }

    getDelayBetweenChars(char) {
      const wpm = Math.max(30, Math.min(this.config.wpm, 800));
      const baseDelay = 12000 / wpm;

      if (!this.config.humanize) {
        return baseDelay;
      }

      const jitter = (Math.random() * 0.26 - 0.13) * baseDelay;
      let delay = baseDelay + jitter;

      if (char === '-' || char === '.') {
        delay += baseDelay * 0.15;
      }

      return Math.max(10, delay);
    }

    getTypoChar(correctChar) {
      const lower = correctChar.toLowerCase();
      const adjacent = QWERTY_ADJACENT[lower];
      if (adjacent && adjacent.length > 0) {
        const randIndex = Math.floor(Math.random() * adjacent.length);
        return adjacent[randIndex];
      }
      return 'a';
    }

    /**
     * Khởi động bài test
     */
    start() {
      console.log(`[e-typing Engine] Start được gọi (Host: ${this.isHost}) tại:`, window.location.href);

      // TRƯỜNG HỢP 1: Chạy tại Host Window (Trang chủ chứa Widget)
      if (this.isHost) {
        this.setState('WAITING_FOR_START');

        // 1. Mở bài test nếu chưa mở
        const checkBtn = document.getElementById('level_check_btn') || document.querySelector('a[rel*="typingApp"]');
        if (checkBtn) {
          const gameFrame = document.querySelector('iframe#typing_content, iframe[name="typing_content"], #pp_full_res iframe, iframe[src*="standard.asp"]');
          if (!gameFrame) {
            console.log('[Host] Tự động nhấn "今すぐチェック！" để mở bài test...');
            checkBtn.click();
          }
        }

        // 2. Gửi lệnh Start kèm ping định kỳ cho đến khi Game Frame sẵn sàng
        if (this.hostPingInterval) clearInterval(this.hostPingInterval);
        let pings = 0;
        const sendStart = () => {
          if (window.ETypingSendCommand) {
            window.ETypingSendCommand('START', this.config);
          }
          pings++;
          if (pings > 12 || this.state === 'TYPING') {
            clearInterval(this.hostPingInterval);
            this.hostPingInterval = null;
          }
        };

        sendStart();
        this.hostPingInterval = setInterval(sendStart, 400);
        return;
      }

      // TRƯỜNG HỢP 2: Chạy trực tiếp tại Game Frame
      this.stats.startTime = Date.now();
      this.stats.typedChars = 0;
      this.stats.errorsCount = 0;
      this.stats.sentenceIndex = 0;
      this.stats.currentCharIndex = 0;
      this.stats.currentSentence = '';
      this.currentSentenceText = '';

      this.setState('WAITING_FOR_START');

      if (!this.stopObserving && window.ETypingExtractor) {
        this.stopObserving = window.ETypingExtractor.startObserving(
          (info) => this.handleDOMChange(info),
          () => this.stats
        );
      }

      if (window.ETypingExtractor) {
        const info = window.ETypingExtractor.getCurrentSentenceInfo(this.stats);
        this.handleDOMChange(info);
      }
    }

    pause() {
      if (this.isHost) {
        if (window.ETypingSendCommand) window.ETypingSendCommand('PAUSE');
        this.setState('PAUSED');
        return;
      }

      if (this.state === 'TYPING' || this.state === 'WAITING_FOR_START' || this.state === 'BETWEEN_SENTENCES') {
        clearTimeout(this.typingTimer);
        this.setState('PAUSED');
      }
    }

    resume() {
      if (this.isHost) {
        if (window.ETypingSendCommand) window.ETypingSendCommand('RESUME');
        this.setState('TYPING');
        return;
      }

      if (this.state === 'PAUSED') {
        this.setState('TYPING');
        this.typeNextChar();
      }
    }

    stop() {
      if (this.hostPingInterval) {
        clearInterval(this.hostPingInterval);
        this.hostPingInterval = null;
      }

      if (this.isHost) {
        if (window.ETypingSendCommand) window.ETypingSendCommand('STOP');
        this.setState('IDLE');
        return;
      }

      clearTimeout(this.typingTimer);
      if (this.stopObserving) {
        this.stopObserving();
        this.stopObserving = null;
      }
      this.currentSentenceText = '';
      this.setState('IDLE');
    }

    pressSpace() {
      if (this.isHost) {
        if (window.ETypingSendCommand) window.ETypingSendCommand('PRESS_SPACE');
        return;
      }

      console.log('[Game Frame] Phát phím Space...');
      if (window.ETypingDispatcher) {
        window.ETypingDispatcher.dispatchSpace();
      }
    }

    handleDOMChange(info) {
      if (!info) return;
      if (this.isHost) return;
      if (this.state === 'PAUSED') return;

      // 1. Tự động click nút Start trong game nếu có
      if (info.hasStartBtn && info.startBtnElement && this.state === 'WAITING_FOR_START') {
        console.log('[Game Frame] Tự động nhấn nút Start trong game...');
        try { info.startBtnElement.click(); } catch(e) {}
      }

      // 2. Nếu phát hiện câu Romaji -> Bắt đầu gõ ngay
      if (info.fullText) {
        if (info.fullText !== this.currentSentenceText) {
          console.log('[Game Frame] Phát hiện câu Romaji mới:', info.fullText);
          this.startNewSentence(info.fullText);
        }
        return;
      }

      // 3. Màn hình kết thúc (Result Screen)
      if (info.isResultScreen) {
        if (this.stats.sentenceIndex >= 5 || this.stats.typedChars >= 60) {
          console.log('[Game Frame] Hoàn thành bài test!');
          clearTimeout(this.typingTimer);
          this.setState('COMPLETED');
          return;
        }
      }

      // 4. Màn hình chờ bấm Space ("スペースキー")
      if (info.isPromptScreen) {
        this.setState('WAITING_FOR_START');
        if (this.config.autoSpace) {
          setTimeout(() => {
            if (this.state === 'WAITING_FOR_START') {
              this.pressSpace();
            }
          }, 250);
        }
        return;
      }
    }

    startNewSentence(sentenceText) {
      clearTimeout(this.typingTimer);
      this.currentSentenceText = sentenceText;
      this.stats.currentSentence = sentenceText;
      this.stats.currentCharIndex = 0;
      this.stats.sentenceIndex += 1;
      this.notify('statsUpdate', this.stats);

      this.setState('BETWEEN_SENTENCES');

      const delay = Math.max(80, this.config.sentenceDelay || 200);
      this.typingTimer = setTimeout(() => {
        if (this.state === 'PAUSED' || this.state === 'IDLE') return;
        this.setState('TYPING');
        this.typeNextChar();
      }, delay);
    }

    typeNextChar() {
      if (this.state !== 'TYPING') return;

      const sentence = this.currentSentenceText;
      const index = this.stats.currentCharIndex;

      // Đã gõ xong câu hiện tại -> chuyển trạng thái chờ đổi câu
      if (!sentence || index >= sentence.length) {
        console.log('[Game Frame] Hoàn thành câu:', sentence);
        this.setState('BETWEEN_SENTENCES');
        return;
      }

      const correctChar = sentence[index];
      const accuracy = Math.max(80, Math.min(100, this.config.accuracy));
      const shouldMakeTypo = accuracy < 100 && (Math.random() * 100 > accuracy);
      const delay = this.getDelayBetweenChars(correctChar);

      if (shouldMakeTypo) {
        const typoChar = this.getTypoChar(correctChar);
        console.log(`[Typo Simulation] Gõ nhầm '${typoChar}', sửa lại '${correctChar}'`);

        // Gõ phím sai
        if (window.ETypingDispatcher) {
          window.ETypingDispatcher.dispatchChar(typoChar);
        }
        this.stats.errorsCount += 1;
        this.notify('statsUpdate', this.stats);

        // Mô phỏng ngập ngừng của người thật
        const hesitation = 70 + Math.random() * 60;
        this.typingTimer = setTimeout(() => {
          if (this.state !== 'TYPING') return;
          // Gõ lại phím đúng
          if (window.ETypingDispatcher) {
            window.ETypingDispatcher.dispatchChar(correctChar);
          }
          this.stats.typedChars += 1;
          this.stats.currentCharIndex += 1;
          this.notify('statsUpdate', this.stats);

          this.typingTimer = setTimeout(() => {
            this.typeNextChar();
          }, delay);
        }, hesitation);

      } else {
        // Gõ phím đúng
        if (window.ETypingDispatcher) {
          window.ETypingDispatcher.dispatchChar(correctChar);
        }
        this.stats.typedChars += 1;
        this.stats.currentCharIndex += 1;
        this.notify('statsUpdate', this.stats);

        this.typingTimer = setTimeout(() => {
          this.typeNextChar();
        }, delay);
      }
    }
  }

  window.ETypingEngine = new TypingEngine();
})();
