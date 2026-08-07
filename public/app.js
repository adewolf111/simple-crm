const contactList = document.getElementById('contactList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const statusFilters = document.getElementById('statusFilters');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const contactForm = document.getElementById('contactForm');
const deleteBtn = document.getElementById('deleteBtn');
const newContactBtn = document.getElementById('newContactBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentStatus = '';
let currentQuery = '';
let searchDebounce = null;

async function fetchContacts() {
  const params = new URLSearchParams();
  if (currentStatus) params.set('status', currentStatus);
  if (currentQuery) params.set('q', currentQuery);
  const res = await fetch(`/api/contacts?${params.toString()}`);
  const contacts = await res.json();
  renderContacts(contacts);
}

function renderContacts(contacts) {
  contactList.innerHTML = '';
  emptyState.hidden = contacts.length > 0;

  for (const c of contacts) {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.addEventListener('click', () => openModal(c));

    const sub = [c.company, c.email].filter(Boolean).join(' · ');

    card.innerHTML = `
      <div class="contact-main">
        <div class="contact-name">${escapeHtml(c.name)}</div>
        ${sub ? `<div class="contact-sub">${escapeHtml(sub)}</div>` : ''}
      </div>
      <span class="status-badge status-${c.status}">${c.status}</span>
    `;
    contactList.appendChild(card);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openModal(contact) {
  contactForm.reset();
  if (contact) {
    modalTitle.textContent = 'Edit Contact';
    document.getElementById('contactId').value = contact.id;
    document.getElementById('fieldName').value = contact.name;
    document.getElementById('fieldEmail').value = contact.email || '';
    document.getElementById('fieldPhone').value = contact.phone || '';
    document.getElementById('fieldCompany').value = contact.company || '';
    document.getElementById('fieldStatus').value = contact.status;
    document.getElementById('fieldNotes').value = contact.notes || '';
    deleteBtn.hidden = false;
  } else {
    modalTitle.textContent = 'New Contact';
    document.getElementById('contactId').value = '';
    document.getElementById('fieldStatus').value = 'Lead';
    deleteBtn.hidden = true;
  }
  modalOverlay.hidden = false;
  document.getElementById('fieldName').focus();
}

function closeModal() {
  modalOverlay.hidden = true;
}

newContactBtn.addEventListener('click', () => openModal(null));
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('contactId').value;
  const payload = {
    name: document.getElementById('fieldName').value,
    email: document.getElementById('fieldEmail').value,
    phone: document.getElementById('fieldPhone').value,
    company: document.getElementById('fieldCompany').value,
    status: document.getElementById('fieldStatus').value,
    notes: document.getElementById('fieldNotes').value,
  };

  const url = id ? `/api/contacts/${id}` : '/api/contacts';
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Something went wrong');
    return;
  }

  closeModal();
  fetchContacts();
});

deleteBtn.addEventListener('click', async () => {
  const id = document.getElementById('contactId').value;
  if (!confirm('Delete this contact?')) return;
  await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
  closeModal();
  fetchContacts();
});

statusFilters.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  currentStatus = chip.dataset.status;
  fetchContacts();
});

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentQuery = e.target.value.trim();
    fetchContacts();
  }, 250);
});

fetchContacts();
