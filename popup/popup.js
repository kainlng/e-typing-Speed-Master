/**
 * e-typing Speed Master - Popup Controller
 */
(function() {
  'use strict';

  // Elements
  const statusBadge = document.getElementById('pop-status-badge');
  const statusText = document.getElementById('pop-status-text');
  const btnStart = document.getElementById('pop-btn-start');
  const btnPause = document.getElementById('pop-btn-pause');
  const btnStop = document.getElementById('pop-btn-stop');
  const btnSpace = document.getElementById('pop-btn-space');

  const sliderWpm = document.getElementById('pop-slider-wpm');
  const inputWpm = document.getElementById('pop-input-wpm');
  const cpmLabel = document.getElementById('pop-cpm-label');
  const chkHumanize = document.getElementById('pop-chk-humanize');

  const sliderAcc = document.getElementById('pop-slider-acc');
  const inputAcc = document.getElementById('pop-input-acc');
  const accLabel = document.getElementById('pop-acc-label');

  const statSentence = document.getElementById('pop-stat-sentence');
  const statChars = document.getElementById('pop-stat-chars');
  const statErrors = document.getElementById('pop-stat-errors');

  let currentEngineState = 'IDLE';

  // Gửi thông điệp tới Content Script trong active tab
  function sendTabMessage(action, data = {}, callback = null) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (res) => {
        if (chrome.runtime.lastError) {
          // Tab hiện tại có thể chưa load content script hoặc không phải trang e-typing
          return;
        }
        if (typeof callback === 'function') callback(res);
      });
    });
  }

  // Cập nhật giao diện theo trạng thái engine
  function applyState(state) {
    currentEngineState = state;
    statusBadge.className = 'status-badge';

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
        statusText.textContent = 'Chờ Space / Đếm ngược';
        btnStart.disabled = true;
        btnPause.disabled = false;
        break;
      case 'TYPING':
      case 'BETWEEN_SENTENCES':
        statusBadge.classList.add('typing');
        statusText.textContent = 'Đang gõ...';
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
        statusText.textContent = 'Đã hoàn tất!';
        btnStart.disabled = false;
        btnStart.textContent = '▶ Gõ lại';
        btnPause.disabled = true;
        break;
      default:
        statusBadge.classList.add('idle');
        statusText.textContent = 'Chưa vào test';
        break;
    }
  }

  // Cập nhật WPM
  function updateWPM(val) {
    const wpm = parseInt(val, 10) || 120;
    sliderWpm.value = wpm;
    inputWpm.value = wpm;
    cpmLabel.textContent = `${wpm * 5} CPM`;
    sendTabMessage('UPDATE_CONFIG', { config: { wpm } });
    chrome.storage.local.set({ etm_wpm: wpm });
  }

  // Cập nhật Accuracy
  function updateAcc(val) {
    const acc = parseInt(val, 10) || 100;
    sliderAcc.value = acc;
    inputAcc.value = acc;
    accLabel.textContent = `${acc}%`;
    sendTabMessage('UPDATE_CONFIG', { config: { accuracy: acc } });
    chrome.storage.local.set({ etm_acc: acc });
  }

  // Event Listeners cho Sliders & Inputs
  sliderWpm.addEventListener('input', (e) => updateWPM(e.target.value));
  inputWpm.addEventListener('change', (e) => updateWPM(e.target.value));

  document.querySelectorAll('.presets [data-wpm]').forEach(btn => {
    btn.addEventListener('click', () => updateWPM(btn.getAttribute('data-wpm')));
  });

  chkHumanize.addEventListener('change', (e) => {
    sendTabMessage('UPDATE_CONFIG', { config: { humanize: e.target.checked } });
    chrome.storage.local.set({ etm_humanize: e.target.checked });
  });

  sliderAcc.addEventListener('input', (e) => updateAcc(e.target.value));
  inputAcc.addEventListener('change', (e) => updateAcc(e.target.value));

  document.querySelectorAll('.presets [data-acc]').forEach(btn => {
    btn.addEventListener('click', () => updateAcc(btn.getAttribute('data-acc')));
  });

  // Event Listeners cho Control Buttons
  btnStart.addEventListener('click', () => {
    sendTabMessage('START');
    applyState('TYPING');
  });

  btnPause.addEventListener('click', () => {
    if (currentEngineState === 'PAUSED') {
      sendTabMessage('RESUME');
      applyState('TYPING');
    } else {
      sendTabMessage('PAUSE');
      applyState('PAUSED');
    }
  });

  btnStop.addEventListener('click', () => {
    sendTabMessage('STOP');
    applyState('IDLE');
  });

  btnSpace.addEventListener('click', () => {
    sendTabMessage('PRESS_SPACE');
  });

  // Đọc cấu hình và trạng thái hiện tại
  function refreshStatus() {
    sendTabMessage('GET_STATUS', {}, (res) => {
      if (res && res.state) {
        applyState(res.state);
        if (res.config) {
          if (res.config.wpm) {
            sliderWpm.value = res.config.wpm;
            inputWpm.value = res.config.wpm;
            cpmLabel.textContent = `${res.config.wpm * 5} CPM`;
          }
          if (res.config.accuracy) {
            sliderAcc.value = res.config.accuracy;
            inputAcc.value = res.config.accuracy;
            accLabel.textContent = `${res.config.accuracy}%`;
          }
          if (res.config.humanize !== undefined) {
            chkHumanize.checked = res.config.humanize;
          }
        }
        if (res.stats) {
          statSentence.textContent = res.stats.sentenceIndex || 0;
          statChars.textContent = res.stats.typedChars || 0;
          statErrors.textContent = res.stats.errorsCount || 0;
        }
      }
    });
  }

  // Load storage dự phòng
  chrome.storage.local.get(['etm_wpm', 'etm_acc', 'etm_humanize'], (res) => {
    if (res.etm_wpm) updateWPM(res.etm_wpm);
    if (res.etm_acc) updateAcc(res.etm_acc);
    if (res.etm_humanize !== undefined) chkHumanize.checked = res.etm_humanize;
  });

  refreshStatus();
  // Cập nhật số liệu mỗi 300ms khi popup đang mở
  setInterval(refreshStatus, 300);
})();
