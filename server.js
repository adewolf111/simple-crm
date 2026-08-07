const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const VALID_STATUSES = ['Lead', 'Contacted', 'Won', 'Lost'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function serializeContact(row) {
  return row;
}

app.get('/api/contacts', (req, res) => {
  const { status, q } = req.query;
  let sql = 'SELECT * FROM contacts';
  const clauses = [];
  const params = [];

  if (status && VALID_STATUSES.includes(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (q) {
    clauses.push('(name LIKE ? OR email LIKE ? OR company LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY updated_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeContact));
});

app.get('/api/contacts/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Contact not found' });
  res.json(row);
});

app.post('/api/contacts', (req, res) => {
  const { name, email, phone, company, status, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const finalStatus = VALID_STATUSES.includes(status) ? status : 'Lead';

  const stmt = db.prepare(`
    INSERT INTO contacts (name, email, phone, company, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name.trim(), email || '', phone || '', company || '', finalStatus, notes || '');
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

app.put('/api/contacts/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const { name, email, phone, company, status, notes } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  const finalStatus = status !== undefined
    ? (VALID_STATUSES.includes(status) ? status : existing.status)
    : existing.status;

  const stmt = db.prepare(`
    UPDATE contacts
    SET name = ?, email = ?, phone = ?, company = ?, status = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    name !== undefined ? name.trim() : existing.name,
    email !== undefined ? email : existing.email,
    phone !== undefined ? phone : existing.phone,
    company !== undefined ? company : existing.company,
    finalStatus,
    notes !== undefined ? notes : existing.notes,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  res.json(row);
});

app.delete('/api/contacts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Simple CRM running at http://localhost:${PORT}`);
});
