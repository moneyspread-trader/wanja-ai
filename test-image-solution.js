const fs = require('fs');
const { solveQuestion } = require('./server/solverEngine');

async function testUserImage() {
  const buf = fs.readFileSync('C:/Users/wayne/.gemini/antigravity/brain/5574a365-ded0-4ed3-99bb-40cad10d843b/.user_uploaded/media_1793731092535_45b55e3c.jpg');
  const base64 = 'data:image/jpeg;base64,' + buf.toString('base64');

  console.log('Testing solveQuestion with the user uploaded assignment image...');
  const solution = await solveQuestion({
    prompt: '',
    imageData: base64
  });

  console.log('\n================ WANJA AI SOLUTION ================\n');
  console.log(solution);
  console.log('\n===================================================\n');
  process.exit(0);
}

testUserImage().catch(console.error);
