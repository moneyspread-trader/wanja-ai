const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'wanja.json');

// In-memory fallback store for environments with read-only filesystems (e.g. Render free tier)
let memoryStore = null;
let useMemoryOnly = false;

const EMPTY_DB = () => ({
  users: {},
  chats: {},
  config: {
    passcode: 'BETTYAI',
    apiKey: process.env.GEMINI_API_KEY || ''
  }
});

// Initialize DB file if not present
function initDB() {
  if (useMemoryOnly) return; // already using memory

  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB(), null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('⚠️  File DB unavailable, switching to in-memory store (data resets on restart):', err.message);
    useMemoryOnly = true;
    if (!memoryStore) memoryStore = EMPTY_DB();
  }
}

function readDB() {
  if (useMemoryOnly) {
    if (!memoryStore) memoryStore = EMPTY_DB();
    return memoryStore;
  }
  initDB();
  if (useMemoryOnly) return memoryStore; // initDB may have flipped this
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, using empty store:', err.message);
    return EMPTY_DB();
  }
}

function writeDB(data) {
  if (useMemoryOnly) {
    memoryStore = data;
    return;
  }
  try {
    const tempPath = DB_FILE + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.warn('⚠️  File write failed, falling back to memory:', err.message);
    useMemoryOnly = true;
    memoryStore = data;
  }
}

// Run init at module load
initDB();

module.exports = {
  verifyPasscode(passcode) {
    return (passcode || '').trim() === 'BETTYAI';
  },

  getUser(username) {
    const db = readDB();
    const cleanUsername = (username || '').trim().toLowerCase();
    return db.users[cleanUsername] || null;
  },

  registerOrLogin(rawUsername) {
    const db = readDB();
    const cleanUsername = (rawUsername || '').trim().toLowerCase();
    const displayName = rawUsername.trim();

    if (!cleanUsername) {
      return { success: false, error: 'Username cannot be blank.' };
    }

    if (cleanUsername.length < 2 || cleanUsername.length > 24) {
      return { success: false, error: 'Username must be between 2 and 24 characters.' };
    }

    // Check if user exists
    if (db.users[cleanUsername]) {
      // Existing user logging in - updates last login
      db.users[cleanUsername].lastLogin = new Date().toISOString();
      writeDB(db);
      return {
        success: true,
        isNew: false,
        user: {
          username: db.users[cleanUsername].displayName || displayName,
          createdAt: db.users[cleanUsername].createdAt,
          lastLogin: db.users[cleanUsername].lastLogin
        }
      };
    }

    // New user registration (first come, first served)
    const newUser = {
      username: cleanUsername,
      displayName: displayName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    db.users[cleanUsername] = newUser;
    writeDB(db);

    return {
      success: true,
      isNew: true,
      user: {
        username: displayName,
        createdAt: newUser.createdAt,
        lastLogin: newUser.lastLogin
      }
    };
  },

  getUserChats(rawUsername) {
    const db = readDB();
    const cleanUsername = (rawUsername || '').trim().toLowerCase();
    const userChats = Object.values(db.chats)
      .filter(chat => chat.username.toLowerCase() === cleanUsername)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return userChats;
  },

  createChat(rawUsername, options = {}) {
    const db = readDB();
    const cleanUsername = (rawUsername || '').trim().toLowerCase();
    const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const defaultBook = {
      title: options.bookTitle || 'Calculus: Early Transcendentals',
      edition: options.bookEdition || '8th Edition',
      author: options.bookAuthor || 'James Stewart'
    };

    const newChat = {
      id: chatId,
      username: cleanUsername,
      title: options.title || 'New Study Session',
      referenceBook: defaultBook,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.chats[chatId] = newChat;
    writeDB(db);
    return newChat;
  },

  getChat(chatId) {
    const db = readDB();
    return db.chats[chatId] || null;
  },

  updateChatBook(chatId, book) {
    const db = readDB();
    if (!db.chats[chatId]) return null;
    db.chats[chatId].referenceBook = {
      title: (book.title || '').trim() || 'General Academic Standard',
      edition: (book.edition || '').trim() || 'Latest Edition',
      author: (book.author || '').trim() || 'Authoritative Source'
    };
    db.chats[chatId].updatedAt = new Date().toISOString();
    writeDB(db);
    return db.chats[chatId];
  },

  addMessage(chatId, message) {
    const db = readDB();
    if (!db.chats[chatId]) return null;

    const msgWithId = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...message
    };

    db.chats[chatId].messages.push(msgWithId);

    // Auto-update chat title if it's the first question
    if (db.chats[chatId].messages.filter(m => m.sender === 'user').length === 1 && message.sender === 'user') {
      const summary = (message.text || 'Question').substring(0, 32).trim();
      db.chats[chatId].title = summary.length > 28 ? summary + '...' : summary;
    }

    db.chats[chatId].updatedAt = new Date().toISOString();
    writeDB(db);
    return msgWithId;
  },

  saveExplanation(chatId, messageId, explanationText) {
    const db = readDB();
    if (!db.chats[chatId]) return null;

    const msg = db.chats[chatId].messages.find(m => m.id === messageId);
    if (msg) {
      msg.explanation = explanationText;
      db.chats[chatId].updatedAt = new Date().toISOString();
      writeDB(db);
      return msg;
    }
    return null;
  },

  deleteChat(chatId, rawUsername) {
    const db = readDB();
    const cleanUsername = (rawUsername || '').trim().toLowerCase();
    if (db.chats[chatId] && db.chats[chatId].username === cleanUsername) {
      delete db.chats[chatId];
      writeDB(db);
      return true;
    }
    return false;
  },

  getApiKey() {
    const db = readDB();
    return db.config.apiKey || process.env.GEMINI_API_KEY || '';
  },

  setApiKey(key) {
    const db = readDB();
    db.config.apiKey = (key || '').trim();
    writeDB(db);
    return true;
  }
};
