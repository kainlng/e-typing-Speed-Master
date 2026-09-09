/**
 * e-typing DOM Text Extractor (V6 - Khắc Phục Hoàn Toàn Bóc Tách Romaji)
 * Bóc tách chính xác 100% chuỗi Romaji (cả dạng spans, có khoảng trắng rác, dòng kép...),
 * chống báo hoàn thành sớm, tự động tìm nút Start & Space.
 */
(function() {
  'use strict';

  window.ETypingExtractor = {
    observer: null,

    /**
     * Kiểm tra chuỗi có phải là Romaji hợp lệ hay không.
     * Tuyệt đối không chứa ký tự tiếng Nhật (Hiragana, Katakana, Kanji).
     */
    isValidRomaji(str) {
      if (!str || typeof str !== 'string') return false;
      const clean = str.trim().replace(/\s+/g, '');
      if (clean.length < 2) return false;

      // Không chứa ký tự tiếng Nhật (Hiragana, Katakana, Kanji)
      if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(clean)) {
        return false;
      }

      // Phải chứa ít nhất 2 chữ cái tiếng Anh
      const letterCount = (clean.match(/[A-Za-z]/g) || []).length;
      if (letterCount < 2) return false;

      // Phải là tập hợp ký tự Latin hợp lệ
      return /^[A-Za-z0-9\-_,.:;!?/\\@^\[\]]+$/.test(clean);
    },

    /**
     * Bóc tách chuỗi Romaji sạch từ raw text hoặc element.
     * Hỗ trợ mọi cấu trúc hiển thị của e-typing:
     * - Romaji ở dòng thứ 2 dưới Kanji
     * - Romaji phân tách bởi inline spans
     * - Romaji có khoảng trắng do trình duyệt tự chèn giữa các span chunk
     */
    extractRomajiFromRaw(rawText) {
      if (!rawText || typeof rawText !== 'string') return null;

      // 1. Tách theo từng dòng (trường hợp Kanji ở dòng 1, Romaji ở dòng 2)
      const lines = rawText.split(/\r?\n/);
      for (const line of lines) {
        const clean = line.trim().replace(/\s+/g, '');
        if (this.isValidRomaji(clean)) {
          return clean.toUpperCase();
        }
      }

      // 2. Tìm khối ký tự Latin liên tục (hỗ trợ có khoảng trắng do spans sinh ra)
      // Khớp chuỗi gồm các từ/ký tự Latin cách nhau bởi khoảng trắng
      const matches = rawText.match(/(?:[A-Za-z0-9\-_,.:;!?/\\@^\[\]]+\s*){3,}/g);
      if (matches && matches.length > 0) {
        // Ưu tiên đoạn có nhiều chữ cái tiếng Anh nhất
        matches.sort((a, b) => {
          const countA = (a.match(/[A-Za-z]/g) || []).length;
          const countB = (b.match(/[A-Za-z]/g) || []).length;
          return countB - countA;
        });

        for (const m of matches) {
          const clean = m.trim().replace(/\s+/g, '');
          if (this.isValidRomaji(clean)) {
            return clean.toUpperCase();
          }
        }
      }

      return null;
    },

    /**
     * Lấy thông tin câu hiện tại trong document cục bộ
     */
    getCurrentSentenceInfo(currentStats = null) {
      const result = {
        fullText: '',
        isPromptScreen: false,
        isResultScreen: false,
        hasStartBtn: false,
        startBtnElement: null,
        targetElement: null
      };

      const isHostPage = (window.top === window && !document.getElementById('sentenceText') && !location.pathname.includes('/app/'));

      // 1. Quét các selector chuẩn của e-typing để lấy Romaji
      const selectors = [
        '#sentenceText #roma',
        '#sentenceText .roma',
        '#roma',
        '.roma',
        '#sentenceText',
        '.sentenceText',
        '#example',
        'div[id*="sentence"]',
        'span[id*="sentence"]'
      ];

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        for (const el of elements) {
          let romaji = this.extractRomajiFromRaw(el.textContent || '');
          if (!romaji) {
            romaji = this.extractRomajiFromRaw(el.innerText || '');
          }

          if (romaji) {
            result.fullText = romaji;
            result.targetElement = el;
            break;
          }
        }
        if (result.fullText) break;
      }

      // 2. Nếu chưa tìm thấy từ selector chuẩn, quét sâu tất cả container con trong body
      if (!result.fullText && document.body) {
        const candidates = document.querySelectorAll('div, span, p');
        for (const el of candidates) {
          if (el.children.length > 8) continue;
          if (el.closest && el.closest('#etyping-master-root')) continue;

          let romaji = this.extractRomajiFromRaw(el.textContent || '');
          if (!romaji) {
            romaji = this.extractRomajiFromRaw(el.innerText || '');
          }

          if (romaji) {
            result.fullText = romaji;
            result.targetElement = el;
            break;
          }
        }
      }

      // 3. Tìm nút Start trong game (nếu có)
      const startSelectors = [
        '#start_btn',
        '.start_btn',
        'a#start_btn',
        'button#start_btn',
        'img[alt*="スタート"]',
        'a[onclick*="start"]'
      ];
      for (const sel of startSelectors) {
        const btn = document.querySelector(sel);
        if (btn && btn.offsetParent !== null) {
          result.hasStartBtn = true;
          result.startBtnElement = btn;
          break;
        }
      }

      // 4. Màn hình chờ bấm Space ("スペースキー")
      const bodyText = document.body ? document.body.innerText : '';
      if (!result.fullText) {
        if (
          bodyText.includes('スペースキー') ||
          bodyText.includes('スペース') ||
          document.querySelector('#countdown, .countdown, #space_btn')
        ) {
          result.isPromptScreen = true;
        }
      }

      // 5. KIỂM TRA MÀN HÌNH KẾT THÚC (Result Screen)
      if (isHostPage) {
        result.isResultScreen = false;
        return result;
      }

      const typedChars = currentStats ? (currentStats.typedChars || 0) : 0;
      const sentenceIndex = currentStats ? (currentStats.sentenceIndex || 0) : 0;

      // Chỉ kiểm tra màn hình kết thúc nếu ĐÃ gõ ít nhất 5 câu hoặc trên 60 ký tự!
      if (sentenceIndex >= 5 || typedChars >= 60) {
        const hasResultBox = !!document.querySelector('#result, .result, #score_data, #result_data, .result_box, #result_screen');
        const hasScoreText = (bodyText.includes('スコア') || bodyText.includes('Score')) &&
                             (bodyText.includes('WPM') || bodyText.includes('正タイプ数') || bodyText.includes('正確さ'));

        if ((hasResultBox || hasScoreText) && !result.fullText) {
          result.isResultScreen = true;
        }
      }

      return result;
    },

    /**
     * Bắt đầu quan sát thay đổi DOM
     */
    startObserving(onChangeCallback, getStatsFn = null) {
      if (this.observer) {
        this.observer.disconnect();
      }

      let lastText = '';
      let lastResult = false;

      const check = () => {
        const stats = typeof getStatsFn === 'function' ? getStatsFn() : null;
        const info = this.getCurrentSentenceInfo(stats);

        const textChanged = info.fullText && info.fullText !== lastText;
        const resultChanged = info.isResultScreen !== lastResult;

        if (textChanged || resultChanged || info.isPromptScreen || info.hasStartBtn) {
          lastText = info.fullText;
          lastResult = info.isResultScreen;
          if (typeof onChangeCallback === 'function') {
            onChangeCallback(info);
          }
        }
      };

      this.observer = new MutationObserver(() => check());
      if (document.body) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }

      const intervalId = setInterval(check, 60);

      return () => {
        if (this.observer) this.observer.disconnect();
        clearInterval(intervalId);
      };
    }
  };
})();
