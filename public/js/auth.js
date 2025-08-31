// Authentication functions for CASPER TECH

// Show message function
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1002;
        max-width: 300px;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Registration function
async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    // Show loading
    showLoading();

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Registration successful! Please login with your credentials', 'success');
            showLoginForm();
            
            // Clear form fields
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            // Remove password strength indicator
            const indicator = document.getElementById('passwordStrength');
            if (indicator) indicator.remove();
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Login function
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showMessage('Please enter both username and password', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store authentication data
            localStorage.setItem('casper_token', data.token);
            localStorage.setItem('casper_username', data.username);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to home page after short delay
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Admin login function
async function adminLogin() {
    const password = document.getElementById('adminPassword').value;

    if (!password) {
        showMessage('Please enter admin password', 'error');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store admin authentication data
            localStorage.setItem('casper_token', data.token);
            localStorage.setItem('casper_username', 'admin');
            localStorage.setItem('casper_is_admin', 'true');
            
            showMessage('Admin access granted! Redirecting...', 'success');
            
            // Redirect to admin dashboard after short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showMessage(data.error || 'Admin login failed', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Loading functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('casper_token');
    const username = localStorage.getItem('casper_username');
    const isAdmin = localStorage.getItem('casper_is_admin');
    
    // If already logged in, redirect to appropriate page
    if (token && username) {
        if (isAdmin === 'true') {
            window.location.href = '/dashboard';
        } else {
            window.location.href = '/home';
        }
        return;
    }
    
    // Add form submission event listeners
    setupFormListeners();
});

// Setup form event listeners
function setupFormListeners() {
    // Login form submission on Enter key
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginUsername) {
        loginUsername.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginPassword.focus();
            }
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Register form submission on Enter key
    const registerFields = [
        'registerUsername',
        'registerEmail', 
        'registerPassword',
        'confirmPassword'
    ];
    
    registerFields.forEach((fieldId, index) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (index < registerFields.length - 1) {
                        // Move to next field
                        const nextField = document.getElementById(registerFields[index + 1]);
                        if (nextField) nextField.focus();
                    } else {
                        // Last field, submit the form
                        register();
                    }
                }
            });
        }
    });
    
    // Admin password field
    const adminPassword = document.getElementById('adminPassword');
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }
    
    // Password strength checker for register form
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthIndicator(strength);
        });
    }
}

// Password strength calculation
function calculatePasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) {
        strength += 25;
    } else {
        feedback.push('At least 8 characters');
    }
    
    if (/[a-z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Lowercase letter');
    }
    
    if (/[A-Z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Uppercase letter');
    }
    
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        strength += 25;
    } else {
        feedback.push('Number or special character');
    }
    
    return { strength, feedback };
}

// Update password strength indicator
function updatePasswordStrengthIndicator(result) {
    let indicator = document.getElementById('passwordStrengthIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'passwordStrengthIndicator';
        indicator.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            font-size: 0.9em;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        const passwordField = document.getElementById('registerPassword');
        if (passwordField && passwordField.parentNode) {
            passwordField.parentNode.insertBefore(indicator, passwordField.nextSibling);
        }
    }
    
    const { strength, feedback } = result;
    
    let strengthText = '';
    let strengthColor = '';
    
    if (strength < 25) {
        strengthText = 'Very Weak';
        strengthColor = '#ff4757';
    } else if (strength < 50) {
        strengthText = 'Weak';
        strengthColor = '#ff6b35';
    } else if (strength < 75) {
        strengthText = 'Good';
        strengthColor = '#ffa502';
    } else {
        strengthText = 'Strong';
        strengthColor = '#2ed573';
    }
    
    const progressBar = `
        <div style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; margin-bottom: 5px;">
            <div style="
                width: ${strength}%; 
                height: 100%; 
                background: ${strengthColor}; 
                border-radius: 2px; 
                transition: all 0.3s ease;
            "></div>
        </div>
    `;
    
    const feedbackText = feedback.length > 0 ? 
        `<small style="opacity: 0.8;">Missing: ${feedback.join(', ')}</small>` : 
        `<small style="color: ${strengthColor};">✓ Strong password</small>`;
    
    indicator.innerHTML = `
        ${progressBar}
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: ${strengthColor}; font-weight: 500;">${strengthText}</span>
        </div>
        ${feedbackText}
    `;
}

// Form validation helpers
function validateUsername(username) {
    const errors = [];
    
    if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
        errors.push('Username must be less than 20 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return errors;
}

function validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 100) {
        errors.push('Password is too long');
    }
    
    return errors;
}

// Enhanced form validation
function validateRegistrationForm() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const errors = [];
    
    // Username validation
    const usernameErrors = validateUsername(username);
    errors.push(...usernameErrors);
    
    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Password validation
    const passwordErrors = validatePassword(password);
    errors.push(...passwordErrors);
    
    // Confirm password validation
    if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    return errors;
}

// Utility functions
function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Rate limiting for login attempts
let loginAttempts = 0;
let lastLoginAttempt = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

function checkRateLimit() {
    const now = Date.now();
    
    // Reset attempts after lockout duration
    if (now - lastLoginAttempt > LOCKOUT_DURATION) {
        loginAttempts = 0;
    }
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const timeRemaining = Math.ceil((LOCKOUT_DURATION - (now - lastLoginAttempt)) / 1000 / 60);
        showMessage(`Too many failed attempts. Please try again in ${timeRemaining} minutes.`, 'error');
        return false;
    }
    
    return true;
}

function recordLoginAttempt(success) {
    if (!success) {
        loginAttempts++;
        lastLoginAttempt = Date.now();
    } else {
        loginAttempts = 0;
    }
}

// Enhanced login with rate limiting
async function loginWithRateLimit() {
    if (!checkRateLimit()) {
        return;
    }
    
    const success = await login();
    recordLoginAttempt(success);
}

// Auto-clear messages after form changes
function setupAutoMessageClear() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            // Remove any existing error messages when user starts typing
            const existingMessages = document.querySelectorAll('.error, .success');
            existingMessages.forEach(msg => {
                if (msg.style.position === 'fixed') {
                    msg.remove();
                }
            });
        }, 500));
    });
}

// Initialize auto-message clearing
document.addEventListener('DOMContentLoaded', function() {
    setupAutoMessageClear();
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        login,
        register,
        adminLogin,
        showMessage,
        isValidEmail,
        calculatePasswordStrength
    };
}
