const { solveQuestion } = require('./server/solverEngine');

async function testCases() {
  const book = { title: 'Calculus: Early Transcendentals', edition: '8th Edition', author: 'James Stewart' };

  console.log('--- TEST 1: Greeting "hello" ---');
  console.log(await solveQuestion({ prompt: 'hello', referenceBook: book }));

  console.log('\n--- TEST 2: "how are you" ---');
  console.log(await solveQuestion({ prompt: 'how are you', referenceBook: book }));

  console.log('\n--- TEST 3: Sending image with generic prompt ---');
  console.log(await solveQuestion({ prompt: 'solve this', imageData: 'data:image/jpeg;base64,12345', referenceBook: book }));

  console.log('\n--- TEST 4: Gibberish "asdfghjk" ---');
  console.log(await solveQuestion({ prompt: 'asdfghjkl', referenceBook: book }));

  console.log('\n--- TEST 5: Legitimate equation ---');
  console.log(await solveQuestion({ prompt: 'Solve 2x^2 + 5x - 3 = 0', referenceBook: book }));
}

testCases().catch(console.error);
