const resetWhatsAppGuidance = () => {
  activeCompetition = null;
  whatsappCTA?.classList.add('hidden');
  if (whatsappNote) {
    whatsappNote.textContent = 'Join a competition to unlock the WhatsApp submission button.';
  }
};

const updateWhatsAppGuidance = () => {
  if (!activeCompetition) {
    resetWhatsAppGuidance();
    return;
  }

  whatsappCTA?.classList.remove('hidden');
  if (whatsappNote) {
    whatsappNote.textContent = `Competition locked: ${activeCompetition.title}`;
  }
};
const sections = {
  overview: document.getElementById('overview'),
  competitions: document.getElementById('competitionsSection'),
  submissions: document.getElementById('submissionsSection'),
  results: document.getElementById('resultsSection'),
  about: document.getElementById('aboutSection'),
  profile: document.getElementById('profileSection'),
  affiliate: document.getElementById('affiliateSection')
};

const navButtons = document.querySelectorAll('.nav-btn');
const submissionFormSection = document.getElementById('submissionFormSection');
const menuToggle = document.getElementById('menuToggle');
const menuOverlay = document.getElementById('menuOverlay');
const dashboardLayout = document.querySelector('.dashboard-layout');

const profilePictureEl = document.getElementById('profilePicture');
const studentNameEl = document.getElementById('studentName');
const studentEmailEl = document.getElementById('studentEmail');
const studentSchoolEl = document.getElementById('studentSchool');

const competitionsGrid = document.getElementById('competitionsGrid');
const submissionsTable = document.querySelector('#submissionsTable tbody');
const winnersMarquee = document.getElementById('winnersMarquee');

const profileForm = document.getElementById('profileForm');
const submissionForm = document.getElementById('submissionForm');
const submissionCompetitionSelect = document.getElementById('submissionCompetition');
const whatsappNote = document.getElementById('whatsappNote');
const whatsappCTA = document.getElementById('whatsappCTA');
const whatsappButton = document.getElementById('whatsappButton');
const profileChip = document.getElementById('profileChip');
const profileChipName = document.getElementById('profileChipName');
const profileChipImage = document.getElementById('profileChipImage');

const logoutBtn = document.getElementById('logoutBtn');
const uploadProfileBtn = document.getElementById('uploadProfileBtn');
const joinAffiliateBtn = document.getElementById('joinAffiliateBtn');

const API = '/api';
const WHATSAPP_NUMBER = '9382584870';
let studentProfile = null;
let activeCompetition = null;
const paidCompetitions = new Set();

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.target;
    Object.keys(sections).forEach((key) => {
      sections[key]?.classList.toggle('hidden', key !== target);
    });
    submissionFormSection.classList.toggle('hidden', target !== 'competitions');
    if (window.innerWidth <= 900) {
      dashboardLayout?.classList.remove('sidebar-open');
      menuOverlay?.classList.remove('visible');
      document.body.classList.remove('sidebar-open');
    }
  });
});

const toggleSidebar = () => {
  dashboardLayout?.classList.toggle('sidebar-open');
  document.body.classList.toggle('sidebar-open');
};

menuToggle?.addEventListener('click', toggleSidebar);
menuOverlay?.addEventListener('click', toggleSidebar);
profileChip?.addEventListener('click', () => {
  const profileBtn = Array.from(navButtons).find((btn) => btn.dataset.target === 'profile');
  profileBtn?.click();
});

const loadSiteSettings = async () => {
  try {
    const res = await fetch(`${API}/user/site-settings`);
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

loadSiteSettings();

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Unexpected error');
  return data;
};

const loadDashboard = async () => {
  try {
    console.log('Loading dashboard...');
    
    // First try the authenticated dashboard
    try {
      console.log('Trying authenticated dashboard API...');
      const data = await fetchJSON(`${API}/user/dashboard`);
      console.log('Dashboard data received:', data);
      const { profile, competitions, submissions, winners, settings } = data;
      
      console.log('Competitions data:', competitions?.length, 'items');
      if (competitions && competitions.length > 0) {
        console.log('First competition:', competitions[0]);
      }

      studentProfile = profile;
      studentNameEl.textContent = `Hey ${profile.name || 'Changemaker'}!`;
      studentEmailEl.textContent = profile.email;
      if (profile.school) studentSchoolEl.textContent = profile.school;
      if (profile.profile_picture) profilePictureEl.src = profile.profile_picture;

      renderCompetitions(competitions);
      renderSubmissions(submissions);
      renderWinners(winners);
      populateSubmissionSelect(competitions);
      resetWhatsAppGuidance();
      if (profileChipName) profileChipName.textContent = profile.name || 'You';
      if (profileChipImage && profile.profile_picture) profileChipImage.src = profile.profile_picture;

      document.getElementById('affiliateContent').textContent =
        settings?.affiliate_text || 'Partner with Global Bangla to unlock exclusive events.';
      document.getElementById('aboutContent').textContent =
        settings?.about_content || 'Global Bangla is a platform for students to showcase their talents and compete in various competitions.';
      
    } catch (authError) {
      console.log('Authenticated API failed, trying public endpoint...');
      
      // Fallback to public competitions endpoint
      const competitions = await fetchJSON(`${API}/user/competitions-public`);
      console.log('Public competitions loaded:', competitions?.length, 'items');
      
      // Set default profile data
      studentNameEl.textContent = 'Hey Changemaker!';
      studentEmailEl.textContent = 'Please login to see your profile';
      
      renderCompetitions(competitions);
    }
    
  } catch (error) {
    console.error('Dashboard loading failed completely:', error);
    
    // Final fallback - test with hardcoded data to see if rendering works
    console.log('Using hardcoded test data...');
    const testCompetitions = [
      {
        id: 1,
        title: 'Test Competition 1',
        description: 'This is a test to see if thumbnails render',
        thumbnail: '/uploads/competitions/competitions-54af47b5-6fb6-488d-8fab-96a3d9d8981d.webp',
        is_paid: 0,
        fee: '0.00',
        status: 'active'
      },
      {
        id: 2,
        title: 'Test Competition 2',
        description: 'Another test with different thumbnail',
        thumbnail: '/uploads/competitions/competitions-a286bb22-d2be-4ff6-9cf7-5cd4411488f8.jpg',
        is_paid: 1,
        fee: '10.00',
        status: 'active'
      }
    ];
    
    studentNameEl.textContent = 'Hey Changemaker!';
    studentEmailEl.textContent = 'Demo mode - competitions loaded with test data';
    
    renderCompetitions(testCompetitions);
  }
};

const renderCompetitions = (competitions = []) => {
  console.log('renderCompetitions called with:', competitions.length, 'items');
  
  // Clear the grid first
  competitionsGrid.innerHTML = '';
  
  if (!competitions || competitions.length === 0) {
    competitionsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;">No competitions available</p>';
    return;
  }
  
  document.getElementById('statCompetitions').textContent = competitions.length;
  
  competitions.forEach((comp, index) => {
    console.log(`Rendering competition ${index + 1}:`, comp.title, 'Has thumbnail:', !!comp.thumbnail);
    
    const card = document.createElement('article');
    card.className = 'competition-card';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'competition-image-container';
    
    if (comp.thumbnail) {
      const img = document.createElement('img');
      img.src = comp.thumbnail;
      img.alt = comp.title;
      img.className = 'competition-thumbnail';
      img.loading = 'lazy';
      
      // Add error handling
      img.onload = () => console.log('✓ Thumbnail loaded for:', comp.title);
      img.onerror = () => console.log('✗ Thumbnail failed for:', comp.title, 'Path:', comp.thumbnail);
      
      imageContainer.appendChild(img);
    } else {
      imageContainer.className += ' no-image';
    }
    
    // Add badge
    const badge = document.createElement('div');
    badge.className = `competition-badge ${comp.is_paid ? 'paid' : 'free'}`;
    badge.textContent = comp.is_paid ? `₹${comp.fee}` : 'FREE';
    imageContainer.appendChild(badge);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'competition-content';
    content.innerHTML = `
      <div class="competition-header">
        <h3 class="competition-title">${comp.title}</h3>
        <span class="competition-status ${comp.status || 'active'}">${comp.status || 'Active'}</span>
      </div>
      <p class="competition-description">${comp.description || 'Showcase your talent and compete with students from around the world.'}</p>
      <div class="competition-meta">
        <div class="competition-dates">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${comp.start_date ? new Date(comp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Starts Soon'} - 
          ${comp.end_date ? new Date(comp.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}
        </div>
      </div>
      <button
        class="competition-btn ${paidCompetitions.has(String(comp.id)) ? 'paid-disabled' : ''}"
        data-id="${comp.id}"
        data-paid="${comp.is_paid}"
        data-title="${comp.title?.replace(/"/g, '&quot;') || 'Global Bangla Event'}"
        ${paidCompetitions.has(String(comp.id)) ? 'disabled' : ''}
      >
        ${
          comp.is_paid
            ? paidCompetitions.has(String(comp.id))
              ? 'Already Registered'
              : `Register for ₹${comp.fee}`
            : 'Join Competition'
        }
      </button>
    `;
    
    card.appendChild(imageContainer);
    card.appendChild(content);
    competitionsGrid.appendChild(card);
  });
  
  // Add event listeners to buttons
  competitionsGrid.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => handleCompetitionClick(btn.dataset));
  });
};

const markCompetitionPaid = (competitionId) => {
  paidCompetitions.add(String(competitionId));
  const btn = competitionsGrid.querySelector(`button[data-id="${competitionId}"]`);
  if (btn) {
    btn.textContent = 'Paid';
    btn.disabled = true;
    btn.classList.add('paid-disabled');
  }
};

const populateSubmissionSelect = (competitions = []) => {
  if (!submissionCompetitionSelect) return;
  submissionCompetitionSelect.innerHTML = competitions
    .map((comp) => `<option value="${comp.id}">${comp.title}</option>`)
    .join('');
};

const renderSubmissions = (list = []) => {
  document.getElementById('statSubmissions').textContent = list.length;
  submissionsTable.innerHTML = list
    .map(
      (sub) => `
    <tr>
      <td>${sub.competition}</td>
      <td>${sub.status}</td>
      <td>${new Date(sub.created_at).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join('');
};

const renderWinners = (winners = []) => {
  document.getElementById('statWins').textContent = winners.length;
  winnersMarquee.innerHTML = winners
    .map(
      (winner) => `
      <div class="winner-card">
        <img src="${winner.media_path}" alt="${winner.student_name}" />
        <h4>${winner.student_name}</h4>
        <p>${winner.competition || ''}</p>
      </div>
    `
    )
    .join('');
};

const handleCompetitionClick = async ({ id, paid, title }) => {
  const numericId = Number(id);
  if (submissionCompetitionSelect) {
    submissionCompetitionSelect.value = numericId;
  }

  const isPaid = paid === 'true' || paid === true || paid === '1';

  if (isPaid && paidCompetitions.has(String(numericId))) {
    activeCompetition = { id: numericId, title };
    updateWhatsAppGuidance();
    return;
  }

  if (isPaid) {
    try {
      const orderData = await fetchJSON(`${API}/user/payments/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: numericId })
      });
      
      // Open Razorpay checkout
      const options = {
        key: 'rzp_test_RtlOPd6EmpLkYA', // Test key from .env
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Global Bangla',
        description: `Payment for ${title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on server
            await fetchJSON(`${API}/user/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });
            
            alert('Payment successful! You can now submit your entry.');
            markCompetitionPaid(numericId);
            activeCompetition = { id: numericId, title };
            updateWhatsAppGuidance();
          } catch (error) {
            alert('Payment verification failed: ' + error.message);
          }
        },
        modal: {
          ondismiss: function() {
            alert('Payment cancelled. You can try again later.');
          }
        },
        prefill: {
          email: studentProfile?.email || '',
          name: studentProfile?.name || ''
        },
        theme: {
          color: '#2563eb'
        }
      };
      
      const razorpay = new Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      alert('Payment failed: ' + error.message);
      return;
    }
  } else {
    // For free competitions, directly activate WhatsApp submission
    activeCompetition = { id: numericId, title };
    updateWhatsAppGuidance();
  }
};

profileForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(profileForm).entries());
  try {
    await fetchJSON(`${API}/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    alert('Profile updated.');
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
});

submissionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(submissionForm);
  try {
    const res = await fetch(`${API}/user/submissions`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert(`${data.message} — Please also send your video on WhatsApp for faster verification.`);
    submissionForm.reset();
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn?.addEventListener('click', async () => {
  await fetchJSON(`${API}/auth/logout`, { method: 'POST' });
  window.location.href = '/';
});

uploadProfileBtn?.addEventListener('click', async () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.click();
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files?.length) return;
    const formData = new FormData();
    formData.append('profile', fileInput.files[0]);
    try {
      const res = await fetch(`${API}/user/profile/picture`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      profilePictureEl.src = data.profilePath;
    } catch (error) {
      alert(error.message);
    }
  });
});

joinAffiliateBtn?.addEventListener('click', () => {
  alert('Affiliate onboarding will open soon.');
});

whatsappButton?.addEventListener('click', () => {
  if (!activeCompetition || !studentProfile) return;
  const name = studentProfile.name || 'Global Bangla participant';
  const email = studentProfile.email || '';
  const school = studentProfile.school ? ` from ${studentProfile.school}` : '';

  const message = encodeURIComponent(
    `Hi Global Bangla,\n\nI'm ${name}${school}.\nCompetition: ${activeCompetition.title}.\nRegistered email: ${email}.\nVideo link/details:`
  );

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
});

loadDashboard();
loadSiteSettings();
