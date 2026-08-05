// --- HARDCODED CREDENTIALS ---
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'password123';

// --- LOCKOUT CONFIGURATION ---
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000; // 15 minutes in milliseconds

// --- DOM REFERENCES ---
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const lockoutTimer = document.getElementById('lockout-timer');

// --- STATE MANAGEMENT (using localStorage) ---
function getLoginState() {
    const state = localStorage.getItem('loginState');
    if (state) {
        return JSON.parse(state);
    }
    return {
        attempts: 0,                // Current failed attempts count
        lockoutUntil: null,         // Timestamp when lockout ends
        isLocked: false
    };
}

function saveLoginState(state) {
    localStorage.setItem('loginState', JSON.stringify(state));
}

// --- CHECK LOCKOUT STATUS ---
function checkLockout() {
    const state = getLoginState();
    
    if (!state.lockoutUntil) {
        state.isLocked = false;
        return state;
    }

    const now = Date.now();
    if (now >= state.lockoutUntil) {
        // Lockout expired - reset everything
        state.attempts = 0;
        state.lockoutUntil = null;
        state.isLocked = false;
        saveLoginState(state);
        return state;
    }

    // Still locked
    state.isLocked = true;
    return state;
}

// --- UPDATE UI FOR LOCKOUT ---
function updateLockoutUI(state) {
    if (!state.isLocked || !state.lockoutUntil) {
        // Hide lockout UI
        lockoutTimer.classList.remove('show');
        loginBtn.disabled = false;
        usernameInput.disabled = false;
        passwordInput.disabled = false;
        return;
    }

    // Show lockout UI
    const now = Date.now();
    const remainingMs = state.lockoutUntil - now;
    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

    lockoutTimer.innerHTML = `
        <i class="fas fa-clock"></i>
        Account locked! Try again in ${remainingMinutes}m ${remainingSeconds}s
    `;
    lockoutTimer.classList.add('show');
    
    // Disable form
    loginBtn.disabled = true;
    usernameInput.disabled = true;
    passwordInput.disabled = true;

    // Hide any previous error
    errorMessage.classList.remove('show');
}

// --- SHOW ERROR MESSAGE ---
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

// --- LOGIN ATTEMPT ---
function handleLogin(event) {
    event.preventDefault();
    hideError();

    // Get current state
    let state = getLoginState();
    
    // Check if currently locked
    state = checkLockout();
    if (state.isLocked) {
        updateLockoutUI(state);
        showError('Account is temporarily locked. Please wait.');
        return;
    }

    // Get credentials
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate input
    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }

    // Check credentials
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        // --- LOGIN SUCCESS ---
        // Reset attempts on successful login
        state.attempts = 0;
        state.lockoutUntil = null;
        state.isLocked = false;
        saveLoginState(state);

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message show';
        successMsg.innerHTML = `<i class="fas fa-check-circle"></i> Login successful! Redirecting...`;
        
        // Replace form content
        loginForm.innerHTML = '';
        loginForm.appendChild(successMsg);

        // Redirect after 2 seconds (optional)
        setTimeout(() => {
            window.location.href = 'dashboard.html'; // Create this page or just reload
        }, 2000);

        return;
    }

    // --- LOGIN FAILED ---
    state.attempts += 1;

    // Check if max attempts reached
    if (state.attempts >= MAX_ATTEMPTS) {
        // Lock the account
        state.lockoutUntil = Date.now() + LOCKOUT_MS;
        state.isLocked = true;
        saveLoginState(state);

        // Update UI
        updateLockoutUI(state);
        showError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
        return;
    }

    // Not locked yet - show remaining attempts
    saveLoginState(state);
    const remaining = MAX_ATTEMPTS - state.attempts;
    showError(`Invalid credentials. ${remaining} attempt(s) remaining.`);
    
    // Clear password field
    passwordInput.value = '';
    passwordInput.focus();
}

// --- COUNTDOWN TIMER (updates every second) ---
function startCountdown() {
    const state = getLoginState();
    if (!state.isLocked || !state.lockoutUntil) {
        return;
    }

    // Update every second
    const timerInterval = setInterval(() => {
        const currentState = getLoginState();
        const now = Date.now();

        if (!currentState.lockoutUntil || now >= currentState.lockoutUntil) {
            // Lockout expired - reset and refresh UI
            currentState.attempts = 0;
            currentState.lockoutUntil = null;
            currentState.isLocked = false;
            saveLoginState(currentState);
            updateLockoutUI(currentState);
            clearInterval(timerInterval);
            return;
        }

        // Update countdown display
        updateLockoutUI(currentState);
    }, 1000);
}

// --- INITIALIZE ---
function init() {
    const state = checkLockout();
    updateLockoutUI(state);
    
    if (state.isLocked) {
        startCountdown();
        showError('Account is temporarily locked. Please wait.');
    }

    // Add form submit listener
    loginForm.addEventListener('submit', handleLogin);

    // Real-time input clearing of error
    usernameInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
}

// Add this function to reset lockout manually (for testing)
function resetLockout() {
    localStorage.removeItem('loginState');
    location.reload();
}

// Add a hidden reset button in HTML (optional)
// Add this inside <form>:
// <button type="button" onclick="resetLockout()" style="display:none;">Reset</button>


// Start the app
init();

// --- OPTIONAL: Add a "Forgot Password" feature? ---
// You can extend this by adding a reset mechanism
// For demo purposes, we'll keep it simple
