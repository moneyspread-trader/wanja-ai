const { solveQuestion } = require('./server/solverEngine');

async function testAll() {
  const book = { title: 'Calculus: Early Transcendentals', edition: '8th Edition', author: 'James Stewart' };

  console.log('--- TEST 1: Quadratic ---');
  console.log(await solveQuestion({ prompt: 'Solve 2x^2 + 5x - 3 = 0', referenceBook: book }));

  console.log('\n--- TEST 2: Linear Equation ---');
  console.log(await solveQuestion({ prompt: 'Solve 3x + 7 = 19', referenceBook: book }));

  console.log('\n--- TEST 3: Differentiation ---');
  console.log(await solveQuestion({ prompt: 'Find derivative of x^3 + 4x^2 - 5x + 2', referenceBook: book }));

  console.log('\n--- TEST 4: Integration ---');
  console.log(await solveQuestion({ prompt: 'Evaluate integral 3x^2 + 4x - 5 dx', referenceBook: book }));

  console.log('\n--- TEST 5: Percentage ---');
  console.log(await solveQuestion({ prompt: 'What is 15% of 800', referenceBook: book }));

  console.log('\n--- TEST 6: Physics Numerical ---');
  console.log(await solveQuestion({ prompt: 'Calculate motion with u = 0, a = 9.8, t = 3', referenceBook: book }));
}

testAll().catch(console.error);
