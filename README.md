# Simple CRM

A lightweight CRM for tracking contacts through a sales pipeline — built with Node/Express, SQLite, and a plain HTML/JS frontend.

## Features

- Add, edit, and delete contacts (name, email, phone, company)
- Free-text notes per contact
- Pipeline status: Lead, Contacted, Won, Lost
- Search by name, email, or company
- Filter contacts by status

## Tech stack

- **Backend:** Node.js, Express, better-sqlite3
- **Frontend:** Plain HTML, CSS, and JavaScript (no build step)
- **Storage:** SQLite (`crm.db`, created automatically on first run)

## Getting started

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## API

| Method | Endpoint             | Description                          |
|--------|-----------------------|---------------------------------------|
| GET    | `/api/contacts`       | List contacts (`?status=`, `?q=`)     |
| GET    | `/api/contacts/:id`   | Get a single contact                  |
| POST   | `/api/contacts`       | Create a contact                      |
| PUT    | `/api/contacts/:id`   | Update a contact                      |
| DELETE | `/api/contacts/:id`   | Delete a contact                      |
