// ==========================================
// 🌸 WANJA AI - Client Application Logic
// ==========================================

const API_BASE = '/api';

// State
let currentUser = localStorage.getItem('wanja_user') || null;
let currentPasscodeVerified = localStorage.getItem('wanja_passcode_verified') === 'true' || sessionStorage.getItem('wanja_passcode_verified') === 'true';
let activeChatId = localStorage.getItem('wanja_active_chat') || null;
let chats = [];
let activeReferenceBook = {
  title: 'Calculus: Early Transcendentals',
  edition: '8th Edition',
  author: 'James Stewart'
};
let selectedImageData = null;
let cameraStream = null;
let currentFacingMode = 'environment'; // default to phone back camera

// Preset Textbooks Catalog
const PRESET_BOOKS = [
  {
    title: 'Calculus: Early Transcendentals',
    edition: '8th Edition',
    author: 'James Stewart',
    tag: 'Calculus & Math'
  },
  {
    title: 'Fundamentals of Physics',
    edition: '10th Edition',
    author: 'Halliday, Resnick & Walker',
    tag: 'Physics'
  },
  {
    title: 'Campbell Biology',
    edition: '11th Edition',
    author: 'Urry, Cain, Wasserman',
    tag: 'Biology & Life Sci'
  },
  {
    title: 'Chemistry: The Central Science',
    edition: '14th Edition',
    author: 'Brown, LeMay & Bursten',
    tag: 'Chemistry'
  },
  {
    title: 'Engineering Mathematics',
    edition: '8th Edition',
    author: 'K.A. Stroud & Dexter Booth',
    tag: 'Applied Engineering'
  },
  {
    title: 'Thomas\' Calculus',
    edition: '14th Edition',
    author: 'Joel R. Hass & Christopher E. Heil',
    tag: 'Higher Math'
  }
];

// DOM Elements
const gateScreen = document.getElementById('gate-screen');
const passcodeStep = document.getElementById('passcode-step');
const usernameStep = document.getElementById('username-step');
const passcodeInput = document.getElementById('passcode-input');
const passcodeError = document.getElementById('passcode-error');
const btnVerifyPasscode = document.getElementById('btn-verify-passcode');
const usernameInput = document.getElementById('username-input');
const usernameError = document.getElementById('username-error');
const btnLoginUsername = document.getElementById('btn-login-username');

const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const btnOpenMobileSidebar = document.getElementById('btn-open-mobile-sidebar');
const btnCloseMobileSidebar = document.getElementById('btn-close-mobile-sidebar');
const displayUsername = document.getElementById('display-username');
const chatsList = document.getElementById('chats-list');
const btnNewChat = document.getElementById('btn-new-chat');
const btnLogout = document.getElementById('btn-logout');

const chatTitle = document.getElementById('chat-title');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnThemeToggleSidebar = document.getElementById('btn-theme-toggle-sidebar');
const btnHeaderBookPill = document.getElementById('btn-header-book-pill');
const pillBookTitle = document.getElementById('pill-book-title');
const pillBookShort = document.getElementById('pill-book-short');
const messagesContainer = document.getElementById('messages-container');

const imagePreviewContainer = document.getElementById('image-preview-container');
const previewImage = document.getElementById('preview-image');
const btnRemoveImage = document.getElementById('btn-remove-image');
const promptInput = document.getElementById('prompt-input');
const btnSendMessage = document.getElementById('btn-send-message');
const fileInput = document.getElementById('file-input');

// Camera Modal Elements
const cameraModal = document.getElementById('camera-modal');
const cameraVideo = document.getElementById('camera-video');
const cameraCanvas = document.getElementById('camera-canvas');
const btnOpenCamera = document.getElementById('btn-open-camera');
const btnCloseCamera = document.getElementById('btn-close-camera');
const btnFlipCamera = document.getElementById('btn-flip-camera');
const btnCaptureCamera = document.getElementById('btn-capture-camera');

// Book Modal Elements
const bookModal = document.getElementById('book-modal');
const btnOpenBookModal = document.getElementById('btn-open-book-modal');
const btnCloseBookModal = document.getElementById('btn-close-book-modal');
const btnCancelBookModal = document.getElementById('btn-cancel-book-modal');
const btnSaveBookModal = document.getElementById('btn-save-book-modal');
const presetBooksContainer = document.getElementById('preset-books-container');
const customBookTitle = document.getElementById('custom-book-title');
const customBookEdition = document.getElementById('custom-book-edition');
const customBookAuthor = document.getElementById('custom-book-author');

// API Key Modal Elements
const apikeyModal = document.getElementById('apikey-modal');
const btnOpenApiKey = document.getElementById('btn-open-apikey');
const btnCloseApiKeyModal = document.getElementById('btn-close-apikey-modal');
const btnSaveApiKey = document.getElementById('btn-save-apikey');
const apikeyInput = document.getElementById('apikey-input');
const apikeyStatus = document.getElementById('apikey-status');

// Fullscreen Image Viewer Elements
const imageViewerModal = document.getElementById('image-viewer-modal');
const viewerModalImage = document.getElementById('viewer-modal-image');
const btnCloseViewer = document.getElementById('btn-close-viewer');

function openImageViewer(src) {
  if (!imageViewerModal || !viewerModalImage) return;
  viewerModalImage.src = src;
  imageViewerModal.classList.remove('hidden');
}

function closeImageViewer() {
  if (!imageViewerModal) return;
  imageViewerModal.classList.add('hidden');
  if (viewerModalImage) viewerModalImage.src = '';
}

// ==========================================
// THEME MANAGEMENT (DARK / LIGHT MODE)
// ==========================================

function initTheme() {
  const saved = localStorage.getItem('wanja_theme');
  if (saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('wanja_theme', isDark ? 'dark' : 'light');
}

// ==========================================
// INITIALIZATION
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderPresetBooks();
  setupEventListeners();

  if (currentPasscodeVerified && currentUser) {
    // Already authenticated and logged in
    gateScreen.classList.add('hidden');
    displayUsername.textContent = currentUser;
    loadUserChats();
  } else if (currentPasscodeVerified) {
    // Passcode verified, need username
    gateScreen.classList.remove('hidden');
    passcodeStep.classList.add('hidden');
    usernameStep.classList.remove('hidden');
    usernameInput.focus();
  } else {
    // Require passcode
    gateScreen.classList.remove('hidden');
    passcodeStep.classList.remove('hidden');
    usernameStep.classList.add('hidden');
    passcodeInput.focus();
  }
});

function setupEventListeners() {
  // Theme toggles
  if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleTheme);
  if (btnThemeToggleSidebar) btnThemeToggleSidebar.addEventListener('click', toggleTheme);

  // Passcode verification
  btnVerifyPasscode.addEventListener('click', handleVerifyPasscode);
  passcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleVerifyPasscode();
  });

  // Username login/register
  btnLoginUsername.addEventListener('click', handleLoginUsername);
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLoginUsername();
  });

  // Mobile sidebar toggles
  btnOpenMobileSidebar.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    sidebarBackdrop.classList.remove('hidden');
  });

  const closeSidebar = () => {
    sidebar.classList.add('-translate-x-full');
    sidebarBackdrop.classList.add('hidden');
  };
  btnCloseMobileSidebar.addEventListener('click', closeSidebar);
  sidebarBackdrop.addEventListener('click', closeSidebar);

  // New Chat
  btnNewChat.addEventListener('click', () => {
    createNewChat();
    closeSidebar();
  });

  // Logout
  btnLogout.addEventListener('click', handleLogout);

  // Send message
  btnSendMessage.addEventListener('click', handleSendMessage);
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Auto-resize input
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 140) + 'px';
  });

  // File Upload
  fileInput.addEventListener('change', handleFileUpload);
  btnRemoveImage.addEventListener('click', clearSelectedImage);

  // Paste image from clipboard
  window.addEventListener('paste', handlePasteImage);

  // Camera Modal
  btnOpenCamera.addEventListener('click', openCamera);
  btnCloseCamera.addEventListener('click', closeCamera);
  btnFlipCamera.addEventListener('click', flipCamera);
  btnCaptureCamera.addEventListener('click', captureFromCamera);

  // Book Modal
  btnHeaderBookPill.addEventListener('click', openBookModal);
  btnOpenBookModal.addEventListener('click', () => {
    closeSidebar();
    openBookModal();
  });
  btnCloseBookModal.addEventListener('click', closeBookModal);
  btnCancelBookModal.addEventListener('click', closeBookModal);
  btnSaveBookModal.addEventListener('click', saveCustomBook);

  // API Key Modal
  btnOpenApiKey.addEventListener('click', openApiKeyModal);
  btnCloseApiKeyModal.addEventListener('click', closeApiKeyModal);
  btnSaveApiKey.addEventListener('click', saveApiKey);

  // Fullscreen Image Viewer Modal
  if (btnCloseViewer) btnCloseViewer.addEventListener('click', closeImageViewer);
  if (imageViewerModal) {
    imageViewerModal.addEventListener('click', (e) => {
      if (e.target === imageViewerModal || e.target.closest('#btn-close-viewer')) {
        closeImageViewer();
      }
    });
  }
}

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

async function handleVerifyPasscode() {
  const code = passcodeInput.value.trim();
  passcodeError.classList.add('hidden');

  if (!code) {
    passcodeError.textContent = 'Please enter the passcode.';
    passcodeError.classList.remove('hidden');
    return;
  }

  // Instant local check for super fast response
  if (code.toUpperCase() === 'BETTYAI') {
    currentPasscodeVerified = true;
    localStorage.setItem('wanja_passcode_verified', 'true');
    sessionStorage.setItem('wanja_passcode_verified', 'true');
    passcodeStep.classList.add('hidden');
    usernameStep.classList.remove('hidden');
    setTimeout(() => usernameInput.focus(), 50);
  } else {
    passcodeError.textContent = 'Incorrect passcode. Please enter BETTYAI.';
    passcodeError.classList.remove('hidden');
    passcodeInput.classList.add('border-rose-400');
  }
}

async function handleLoginUsername() {
  const name = usernameInput.value.trim();
  usernameError.classList.add('hidden');

  if (!name) {
    usernameError.textContent = 'Please enter a username.';
    usernameError.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register-or-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user.username;
      localStorage.setItem('wanja_user', currentUser);
      displayUsername.textContent = currentUser;

      gateScreen.classList.add('hidden');

      if (data.activeChatId) {
        activeChatId = data.activeChatId;
        localStorage.setItem('wanja_active_chat', activeChatId);
      }

      chats = data.chats || [];
      renderChatsList();
      if (activeChatId) {
        loadChat(activeChatId);
      }
    } else {
      usernameError.textContent = data.error || 'Failed to login with this username.';
      usernameError.classList.remove('hidden');
    }
  } catch (err) {
    usernameError.textContent = 'Error connecting to Wanja server.';
    usernameError.classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('wanja_user');
  localStorage.removeItem('wanja_active_chat');
  localStorage.removeItem('wanja_passcode_verified');
  sessionStorage.removeItem('wanja_passcode_verified');
  currentUser = null;
  currentPasscodeVerified = false;
  activeChatId = null;
  chats = [];
  location.reload();
}

// ==========================================
// CHATS & CONVERSATION MANAGEMENT
// ==========================================

async function loadUserChats() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}`);
    const data = await res.json();
    if (data.success) {
      chats = data.chats;
      renderChatsList();

      if (!activeChatId && chats.length > 0) {
        activeChatId = chats[0].id;
      }
      if (activeChatId) {
        loadChat(activeChatId);
      } else {
        createNewChat();
      }
    }
  } catch (err) {
    console.error('Error loading chats:', err);
  }
}

function renderChatsList() {
  chatsList.innerHTML = `
    <div class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1">
      Past Conversations (${chats.length})
    </div>
  `;

  if (chats.length === 0) {
    chatsList.innerHTML += `
      <div class="p-3 text-xs text-slate-400 dark:text-slate-500 italic text-center">
        No past conversations yet.
      </div>
    `;
    return;
  }

  chats.forEach(chat => {
    const isActive = chat.id === activeChatId;
    const item = document.createElement('div');
    item.className = `group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
      isActive 
        ? 'bg-pink-100/70 dark:bg-pink-950/60 border-pink-300 dark:border-pink-800 text-pink-900 dark:text-pink-200 font-bold shadow-sm' 
        : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

    item.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden flex-1">
        <span class="text-pink-500">${isActive ? '💬' : '🗨️'}</span>
        <span class="truncate">${escapeHtml(chat.title || 'Study Session')}</span>
      </div>
      <button 
        class="delete-chat-btn opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 dark:text-slate-500 transition-opacity ml-1 rounded"
        title="Delete chat"
        data-id="${chat.id}"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-chat-btn')) return;
      activeChatId = chat.id;
      localStorage.setItem('wanja_active_chat', activeChatId);
      renderChatsList();
      loadChat(chat.id);
      // Auto-close mobile sidebar if open
      if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        sidebarBackdrop.classList.add('hidden');
      }
    });

    const deleteBtn = item.querySelector('.delete-chat-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    chatsList.appendChild(item);
  });
}

async function createNewChat() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Study Session',
        bookTitle: activeReferenceBook.title,
        bookEdition: activeReferenceBook.edition,
        bookAuthor: activeReferenceBook.author
      })
    });
    const data = await res.json();
    if (data.success) {
      chats.unshift(data.chat);
      activeChatId = data.chat.id;
      localStorage.setItem('wanja_active_chat', activeChatId);
      renderChatsList();
      loadChat(activeChatId);
    }
  } catch (err) {
    console.error('Error creating chat:', err);
  }
}

async function deleteChat(chatId) {
  if (!confirm('Are you sure you want to delete this study session?')) return;
  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}/${chatId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      chats = chats.filter(c => c.id !== chatId);
      if (activeChatId === chatId) {
        activeChatId = chats[0] ? chats[0].id : null;
        if (activeChatId) {
          localStorage.setItem('wanja_active_chat', activeChatId);
          loadChat(activeChatId);
        } else {
          createNewChat();
        }
      }
      renderChatsList();
    }
  } catch (err) {
    console.error('Error deleting chat:', err);
  }
}

async function loadChat(chatId) {
  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}/${chatId}`);
    const data = await res.json();
    if (data.success) {
      const chat = data.chat;
      chatTitle.textContent = chat.title || 'Study Session';
      
      // Update Reference Book UI
      if (chat.referenceBook) {
        activeReferenceBook = chat.referenceBook;
        updateReferenceBookUI();
      }

      renderMessages(chat.messages || []);
    }
  } catch (err) {
    console.error('Error loading chat:', err);
  }
}

// ==========================================
// MESSAGE RENDERING & PROPER LABELING
// ==========================================

function renderMessages(messages) {
  messagesContainer.innerHTML = '';

  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400 max-w-md mx-auto space-y-4 animate-fade-in">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-3xl text-white shadow-xl shadow-pink-500/20">
          🌸
        </div>
        <h3 class="text-xl font-bold font-display text-slate-800 dark:text-slate-100">
          Hi ${escapeHtml(currentUser)}, I'm Wanja!
        </h3>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Ask me any study question or homework equation. I will arrange it with proper labels: <strong>Given</strong> • <strong>Formula</strong> • <strong>Step-by-Step Working</strong> • <strong>Final Boxed Answer</strong>.
        </p>
        <div class="bg-pink-100/60 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800 rounded-xl px-4 py-2 text-xs font-semibold text-pink-900 dark:text-pink-300 inline-block">
          📖 ${escapeHtml(activeReferenceBook.title)} (${escapeHtml(activeReferenceBook.edition)}) by ${escapeHtml(activeReferenceBook.author)}
        </div>
        <div class="grid grid-cols-2 gap-2 w-full pt-2 text-left">
          <button class="quick-prompt p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/40 text-xs text-slate-700 dark:text-slate-200 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            📐 <strong>Quadratic:</strong> $2x^2 + 5x - 3 = 0$
          </button>
          <button class="quick-prompt p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-pink-200 dark:border-pink-900/40 text-xs text-slate-700 dark:text-slate-200 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            ⚡ <strong>Kinematics:</strong> $u = 0, a = 9.8, t = 3$
          </button>
        </div>
      </div>
    `;

    messagesContainer.querySelectorAll('.quick-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        promptInput.value = btn.innerText.replace(/^[📐⚡]\s*/, '').trim();
        handleSendMessage();
      });
    });

    return;
  }

  messages.forEach(msg => {
    appendMessageElement(msg, false);
  });

  renderMath();
  scrollToBottom();
}

function appendMessageElement(msg, autoScroll = true) {
  const isUser = msg.sender === 'user';
  const wrapper = document.createElement('div');
  wrapper.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-slide-up`;
  wrapper.dataset.messageId = msg.id;

  if (isUser) {
    wrapper.innerHTML = `
      <div class="max-w-[90%] sm:max-w-[78%] rounded-2xl rounded-tr-none px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/20 text-sm break-words overflow-hidden">
        ${msg.imageData ? `
          <div class="mb-2 rounded-lg overflow-hidden border border-white/20 relative group cursor-pointer image-attachment-thumb" title="Click to view full image">
            <img src="${msg.imageData}" alt="Scanned problem" class="max-h-56 w-full object-contain bg-black/20 hover:scale-[1.02] transition-transform">
            <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/></svg>
              <span>Tap to enlarge</span>
            </div>
          </div>
        ` : ''}
        <div class="whitespace-pre-wrap break-words">${escapeHtml(msg.text || '')}</div>
      </div>
      <span class="text-[10px] text-slate-400 mt-1 mr-1">${formatTime(msg.timestamp)}</span>
    `;

    // Hook click to enlarge
    if (msg.imageData) {
      const thumb = wrapper.querySelector('.image-attachment-thumb');
      if (thumb) {
        thumb.addEventListener('click', () => openImageViewer(msg.imageData));
      }
    }
  } else {
    // Assistant Message with proper labeling & Explain button
    const hasExplanation = !!msg.explanation;
    const formattedHtml = parseMarkdownToHtml(msg.text || '');

    wrapper.innerHTML = `
      <div class="flex items-start gap-2 sm:gap-2.5 w-full max-w-full">
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-xs sm:text-sm text-white font-bold flex-shrink-0 shadow-md shadow-pink-500/20 mt-1">
          🌸
        </div>
        
        <div class="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-pink-100 dark:border-pink-900/40 rounded-2xl rounded-tl-none p-3.5 sm:p-4 md:p-5 shadow-sm space-y-3 message-bubble overflow-hidden break-words">
          
          <!-- Source Badge -->
          <div class="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-pink-50 dark:border-pink-900/30 text-[11px] text-slate-500 dark:text-slate-400">
            <span class="flex items-center gap-1.5 font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-900/40 truncate max-w-[200px] sm:max-w-none">
              <span>📖</span>
              <span class="truncate">${escapeHtml(msg.referenceBook?.title || activeReferenceBook.title)}</span>
            </span>
            ${msg.responseTimeMs ? `
              <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <span>⚡</span> ${msg.responseTimeMs}ms
              </span>
            ` : ''}
          </div>

          <!-- Body Content (Properly Labeled Homework Solution) -->
          <div class="prose-wanja text-slate-800 dark:text-slate-100 text-sm leading-relaxed overflow-x-auto break-words">
            ${formattedHtml}
          </div>

          <!-- Actions Bar: Explain Button & Copy -->
          <div class="pt-2 sm:pt-3 border-t border-pink-50 dark:border-pink-900/30 flex items-center justify-between gap-2">
            
            <!-- THE IMPORTANT "EXPLAIN" BUTTON -->
            <button 
              class="btn-explain px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-slate-800 dark:to-purple-950/40 hover:from-pink-100 dark:hover:bg-slate-700 border border-pink-200 dark:border-pink-900/50 text-[11px] sm:text-xs font-bold text-pink-700 dark:text-pink-300 hover:text-pink-900 transition-all flex items-center gap-1 shadow-sm active:scale-95"
              data-id="${msg.id}"
            >
              <span>💡</span>
              <span class="explain-label">${hasExplanation ? 'Hide Explanation' : 'Explain (Simple Breakdown)'}</span>
            </button>

            <button 
              class="btn-copy-solution p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Copy solution"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span class="hidden sm:inline">Copy</span>
            </button>
          </div>

          <!-- Inline Explanation Section (Toggled by "Explain" button) -->
          <div class="explanation-container ${hasExplanation ? '' : 'hidden'} bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 border-2 border-purple-200 dark:border-purple-800/60 rounded-xl p-3 sm:p-4 text-xs space-y-2 mt-3 animate-fade-in shadow-inner overflow-hidden break-words">
            <div class="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300 text-sm">
              <span>💡</span>
              <span>Wanja's Simple Explanation</span>
            </div>
            <div class="explanation-content prose-wanja text-slate-700 dark:text-slate-200 break-words overflow-x-auto">
              ${hasExplanation ? parseMarkdownToHtml(msg.explanation) : ''}
            </div>
          </div>

        </div>
      </div>
      <span class="text-[10px] text-slate-400 mt-1 ml-9 sm:ml-11">${formatTime(msg.timestamp)}</span>
    `;

    // Hook Explain Button
    const btnExplain = wrapper.querySelector('.btn-explain');
    btnExplain.addEventListener('click', () => handleToggleExplain(msg.id, wrapper));

    // Hook Copy Button
    const btnCopy = wrapper.querySelector('.btn-copy-solution');
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(msg.text || '');
      btnCopy.innerHTML = `<span class="text-pink-600 dark:text-pink-400 font-bold">✓ Copied!</span>`;
      setTimeout(() => {
        btnCopy.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          <span class="hidden sm:inline">Copy</span>
        `;
      }, 1800);
    });
  }

  messagesContainer.appendChild(wrapper);
  if (autoScroll) {
    renderMath();
    scrollToBottom();
  }
}

// ==========================================
// EXPLAIN BUTTON HANDLER
// ==========================================

async function handleToggleExplain(messageId, wrapper) {
  const container = wrapper.querySelector('.explanation-container');
  const content = wrapper.querySelector('.explanation-content');
  const label = wrapper.querySelector('.explain-label');

  if (!container.classList.contains('hidden') && content.innerHTML.trim() !== '') {
    // Hide
    container.classList.add('hidden');
    label.textContent = 'Explain (Simple Breakdown)';
    return;
  }

  // If explanation is not generated yet, fetch from server
  if (!content.innerHTML.trim()) {
    label.innerHTML = `<span class="animate-pulse">Analyzing intuitively...</span>`;
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}/${activeChatId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      });
      const data = await res.json();
      if (data.success) {
        content.innerHTML = parseMarkdownToHtml(data.explanation);
        container.classList.remove('hidden');
        label.textContent = 'Hide Explanation';
        renderMath();
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error getting explanation:', err);
      label.textContent = 'Explain (Simple Breakdown)';
    }
  } else {
    // Show existing
    container.classList.remove('hidden');
    label.textContent = 'Hide Explanation';
    renderMath();
    scrollToBottom();
  }
}

// ==========================================
// SEND MESSAGE & QUESTION PROCESSING
// ==========================================

async function handleSendMessage() {
  const text = promptInput.value.trim();
  const imageData = selectedImageData;

  if (!text && !imageData) return;

  // Clear input
  promptInput.value = '';
  promptInput.style.height = 'auto';
  clearSelectedImage();

  // Temporary optimistic User Message
  const tempUserMsg = {
    id: 'temp_' + Date.now(),
    sender: 'user',
    text: text,
    imageData: imageData,
    timestamp: new Date().toISOString()
  };
  appendMessageElement(tempUserMsg, true);

  // Typing indicator
  const typingElement = document.createElement('div');
  typingElement.id = 'typing-indicator';
  typingElement.className = 'flex items-center gap-2 text-xs font-semibold text-pink-600 dark:text-pink-400 p-2 animate-pulse';
  typingElement.innerHTML = `
    <div class="w-6 h-6 rounded-lg bg-pink-100 dark:bg-slate-800 flex items-center justify-center text-xs">🌸</div>
    <span>${imageData ? 'Wanja is scanning all questions & following instructions on this page...' : 'Wanja is organizing steps per ' + escapeHtml(activeReferenceBook.title) + '...'}</span>
  `;
  messagesContainer.appendChild(typingElement);
  scrollToBottom();

  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}/${activeChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        imageData: imageData
      })
    });

    const data = await res.json();
    typingElement.remove();

    if (data.success) {
      appendMessageElement(data.botMessage, true);
      
      const idx = chats.findIndex(c => c.id === activeChatId);
      if (idx !== -1) {
        chats[idx] = data.chat;
        renderChatsList();
      }
    } else {
      alert(data.error || 'Failed to solve question.');
    }
  } catch (err) {
    if (typingElement) typingElement.remove();
    console.error('Error sending message:', err);
    alert('Network error. Please try again.');
  }
}

// ==========================================
// CAMERA SCANNER IMPLEMENTATION
// ==========================================

async function openCamera() {
  cameraModal.classList.remove('hidden');
  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = cameraStream;
  } catch (err) {
    console.warn('Direct camera access failed, trying default video:', err);
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraVideo.srcObject = cameraStream;
    } catch (finalErr) {
      alert('Could not open camera. Please check camera permissions in your browser.');
      closeCamera();
    }
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  cameraModal.classList.add('hidden');
}

async function flipCamera() {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
  openCamera();
}

function captureFromCamera() {
  if (!cameraVideo.videoWidth) return;

  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  const ctx = cameraCanvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

  const rawUrl = cameraCanvas.toDataURL('image/jpeg', 0.92);
  closeCamera();

  processAndOptimizeImage(rawUrl, (optimized) => {
    selectedImageData = optimized;
    previewImage.src = optimized;
    imagePreviewContainer.classList.remove('hidden');
    promptInput.focus();
  });
}

// High-speed image enhancement & downscaling: speeds up OCR and clarifies unclear photos
function processAndOptimizeImage(rawUri, onDone) {
  const img = new Image();
  img.onload = () => {
    const maxDim = 1500;
    let w = img.width;
    let h = img.height;

    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Adaptive contrast & brightness enhancement for faint/unclear handwriting or lighting
    ctx.filter = 'contrast(1.22) brightness(1.03)';
    ctx.drawImage(img, 0, 0, w, h);

    const optimized = canvas.toDataURL('image/jpeg', 0.88);
    onDone(optimized);
  };
  img.onerror = () => onDone(rawUri);
  img.src = rawUri;
}

// ==========================================
// FILE UPLOAD & CLIPBOARD PASTE
// ==========================================

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    processAndOptimizeImage(evt.target.result, (optimized) => {
      selectedImageData = optimized;
      previewImage.src = optimized;
      imagePreviewContainer.classList.remove('hidden');
    });
  };
  reader.readAsDataURL(file);
}

function clearSelectedImage() {
  selectedImageData = null;
  previewImage.src = '';
  imagePreviewContainer.classList.add('hidden');
  fileInput.value = '';
}

function handlePasteImage(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        processAndOptimizeImage(event.target.result, (optimized) => {
          selectedImageData = optimized;
          previewImage.src = optimized;
          imagePreviewContainer.classList.remove('hidden');
        });
      };
      reader.readAsDataURL(blob);
    }
  }
}

// ==========================================
// REFERENCE BOOK MODAL & SELECTION
// ==========================================

function renderPresetBooks() {
  presetBooksContainer.innerHTML = '';
  PRESET_BOOKS.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'text-left p-2.5 rounded-xl border border-pink-100 dark:border-pink-900/40 hover:border-pink-400 dark:hover:border-pink-500 bg-pink-50/30 dark:bg-slate-800/60 hover:bg-pink-50 dark:hover:bg-slate-800 transition-all flex flex-col justify-between';
    btn.innerHTML = `
      <div>
        <span class="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">${escapeHtml(b.tag)}</span>
        <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1">${escapeHtml(b.title)}</h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">${escapeHtml(b.edition)} • ${escapeHtml(b.author)}</p>
      </div>
    `;
    btn.addEventListener('click', () => {
      customBookTitle.value = b.title;
      customBookEdition.value = b.edition;
      customBookAuthor.value = b.author;
    });
    presetBooksContainer.appendChild(btn);
  });
}

function openBookModal() {
  customBookTitle.value = activeReferenceBook.title;
  customBookEdition.value = activeReferenceBook.edition;
  customBookAuthor.value = activeReferenceBook.author;
  bookModal.classList.remove('hidden');
}

function closeBookModal() {
  bookModal.classList.add('hidden');
}

async function saveCustomBook() {
  const title = customBookTitle.value.trim() || 'Standard Reference Book';
  const edition = customBookEdition.value.trim() || 'Latest Edition';
  const author = customBookAuthor.value.trim() || 'Standard Author';

  activeReferenceBook = { title, edition, author };
  updateReferenceBookUI();
  closeBookModal();

  if (activeChatId) {
    try {
      await fetch(`${API_BASE}/chats/${encodeURIComponent(currentUser)}/${activeChatId}/book`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeReferenceBook)
      });
    } catch (err) {
      console.error('Error saving book:', err);
    }
  }
}

function updateReferenceBookUI() {
  pillBookTitle.textContent = `${activeReferenceBook.title} (${activeReferenceBook.edition})`;
  pillBookShort.textContent = activeReferenceBook.title.split(':')[0].substring(0, 16);
}

// ==========================================
// API KEY SETTINGS MODAL
// ==========================================

async function openApiKeyModal() {
  apikeyModal.classList.remove('hidden');
  try {
    const res = await fetch(`${API_BASE}/settings/apikey`);
    const data = await res.json();
    if (data.preview) {
      apikeyStatus.textContent = `Current key: ${data.preview}`;
    } else {
      apikeyStatus.textContent = 'Using built-in Wanja offline engine (blazing fast).';
    }
  } catch (err) {}
}

function closeApiKeyModal() {
  apikeyModal.classList.add('hidden');
}

async function saveApiKey() {
  const key = apikeyInput.value.trim();
  try {
    await fetch(`${API_BASE}/settings/apikey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    alert('API settings saved successfully!');
    closeApiKeyModal();
  } catch (err) {
    alert('Failed to save API settings.');
  }
}

// ==========================================
// UTILITIES & RENDERING HELPERS
// ==========================================

function parseMarkdownToHtml(markdownText) {
  if (typeof marked !== 'undefined' && marked.parse) {
    return marked.parse(markdownText);
  }
  return escapeHtml(markdownText).replace(/\n/g, '<br>');
}

function renderMath() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(messagesContainer, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
