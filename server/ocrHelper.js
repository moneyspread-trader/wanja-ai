// Safe-load tesseract.js — may not be available in restricted cloud envs
let createWorker = null;
try {
  createWorker = require('tesseract.js').createWorker;
  console.log('✅ Tesseract.js loaded successfully.');
} catch (e) {
  console.warn('⚠️  Tesseract.js unavailable — OCR disabled (text questions still work):', e.message);
}

let ocrWorker = null;
let isInitializing = false;

// Lazy-load worker on first OCR request (never during boot)
async function getWorker() {
  if (!createWorker) return null;  // OCR disabled gracefully
  if (ocrWorker) return ocrWorker;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return ocrWorker;
  }

  isInitializing = true;
  try {
    console.log('⚡ Initializing Wanja OCR vision engine...');
    ocrWorker = await createWorker('eng');
    console.log('✅ Wanja OCR engine ready.');
  } catch (err) {
    console.warn('OCR Worker init error (OCR disabled for this session):', err.message);
    ocrWorker = null;
  } finally {
    isInitializing = false;
  }
  return ocrWorker;
}

/**
 * High-accuracy OCR with generous timeout for phone uploads
 */
async function extractTextFromImage(imageInput) {
  try {
    let source = imageInput;
    if (typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
      const base64Data = imageInput.split(',')[1];
      source = Buffer.from(base64Data, 'base64');
    }

    const worker = await getWorker();
    if (!worker) return { text: '', confidence: 0 };

    // Allow up to 25 seconds for detailed full-page assignment OCR
    const recognitionPromise = (async () => {
      const ret = await worker.recognize(source);
      let rawText = (ret.data && ret.data.text) ? ret.data.text.trim() : '';
      const confidence = (ret.data && ret.data.confidence) ? ret.data.confidence : 0;
      
      // Filter phone screenshot status bar headers & navigation clutter
      const filteredText = filterScreenshotNoise(rawText);
      return { text: filteredText, rawText, confidence };
    })();

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ OCR recognition timed out after 25s.');
        resolve({ text: '', confidence: 0, timedOut: true });
      }, 25000);
    });

    const result = await Promise.race([recognitionPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn('OCR extraction warning:', err.message);
    return { text: '', confidence: 0 };
  }
}

function filterScreenshotNoise(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const l = line.trim().toLowerCase();
    // Common phone top-bar / screenshot indicators:
    if (/^(?:\d{1,2}:\d{2}|[0-9]{1,2}%|\d+\s*kb\/s|\d+\s*mb\/s|lte|4g|5g|volte|am|pm)$/i.test(l)) return false;
    if (l.includes('battery') || l.includes('screen record') || l.includes('airplane mode')) return false;
    // Android/iOS screenshot header artifacts like "12:45" alone or with icons:
    if (/^\W*\d{1,2}:\d{2}\W*$/.test(l)) return false;
    return true;
  });
  return filtered.join('\n').trim();
}

module.exports = {
  extractTextFromImage,
  filterScreenshotNoise,
  getWorker
};
