const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const studentForgotBtn = document.getElementById('studentForgotBtn');
const adminResetBtn = document.getElementById('adminResetBtn');
const yearEl = document.getElementById('year');

const API_URL = '/api';

const toggleForms = (view) => {
  if (view === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
  }
};

loginTab?.addEventListener('click', () => toggleForms('login'));
signupTab?.addEventListener('click', () => toggleForms('signup'));

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await handleResponse(res);
    window.location.href = '/user/dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await handleResponse(res);
    window.location.href = '/user/dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});

studentForgotBtn?.addEventListener('click', async () => {
  const email = prompt('Enter your registered email:');
  if (!email) return;
  try {
    const res = await fetch(`${API_URL}/auth/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    await handleResponse(res);
    alert('Password reset link sent to your email.');
  } catch (error) {
    alert(error.message);
  }
});

adminResetBtn?.addEventListener('click', async () => {
  const email = prompt('Admin email to reset password:');
  if (!email) return;
  try {
    const res = await fetch(`${API_URL}/auth/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    await handleResponse(res);
    alert('Admin reset link sent.');
  } catch (error) {
    alert(error.message);
  }
});

yearEl.textContent = new Date().getFullYear();

// Load site settings including logo
const loadSiteSettings = async () => {
  try {
    const res = await fetch(`${API_URL}/user/site-settings`);
    const settings = await res.json();
    
    // Update logo if available
    const logoImg = document.querySelector('.logo');
    if (settings.logo_path && logoImg) {
      logoImg.src = settings.logo_path;
      logoImg.style.display = 'block';
    }
  } catch (error) {
    // Silently fall back to default logo
  }
};

// Load site settings when page loads
loadSiteSettings();
