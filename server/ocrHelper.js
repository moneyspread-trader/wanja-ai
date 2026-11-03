const { createWorker } = require('tesseract.js');

let ocrWorker = null;
let isInitializing = false;

// Pre-warm the Tesseract worker so recognition starts immediately
async function getWorker() {
  if (ocrWorker) return ocrWorker;
  if (isInitializing) {
    // Wait for in-flight init
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return ocrWorker;
  }

  isInitializing = true;
  try {
    console.log('⚡ Pre-warming Wanja high-speed OCR vision engine...');
    ocrWorker = await createWorker('eng');
    console.log('✅ Wanja OCR engine is hot and ready for instant recognition.');
  } catch (err) {
    console.warn('OCR Worker init error:', err.message);
  } finally {
    isInitializing = false;
  }
  return ocrWorker;
}

// Auto pre-warm on module load
getWorker().catch(e => console.warn('Pre-warm catch:', e.message));

/**
 * High-speed OCR with 6-second anti-hang timeout protection
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

    // Anti-lag / anti-hang: Guarantee maximum 6 seconds limit
    const recognitionPromise = (async () => {
      const ret = await worker.recognize(source);
      const text = (ret.data && ret.data.text) ? ret.data.text.trim() : '';
      const confidence = (ret.data && ret.data.confidence) ? ret.data.confidence : 0;
      return { text, confidence };
    })();

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ OCR recognition timed out after 6000ms, continuing smoothly without hanging.');
        resolve({ text: '', confidence: 0, timedOut: true });
      }, 6000);
    });

    const result = await Promise.race([recognitionPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn('OCR extraction warning:', err.message);
    return { text: '', confidence: 0 };
  }
}

module.exports = {
  extractTextFromImage,
  getWorker
};
