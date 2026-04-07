🏠 Family Hub
===

Private space for your family.

---

## Description

A web application for managing family affairs together. Calendar, fridge, shopping lists, and chat — all in one place.

---

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Supabase Setup](#supabase-setup)
- [Project Structure](#project-structure)

---

## Features

### 🗓️ Calendar
Shared calendar for events: birthdays, trips, reminders.

### 🧊 Fridge
Track groceries. Categories, quantity, status — at home or need to buy.

### 📝 Lists
Shared shopping lists. Mark purchased items, add new ones.

### 💬 Chat
Chat with your family without leaving the app. Discuss tasks and daily routines.

---

## Tech Stack

- React 18 + TypeScript
- Supabase (PostgreSQL)
- Vite
- Netlify
- PWA

---

## Getting Started

```bash
git clone https://github.com/fonarevw/family-hub.git
cd family-hub
npm install
cp .env.example .env
```

Configure `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

---

## Supabase Setup

1. Create a project at supabase.com
2. SQL Editor — run queries from `SUPABASE_SETUP.md`
3. Copy keys to `.env`

---

## Project Structure

```
src/
├── components/     # UI components
├── pages/         # App pages
├── hooks/         # React hooks
└── lib/           # Supabase client

public/            # Static files
```

---

## License

MIT
