const sections = {
  overviewSection: document.getElementById('overviewSection'),
  competitionSection: document.getElementById('competitionSection'),
  submissionSection: document.getElementById('submissionSection'),
  winnerSection: document.getElementById('winnerSection'),
  studentSection: document.getElementById('studentSection'),
  paymentSection: document.getElementById('paymentSection'),
  settingsSection: document.getElementById('settingsSection')
};

const navButtons = document.querySelectorAll('.nav-btn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

const statsGrid = document.getElementById('statsGrid');
const latestSubmissionsBody = document.querySelector('#latestSubmissions tbody');
const competitionList = document.getElementById('competitionList');
const submissionTableBody = document.querySelector('#submissionTable tbody');
const winnersGrid = document.getElementById('winnersGrid');
const studentTableBody = document.querySelector('#studentTable tbody');
const paymentTableBody = document.querySelector('#paymentTable tbody');

const competitionForm = document.getElementById('competitionForm');
const competitionFormTitle = document.getElementById('competitionFormTitle');
const newCompetitionBtn = document.getElementById('newCompetitionBtn');
let editingCompetitionId = null;

const winnerForm = document.getElementById('winnerForm');
const newWinnerBtn = document.getElementById('newWinnerBtn');
const settingsForm = document.getElementById('settingsForm');
const featureForm = document.getElementById('featureForm');

const API = '/api/admin';

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  // Don't try to parse JSON for file upload responses that might be empty
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unexpected error');
    return data;
  } else {
    if (!res.ok) throw new Error('Upload failed');
    return { message: 'Upload successful' };
  }
};

const showSection = (id) => {
  Object.entries(sections).forEach(([key, el]) => {
    el?.classList.toggle('hidden', key !== id);
  });
};

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    showSection(target);
  });
});

const loadDashboard = async () => {
  try {
    const data = await fetchJSON(`${API}/dashboard`);
    const { stats, latestSubmissions, winners } = data;
    statsGrid.innerHTML = `
      <div class="card stat-card"><p>Students</p><h2>${stats.students}</h2></div>
      <div class="card stat-card"><p>Competitions</p><h2>${stats.competitions}</h2></div>
      <div class="card stat-card"><p>Submissions</p><h2>${stats.submissions}</h2></div>
      <div class="card stat-card"><p>Paid Orders</p><h2>${stats.paid_orders}</h2></div>
    `;
    latestSubmissionsBody.innerHTML = latestSubmissions
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.competition}</td>
        <td><span class="pill ${item.status}">${item.status}</span></td>
        <td>${new Date(item.created_at).toLocaleDateString()}</td>
      </tr>
    `
      )
      .join('');
    winnersGrid.innerHTML = winners
      .map(
        (winner) => `
        <div class="card">
          <img src="${winner.media_path}" alt="${winner.student_name}" style="width:100%;border-radius:12px;max-height:180px;object-fit:cover;">
          <h4>${winner.student_name}</h4>
          <p>${winner.competition || ''}</p>
        </div>
      `
      )
      .join('');
  } catch (error) {
    alert('Session expired or unauthorized. Please login again.');
    window.location.href = '/admin/index.html';
  }
};

const renderCompetitionRow = (comp) => `
  <div class="card" data-id="${comp.id}">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${comp.thumbnail ? `<img src="${comp.thumbnail}" alt="${comp.title}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : ''}
        <div>
          <h4>${comp.title}</h4>
          <p>${comp.description || ''}</p>
          <small>${comp.is_paid ? 'Paid' : 'Free'} | ${comp.status}</small>
        </div>
      </div>
      <div>
        <button class="primary-btn edit-comp" data-id="${comp.id}">Edit</button>
        <button class="link-btn delete-comp" data-id="${comp.id}">Delete</button>
      </div>
    </div>
  </div>
`;

const loadCompetitions = async () => {
  const competitions = await fetchJSON(`${API}/competitions`);
  competitionList.innerHTML = competitions.map(renderCompetitionRow).join('');
  competitionList.querySelectorAll('.edit-comp').forEach((btn) =>
    btn.addEventListener('click', () => editCompetition(btn.dataset.id, competitions))
  );
  competitionList.querySelectorAll('.delete-comp').forEach((btn) =>
    btn.addEventListener('click', () => deleteCompetition(btn.dataset.id))
  );
};

const editCompetition = (id, competitions) => {
  const comp = competitions.find((c) => String(c.id) === String(id));
  if (!comp) return;
  editingCompetitionId = id;
  competitionFormTitle.textContent = 'Edit competition';
  competitionForm.classList.remove('hidden');
  Object.entries(comp).forEach(([key, value]) => {
    if (competitionForm.elements[key]) {
      competitionForm.elements[key].value = value ?? '';
    }
  });
};

const deleteCompetition = async (id) => {
  if (!confirm('Delete this competition?')) return;
  await fetchJSON(`${API}/competitions/${id}`, { method: 'DELETE' });
  loadCompetitions();
};

const loadSubmissions = async () => {
  const submissions = await fetchJSON(`${API}/submissions`);
  submissionTableBody.innerHTML = submissions
    .map(
      (sub) => `
    <tr data-id="${sub.id}">
      <td>${sub.name}</td>
      <td>${sub.email}</td>
      <td>${sub.competition}</td>
      <td><span class="pill ${sub.status}">${sub.status}</span></td>
      <td>
        <select class="status-select" data-id="${sub.id}">
          <option value="pending" ${sub.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="approved" ${sub.status === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
        <button class="link-btn delete-sub" data-id="${sub.id}">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');

  submissionTableBody.querySelectorAll('.status-select').forEach((select) =>
    select.addEventListener('change', () => updateSubmissionStatus(select.dataset.id, select.value))
  );
  submissionTableBody.querySelectorAll('.delete-sub').forEach((btn) =>
    btn.addEventListener('click', () => deleteSubmission(btn.dataset.id))
  );
};

const updateSubmissionStatus = async (id, status) => {
  await fetchJSON(`${API}/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadSubmissions();
};

const deleteSubmission = async (id) => {
  if (!confirm('Delete this submission?')) return;
  await fetchJSON(`${API}/submissions/${id}`, { method: 'DELETE' });
  loadSubmissions();
};

const loadWinners = async () => {
  const winners = await fetchJSON(`${API}/winners`);
  winnersGrid.innerHTML = winners
    .map(
      (winner) => `
    <div class="card">
      <img src="${winner.media_path}" alt="${winner.student_name}" style="width:100%;border-radius:12px;max-height:180px;object-fit:cover;">
      <h4>${winner.student_name}</h4>
      <p>${winner.school || ''}</p>
      <button class="link-btn delete-winner" data-id="${winner.id}">Remove</button>
    </div>
  `
    )
    .join('');
  winnersGrid.querySelectorAll('.delete-winner').forEach((btn) =>
    btn.addEventListener('click', () => deleteWinner(btn.dataset.id))
  );
};

const deleteWinner = async (id) => {
  if (!confirm('Remove winner?')) return;
  await fetchJSON(`${API}/winners/${id}`, { method: 'DELETE' });
  loadWinners();
};

const loadStudents = async () => {
  const students = await fetchJSON(`${API}/students`);
  studentTableBody.innerHTML = students
    .map(
      (student) => `
    <tr>
      <td>${student.name}</td>
      <td>${student.email}</td>
      <td>${student.school || ''}</td>
      <td>${new Date(student.created_at).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join('');
};

const loadPayments = async () => {
  const payments = await fetchJSON(`${API}/payments`);
  paymentTableBody.innerHTML = payments
    .map(
      (pay) => `
    <tr>
      <td>${pay.name}</td>
      <td>${pay.competition}</td>
      <td>₹${pay.amount}</td>
      <td>${pay.status}</td>
      <td>${new Date(pay.created_at).toLocaleString()}</td>
    </tr>
  `
    )
    .join('');
};

const hydrateSettingsForm = async () => {
  const settings = await fetchJSON(`${API}/settings`);
  if (settingsForm) {
    settingsForm.affiliateText.value = settings?.affiliate_text || '';
    settingsForm.aboutContent.value = settings?.about_content || '';
  }
};

competitionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData(competitionForm);
    const url = editingCompetitionId ? `${API}/competitions/${editingCompetitionId}` : `${API}/competitions`;
    const method = editingCompetitionId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json().catch(() => ({ message: 'Operation successful' }));
    console.log('Competition operation successful:', result);
    
    editingCompetitionId = null;
    competitionForm.reset();
    competitionForm.classList.add('hidden');
    loadCompetitions();
    alert(result.message || 'Competition saved successfully!');
  } catch (error) {
    console.error('Competition upload error:', error);
    alert('Failed to save competition: ' + error.message);
  }
});

newCompetitionBtn?.addEventListener('click', () => {
  editingCompetitionId = null;
  competitionForm.reset();
  competitionFormTitle.textContent = 'New competition';
  competitionForm.classList.toggle('hidden');
});

winnerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData(winnerForm);
    console.log('Submitting winner form with data:', Object.fromEntries(formData));
    
    const response = await fetch(`${API}/winners`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json().catch(() => ({ message: 'Upload successful' }));
    console.log('Upload successful:', result);
    
    winnerForm.reset();
    winnerForm.classList.add('hidden');
    loadWinners();
    alert('Winner added successfully!');
  } catch (error) {
    console.error('Winner upload error:', error);
    alert('Failed to add winner: ' + error.message);
  }
});

newWinnerBtn?.addEventListener('click', () => {
  winnerForm.classList.toggle('hidden');
});

settingsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData(settingsForm);
    const response = await fetch(`${API}/settings`, {
      method: 'PATCH',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json().catch(() => ({ message: 'Settings updated successfully' }));
    console.log('Settings update successful:', result);
    alert('Settings updated successfully!');
  } catch (error) {
    console.error('Settings upload error:', error);
    alert('Failed to update settings: ' + error.message);
  }
});

featureForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(featureForm).entries());
  await fetchJSON(`${API}/features/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  alert('Feature flag updated.');
});

adminLogoutBtn?.addEventListener('click', async () => {
  await fetchJSON('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/index.html';
});

const init = async () => {
  await Promise.all([
    loadDashboard(),
    loadCompetitions(),
    loadSubmissions(),
    loadWinners(),
    loadStudents(),
    loadPayments(),
    hydrateSettingsForm()
  ]);
};

init();
