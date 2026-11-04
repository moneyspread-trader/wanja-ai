try {
  require('./server/solverEngine.js');
  console.log('✅ solverEngine.js SYNTAX OK - No errors!');
} catch(e) {
  console.error('❌ SYNTAX ERROR:', e.message);
  process.exit(1);
}

try {
  require('./server/db.js');
  console.log('✅ db.js SYNTAX OK');
} catch(e) {
  console.error('❌ db.js ERROR:', e.message);
  process.exit(1);
}

try {
  require('./server/ocrHelper.js');
  console.log('✅ ocrHelper.js SYNTAX OK');
} catch(e) {
  console.error('❌ ocrHelper.js ERROR:', e.message);
  process.exit(1);
}

try {
  require('./server/index.js');
  console.log('✅ index.js SYNTAX OK - Server is STARTING!');
} catch(e) {
  console.error('❌ index.js ERROR:', e.message);
  process.exit(1);
}
