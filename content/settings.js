/**
 * e-typing Settings Sync
 * Nạp cấu hình người dùng từ chrome.storage vào Engine của từng frame và theo dõi thay đổi,
 * để Game Frame luôn dùng đúng WPM / Accuracy kể cả khi iframe được tạo sau khi chỉnh cấu hình.
 */
(function() {
  'use strict';

  const STORAGE_TO_CONFIG = {
    etm_wpm: 'wpm',
    etm_acc: 'accuracy',
    etm_humanize: 'humanize'
  };

  if (!window.ETypingEngine || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  function applySettings(values) {
    const config = {};
    for (const [storageKey, configKey] of Object.entries(STORAGE_TO_CONFIG)) {
      if (values[storageKey] !== undefined) {
        config[configKey] = values[storageKey];
      }
    }
    if (Object.keys(config).length > 0) {
      window.ETypingEngine.updateConfig(config);
    }
  }

  chrome.storage.local.get(Object.keys(STORAGE_TO_CONFIG), applySettings);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const values = {};
    for (const [key, change] of Object.entries(changes)) {
      values[key] = change.newValue;
    }
    applySettings(values);
  });
})();
