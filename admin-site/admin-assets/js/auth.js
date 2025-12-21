const loginForm = document.getElementById('adminLoginForm');
const createForm = document.getElementById('adminCreateForm');
const forgotBtn = document.getElementById('adminForgotBtn');
const tabs = document.querySelectorAll('.tab');
const API = '/api';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    loginForm.classList.toggle('hidden', target !== 'loginForm');
    createForm.classList.toggle('hidden', target !== 'adminCreateForm');
  });
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse(res);
    if (data.user.role !== 'admin') throw new Error('Admin account required.');
    window.location.href = '/admin/dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(createForm).entries());
  try {
    const res = await fetch(`${API}/auth/admin/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await handleResponse(res);
    alert('Admin created. You can login now.');
    createForm.reset();
    tabs[0].click();
  } catch (error) {
    alert(error.message);
  }
});

forgotBtn?.addEventListener('click', async () => {
  const email = prompt('Enter admin email:');
  if (!email) return;
  try {
    const res = await fetch(`${API}/auth/admin/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    await handleResponse(res);
    alert('Reset link sent.');
  } catch (error) {
    alert(error.message);
  }
});
