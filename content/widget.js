/**
 * e-typing Floating Dashboard Widget (V4 - Tương Tác Cực Nhạy)
 */
(function() {
  'use strict';

  if (window.top !== window) {
    return;
  }

  function initWidget() {
    if (document.getElementById('etyping-master-root')) return;

    const root = document.createElement('div');
    root.id = 'etyping-master-root';

    root.innerHTML = `
      <div class="etm-card" id="etm-card">
        <!-- Header -->
        <div class="etm-header" id="etm-drag-handle">
          <div class="etm-title-wrap">
            <div class="etm-icon">⚡</div>
            <div class="etm-title">e-typing Speed Master</div>
          </div>
          <div class="etm-actions">
            <button class="etm-btn-icon" id="etm-btn-minimize" title="Thu nhỏ">−</button>
          </div>
        </div>

        <!-- Body -->
        <div class="etm-body" id="etm-body-content">
          <!-- VÙNG 1: Trạng thái & Điều khiển -->
          <div class="etm-section">
            <div class="etm-sec-title">
              <span>Trạng thái</span>
              <span id="etm-hotkey-hint" style="font-size:9px; color:#64748b;">[F8: Bật/Tắt]</span>
            </div>
            <div class="etm-status-row">
              <div class="etm-badge idle" id="etm-status-badge">
                <span class="etm-badge-dot"></span>
                <span id="etm-status-text">Sẵn sàng</span>
              </div>
            </div>
            <div class="etm-ctrl-buttons">
              <button class="etm-btn etm-btn-primary" id="etm-btn-start">▶ Bắt đầu (Auto)</button>
              <button class="etm-btn etm-btn-secondary" id="etm-btn-pause" disabled>⏸ Tạm dừng</button>
            </div>
            <div class="etm-ctrl-extra">
              <button class="etm-btn etm-btn-secondary" id="etm-btn-stop" style="font-size:11px;">⏹ Dừng lại</button>
              <button class="etm-btn etm-btn-accent" id="etm-btn-space" style="font-size:11px;">␣ Nhấn Space</button>
            </div>
          </div>

          <!-- VÙNG 2: Thiết lập WPM (Tốc độ) -->
          <div class="etm-section">
            <div class="etm-sec-title">
              <span>Tốc độ gõ (WPM)</span>
              <span id="etm-cpm-label" style="color:#6366f1;">600 CPM</span>
            </div>
            <div class="etm-slider-row">
              <input type="range" class="etm-slider" id="etm-slider-wpm" min="30" max="600" step="5" value="120">
              <input type="number" class="etm-input-num" id="etm-input-wpm" min="30" max="600" value="120">
            </div>
            <div class="etm-presets">
              <button class="etm-preset-btn" data-wpm="80">80</button>
              <button class="etm-preset-btn" data-wpm="150">150</button>
              <button class="etm-preset-btn" data-wpm="250">250</button>
              <button class="etm-preset-btn" data-wpm="400">400 (Ninja)</button>
            </div>
            <label class="etm-checkbox-label">
              <input type="checkbox" id="etm-chk-humanize" checked>
              <span>Nhịp gõ tự nhiên (Humanize ±15%)</span>
            </label>
          </div>

          <!-- VÙNG 3: Thiết lập Độ chính xác (Accuracy) -->
          <div class="etm-section">
            <div class="etm-sec-title">
              <span>Độ chính xác</span>
              <span id="etm-acc-label" style="color:#4ade80;">98%</span>
            </div>
            <div class="etm-slider-row">
              <input type="range" class="etm-slider" id="etm-slider-acc" min="80" max="100" step="1" value="98">
              <input type="number" class="etm-input-num" id="etm-input-acc" min="80" max="100" value="98">
            </div>
            <div class="etm-presets">
              <button class="etm-preset-btn" data-acc="100">100%</button>
              <button class="etm-preset-btn" data-acc="98">98%</button>
              <button class="etm-preset-btn" data-acc="95">95%</button>
              <button class="etm-preset-btn" data-acc="90">90%</button>
            </div>
          </div>

          <!-- VÙNG 4: Thống kê & Tiến độ -->
          <div class="etm-section">
            <div class="etm-sec-title">Tiến độ thời gian thực</div>
            <div class="etm-stats-grid">
              <div class="etm-stat-box">
                <div class="etm-stat-val" id="etm-stat-sentence">0</div>
                <div class="etm-stat-lbl">Câu</div>
              </div>
              <div class="etm-stat-box">
                <div class="etm-stat-val" id="etm-stat-chars">0</div>
                <div class="etm-stat-lbl">Ký tự</div>
              </div>
              <div class="etm-stat-box">
                <div class="etm-stat-val" id="etm-stat-errors">0</div>
                <div class="etm-stat-lbl">Lỗi (Miss)</div>
              </div>
            </div>
            <div class="etm-preview-box" id="etm-preview-text">Đang tìm bài test...</div>
          </div>
        </div>
      </div>

      <!-- Collapsed Bubble -->
      <div class="etm-bubble" id="etm-bubble" >
        <span>-</span>
      </div>
    `;

    document.body.appendChild(root);
    setupWidgetEvents();
  }

  function setupWidgetEvents() {
    const card = document.getElementById('etm-card');
    const bubble = document.getElementById('etm-bubble');
    const dragHandle = document.getElementById('etm-drag-handle');
    const btnMinimize = document.getElementById('etm-btn-minimize');

    const statusBadge = document.getElementById('etm-status-badge');
    const statusText = document.getElementById('etm-status-text');
    const btnStart = document.getElementById('etm-btn-start');
    const btnPause = document.getElementById('etm-btn-pause');
    const btnStop = document.getElementById('etm-btn-stop');
    const btnSpace = document.getElementById('etm-btn-space');

    const sliderWpm = document.getElementById('etm-slider-wpm');
    const inputWpm = document.getElementById('etm-input-wpm');
    const cpmLabel = document.getElementById('etm-cpm-label');
    const chkHumanize = document.getElementById('etm-chk-humanize');

    const sliderAcc = document.getElementById('etm-slider-acc');
    const inputAcc = document.getElementById('etm-input-acc');
    const accLabel = document.getElementById('etm-acc-label');

    const statSentence = document.getElementById('etm-stat-sentence');
    const statChars = document.getElementById('etm-stat-chars');
    const statErrors = document.getElementById('etm-stat-errors');
    const previewText = document.getElementById('etm-preview-text');

    // Drag & Drop logic
    let isDragging = false;
    let startX, startY, origLeft, origTop;

    dragHandle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = card.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        card.style.position = 'fixed';
        card.style.left = `${origLeft + dx}px`;
        card.style.top = `${origTop + dy}px`;
        card.style.right = 'auto';
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    btnMinimize.addEventListener('click', () => {
      card.style.display = 'none';
      bubble.style.display = 'inline-flex';
    });

    bubble.addEventListener('click', () => {
      bubble.style.display = 'none';
      card.style.display = 'block';
    });

    function sendCmd(action, data = null) {
      if (window.ETypingSendCommand) {
        window.ETypingSendCommand(action, data);
      }
      if (window.ETypingEngine) {
        switch (action) {
          case 'START': window.ETypingEngine.start(); break;
          case 'PAUSE': window.ETypingEngine.pause(); break;
          case 'RESUME': window.ETypingEngine.resume(); break;
          case 'STOP': window.ETypingEngine.stop(); break;
          case 'PRESS_SPACE': window.ETypingEngine.pressSpace(); break;
          case 'UPDATE_CONFIG': if (data) window.ETypingEngine.updateConfig(data); break;
        }
      }
    }

    // WPM Sync
    function updateWPM(val) {
      const wpm = parseInt(val, 10) || 120;
      sliderWpm.value = wpm;
      inputWpm.value = wpm;
      cpmLabel.textContent = `${wpm * 5} CPM`;
      sendCmd('UPDATE_CONFIG', { wpm });
      saveSettings();
    }

    sliderWpm.addEventListener('input', (e) => updateWPM(e.target.value));
    inputWpm.addEventListener('change', (e) => updateWPM(e.target.value));

    document.querySelectorAll('.etm-presets [data-wpm]').forEach(btn => {
      btn.addEventListener('click', () => updateWPM(btn.getAttribute('data-wpm')));
    });

    chkHumanize.addEventListener('change', (e) => {
      sendCmd('UPDATE_CONFIG', { humanize: e.target.checked });
      saveSettings();
    });

    // Accuracy Sync
    function updateAcc(val) {
      const acc = parseInt(val, 10) || 100;
      sliderAcc.value = acc;
      inputAcc.value = acc;
      accLabel.textContent = `${acc}%`;
      sendCmd('UPDATE_CONFIG', { accuracy: acc });
      saveSettings();
    }

    sliderAcc.addEventListener('input', (e) => updateAcc(e.target.value));
    inputAcc.addEventListener('change', (e) => updateAcc(e.target.value));

    document.querySelectorAll('.etm-presets [data-acc]').forEach(btn => {
      btn.addEventListener('click', () => updateAcc(btn.getAttribute('data-acc')));
    });

    // Action Buttons
    btnStart.addEventListener('click', () => {
      sendCmd('START');
    });

    btnPause.addEventListener('click', () => {
      if (!window.ETypingEngine) return;
      if (window.ETypingEngine.state === 'PAUSED') {
        sendCmd('RESUME');
      } else {
        sendCmd('PAUSE');
      }
    });

    btnStop.addEventListener('click', () => {
      sendCmd('STOP');
    });

    btnSpace.addEventListener('click', () => {
      sendCmd('PRESS_SPACE');
    });

    // Hotkey F8
    /*
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F8' || (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x'))) {
        e.preventDefault();
        if (!window.ETypingEngine) return;
        if (window.ETypingEngine.state === 'TYPING') {
          sendCmd('PAUSE');
        } else if (window.ETypingEngine.state === 'PAUSED') {
          sendCmd('RESUME');
        } else {
          sendCmd('START');
        }
      }
    });
    */ 

    // Cập nhật giao diện khi Engine đổi trạng thái
    if (window.ETypingEngine) {
      window.ETypingEngine.on('stateChange', (state) => {
        statusBadge.className = 'etm-badge';

        switch (state) {
          case 'IDLE':
            statusBadge.classList.add('idle');
            statusText.textContent = 'Sẵn sàng';
            btnStart.disabled = false;
            btnStart.textContent = '▶ Bắt đầu (Auto)';
            btnPause.disabled = true;
            btnPause.textContent = '⏸ Tạm dừng';
            break;
          case 'WAITING_FOR_START':
            statusBadge.classList.add('waiting');
            statusText.textContent = 'Đang chờ test...';
            btnStart.disabled = false;
            btnPause.disabled = false;
            break;
          case 'TYPING':
          case 'BETWEEN_SENTENCES':
            statusBadge.classList.add('typing');
            statusText.textContent = 'Đang gõ tự động...';
            btnStart.disabled = true;
            btnPause.disabled = false;
            btnPause.textContent = '⏸ Tạm dừng';
            break;
          case 'PAUSED':
            statusBadge.classList.add('paused');
            statusText.textContent = 'Đã tạm dừng';
            btnStart.disabled = true;
            btnPause.disabled = false;
            btnPause.textContent = '▶ Tiếp tục';
            break;
          case 'COMPLETED':
            statusBadge.classList.add('completed');
            statusText.textContent = 'Đã hoàn thành!';
            btnStart.disabled = false;
            btnStart.textContent = '▶ Bắt đầu lại';
            btnPause.disabled = true;
            break;
        }
      });

      window.ETypingEngine.on('statsUpdate', (stats) => {
        statSentence.textContent = stats.sentenceIndex;
        statChars.textContent = stats.typedChars;
        statErrors.textContent = stats.errorsCount;
        if (stats.currentSentence) {
          previewText.textContent = stats.currentSentence;
          previewText.style.color = '#38bdf8';
        }
      });
    }

    // Quét liên tục kiểm tra trạng thái bài test để hiển thị xem trước
    setInterval(() => {
      if (window.ETypingEngine && window.ETypingEngine.state === 'IDLE') {
        const iframes = document.querySelectorAll('iframe');
        let foundText = '';

        iframes.forEach(iframe => {
          try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
              const insideText = iframe.contentDocument.body.textContent || '';
              // Tìm chuỗi Romaji
              const matches = insideText.replace(/\s+/g, ' ').match(/[A-Za-z][A-Za-z0-9\-_,.:;!?/\\@^\[\]]{3,}/g);
              if (matches) {
                for (const m of matches) {
                  const clean = m.replace(/\s+/g, '');
                  if (/^[A-Za-z0-9\-_,.:;!?/\\@^\[\]]+$/.test(clean) && clean.length >= 3) {
                    foundText = clean;
                    break;
                  }
                }
              }
            }
          } catch (e) {}
        });

        if (foundText) {
          previewText.textContent = `Sẵn sàng: ${foundText}`;
          previewText.style.color = '#4ade80';
        }
      }
    }, 400);

    function saveSettings() {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          etm_wpm: parseInt(inputWpm.value, 10),
          etm_acc: parseInt(inputAcc.value, 10),
          etm_humanize: chkHumanize.checked
        });
      }
    }

    function loadSettings() {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['etm_wpm', 'etm_acc', 'etm_humanize'], (res) => {
          if (res.etm_wpm) updateWPM(res.etm_wpm);
          if (res.etm_acc) updateAcc(res.etm_acc);
          if (res.etm_humanize !== undefined) {
            chkHumanize.checked = res.etm_humanize;
            sendCmd('UPDATE_CONFIG', { humanize: res.etm_humanize });
          }
        });
      }
    }

    loadSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
