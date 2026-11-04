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
      const text = (ret.data && ret.data.text) ? ret.data.text.trim() : '';
      const confidence = (ret.data && ret.data.confidence) ? ret.data.confidence : 0;
      return { text, confidence };
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

module.exports = {
  extractTextFromImage,
  getWorker
};
