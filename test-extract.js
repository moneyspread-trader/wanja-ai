const fs = require('fs');
const { extractTextFromImage } = require('./server/ocrHelper');

async function run() {
  const buf = fs.readFileSync('C:/Users/wayne/.gemini/antigravity/brain/5574a365-ded0-4ed3-99bb-40cad10d843b/.user_uploaded/media_1793731092535_45b55e3c.jpg');
  const base64 = 'data:image/jpeg;base64,' + buf.toString('base64');
  console.log('Extracting text from base64...');
  const text = await extractTextFromImage(base64);
  console.log('Extracted length:', text.length);
  console.log('First 250 characters:\n' + text.substring(0, 250));
  process.exit(0);
}

run().catch(console.error);
