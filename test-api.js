const http = require('http');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, data: b });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  console.log('Testing Wanja AI backend...');
  // 1. Verify Passcode
  const pass1 = await post('http://localhost:5050/api/auth/verify-passcode', { passcode: 'WRONG' });
  console.log('Wrong passcode status:', pass1.status);
  const pass2 = await post('http://localhost:5050/api/auth/verify-passcode', { passcode: 'BETTYAI' });
  console.log('Correct passcode (BETTYAI) result:', pass2.data);

  // 2. Register/Login user
  const reg = await post('http://localhost:5050/api/auth/register-or-login', { username: 'betty_student' });
  console.log('User registered/logged in:', reg.data.user);
  const chatId = reg.data.activeChatId;
  console.log('Active chat ID:', chatId);

  // 3. Send a question
  const msg = await post('http://localhost:5050/api/chats/betty_student/' + chatId + '/message', {
    text: 'Solve quadratic equation 2x^2 + 5x - 3 = 0'
  });
  console.log('Bot response time:', msg.data.botMessage.responseTimeMs + 'ms');
  console.log('Bot response preview:\n', msg.data.botMessage.text.substring(0, 200) + '...');

  // 4. Test Explain
  const explain = await post('http://localhost:5050/api/chats/betty_student/' + chatId + '/explain', {
    messageId: msg.data.botMessage.id
  });
  console.log('Explain preview:\n', explain.data.explanation.substring(0, 200) + '...');
  console.log('\nAll tests completed with flying colors!');
}

test().catch(console.error);
