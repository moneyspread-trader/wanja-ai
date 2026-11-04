const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { solveQuestion, generateExplanation, TEXTBOOK_CATALOG } = require('./solverEngine');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
// Support large payloads for image capture / camera scans
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ----------------- AUTH ROUTES ----------------- //

// Health check endpoint for cloud hosts (Render / Railway)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Passcode Gate Check
app.post('/api/auth/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  if (db.verifyPasscode(passcode)) {
    return res.json({ success: true, message: 'Passcode verified.' });
  }
  return res.status(401).json({ success: false, error: 'Incorrect passcode. Please enter the valid code to enter Wanja AI.' });
});

// Username Registration / Login (First-Come, First-Served)
app.post('/api/auth/register-or-login', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Please enter a username.' });
  }

  const result = db.registerOrLogin(username);
  if (!result.success) {
    return res.status(400).json(result);
  }

  // Fetch user chats
  const chats = db.getUserChats(username);

  // If user has no chats, create their first default chat
  let initialChat = null;
  if (chats.length === 0) {
    initialChat = db.createChat(username, {
      title: 'First Study Session',
      bookTitle: 'Calculus: Early Transcendentals',
      bookEdition: '8th Edition',
      bookAuthor: 'James Stewart'
    });
  }

  return res.json({
    success: true,
    isNew: result.isNew,
    user: result.user,
    chats: db.getUserChats(username),
    activeChatId: initialChat ? initialChat.id : (chats[0] ? chats[0].id : null)
  });
});

// ----------------- CHAT SESSION ROUTES ----------------- //

// Get all chats for a username
app.get('/api/chats/:username', (req, res) => {
  const { username } = req.params;
  const chats = db.getUserChats(username);
  return res.json({ success: true, chats });
});

// Create new chat
app.post('/api/chats/:username', (req, res) => {
  const { username } = req.params;
  const { title, bookTitle, bookEdition, bookAuthor } = req.body;
  const newChat = db.createChat(username, {
    title,
    bookTitle,
    bookEdition,
    bookAuthor
  });
  return res.json({ success: true, chat: newChat });
});

// Get single chat
app.get('/api/chats/:username/:chatId', (req, res) => {
  const { chatId } = req.params;
  const chat = db.getChat(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, error: 'Chat not found' });
  }
  return res.json({ success: true, chat });
});

// Update chat reference book
app.put('/api/chats/:username/:chatId/book', (req, res) => {
  const { chatId } = req.params;
  const { title, edition, author } = req.body;
  const updated = db.updateChatBook(chatId, { title, edition, author });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Chat not found' });
  }
  return res.json({ success: true, chat: updated });
});

// Send message to chat & get Wanja's solution
app.post('/api/chats/:username/:chatId/message', async (req, res) => {
  const { chatId } = req.params;
  const { text, imageData } = req.body;

  const chat = db.getChat(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, error: 'Chat session not found' });
  }

  if (!text && !imageData) {
    return res.status(400).json({ success: false, error: 'Question text or image is required.' });
  }

  // 1. Record User Message
  const userMsg = db.addMessage(chatId, {
    sender: 'user',
    text: text || '',
    imageData: imageData || null
  });

  // 2. Solve question using chat's specific Reference Book
  const apiKey = db.getApiKey();
  const startTime = Date.now();

  try {
    const solutionText = await solveQuestion({
      prompt: text,
      imageData: imageData,
      referenceBook: chat.referenceBook,
      apiKey: apiKey
    });

    const elapsedMs = Date.now() - startTime;

    // 3. Record Assistant Response
    const botMsg = db.addMessage(chatId, {
      sender: 'wanja',
      text: solutionText,
      referenceBook: { ...chat.referenceBook },
      responseTimeMs: elapsedMs,
      explanation: null
    });

    return res.json({
      success: true,
      userMessage: userMsg,
      botMessage: botMsg,
      chat: db.getChat(chatId)
    });
  } catch (err) {
    console.error('Error generating solution:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process question. Please try again.'
    });
  }
});

// Generate deep simplified "Explain" for an existing answer
app.post('/api/chats/:username/:chatId/explain', (req, res) => {
  const { chatId } = req.params;
  const { messageId } = req.body;

  const chat = db.getChat(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, error: 'Chat not found' });
  }

  const targetMsg = chat.messages.find(m => m.id === messageId);
  if (!targetMsg) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  // Generate simple explanation
  const explanation = generateExplanation(targetMsg, chat.referenceBook);
  const updatedMsg = db.saveExplanation(chatId, messageId, explanation);

  return res.json({
    success: true,
    messageId,
    explanation,
    updatedMessage: updatedMsg
  });
});

// Delete chat
app.delete('/api/chats/:username/:chatId', (req, res) => {
  const { username, chatId } = req.params;
  const deleted = db.deleteChat(chatId, username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Chat not found or permission denied' });
  }
  return res.json({ success: true, message: 'Chat deleted' });
});

// ----------------- AUXILIARY ROUTES ----------------- //

// Book catalog presets
app.get('/api/books/catalog', (req, res) => {
  return res.json({ success: true, catalog: Object.values(TEXTBOOK_CATALOG) });
});

// Save or check API Key
app.get('/api/settings/apikey', (req, res) => {
  const key = db.getApiKey();
  return res.json({ success: true, hasKey: !!key, preview: key ? `${key.substring(0, 4)}...${key.slice(-4)}` : null });
});

app.post('/api/settings/apikey', (req, res) => {
  const { apiKey } = req.body;
  db.setApiKey(apiKey);
  return res.json({ success: true, message: 'API key settings saved.' });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🌸 WANJA AI - Dedicated Study & Question Solver`);
  console.log(`⚡ Running at: http://localhost:${PORT}`);
  console.log(`🔐 Gate Passcode: BETTYAI`);
  console.log(`===============================================`);
});
