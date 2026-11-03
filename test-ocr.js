const { createWorker } = require('tesseract.js');
const path = require('path');

async function testOCR() {
  const imagePath = 'C:/Users/wayne/.gemini/antigravity/brain/5574a365-ded0-4ed3-99bb-40cad10d843b/.user_uploaded/media_1793731092535_45b55e3c.jpg';
  console.log('Starting OCR on user uploaded assignment...');
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  console.log('--- EXTRACTED OCR TEXT ---');
  console.log(ret.data.text);
  await worker.terminate();
}

testOCR().catch(console.error);
