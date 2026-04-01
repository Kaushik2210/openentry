// ============================================================
//  OpenEntry — background.js
//  Service worker: handles download requests from content.js
// ============================================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'DOWNLOAD_PDF') {
    chrome.downloads.download(
      {
        url:      msg.url,
        filename: msg.filename,
        saveAs:   false
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[OpenEntry BG] Download error:', chrome.runtime.lastError.message);
        } else {
          console.log('[OpenEntry BG] Download started, id:', downloadId);
        }
      }
    );
    // Return true to keep the message channel open (async)
    return true;
  }
});
