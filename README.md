# 💸 SplitWise AI

> Smart group expense splitting — powered by Claude AI.

A full-stack Next.js app that helps friends automatically split bills during trips, hostel life, food orders, and group activities. Built for real-world daily use and polished for portfolio / internship showcasing.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Group management** | Create groups with emojis, add members, track trip/hostel/food expenses |
| **Expense tracking** | Log expenses by category, paid-by person, split type |
| **Auto-splitting** | Equal split or custom % — calculates each person's share instantly |
| **Balance calculator** | Minimum-transaction algorithm shows who owes whom |
| **AI insights** | Claude detects spending patterns & suggests savings (live API) |
| **AI financial summary** | One-click personalised report for any month |
| **Analytics dashboard** | Monthly bar chart + category donut chart via Recharts |
| **Firebase auth** | Google sign-in via Firebase Authentication |
| **Firestore** | Real-time database for groups & expenses |
| **Mobile responsive** | Works on all screen sizes |

---

## 🗂️ Project structure

```
splitwise-ai/
├── app/
│   ├── page.tsx              ← Login / landing page
│   ├── layout.tsx            ← Root layout + fonts
│   ├── globals.css           ← Design tokens + utility classes
│   ├── dashboard/page.tsx    ← Dashboard with stats & AI insights
│   ├── groups/page.tsx       ← Group list + create group
│   ├── expenses/page.tsx     ← Expense table with filters
│   ├── analytics/page.tsx    ← Charts + AI financial summary
│   └── settings/page.tsx     ← User preferences + toggles
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx      ← Wraps Sidebar + Topbar + main
│   │   ├── Sidebar.tsx       ← Navigation sidebar
│   │   └── Topbar.tsx        ← Top bar with search + CTA
│   └── ui/
│       ├── AddExpenseModal.tsx ← Add expense dialog
│       └── Toast.tsx           ← Notification toast
├── lib/
│   ├── firebase.ts           ← Firebase init
│   ├── auth-context.tsx      ← Auth provider + useAuth hook
│   ├── db.ts                 ← Firestore helpers + types
│   └── mock-data.ts          ← Demo data (works without Firebase)
└── .env.local.example        ← Firebase env template
```

---

## 🚀 Quick start

### 1. Clone & install

```bash
git clone https://github.com/yourname/splitwise-ai
cd splitwise-ai
npm install
```

### 2. Run with demo data (no Firebase needed)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click **"Try demo"** to explore.

### 3. Connect Firebase (optional — for real auth + data persistence)

1. Go to [Firebase Console](https://console.firebase.google.com) → New project
2. Enable **Authentication** → Sign-in methods → Google
3. Enable **Firestore** → Create database → Start in test mode
4. Go to Project settings → Web app → copy config
5. Copy `.env.local.example` → `.env.local` and paste your config
6. Restart `npm run dev`

---

## 🧠 AI features (Claude API)

The app calls the Anthropic API from the browser for:

- **Spending insights** (Dashboard) — 3 smart cards with emoji + tip
- **Financial summary** (Analytics) — personalised 4-5 sentence report

The API key is handled by Claude.ai's built-in proxy when used inside claude.ai artifacts. For standalone deployment, add your own key or proxy endpoint.

---

## 🔥 Firestore data model

```
groups/{groupId}
  name, emoji, description, members[], createdBy, createdAt

expenses/{expenseId}
  groupId, groupName, description, amount, category
  paidBy{uid,name,email,avatar}
  splitType, splits[{member,share}], date, createdBy
```

**Balance algorithm**: greedy minimum-transaction (O(n log n)) — finds the fewest settlements needed to zero out all debts.

---

## 🎨 Tech stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom CSS variables
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google OAuth)
- **Charts**: Recharts
- **Icons**: Tabler Icons webfont
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Fonts**: Outfit + Syne (Google Fonts)

---

## 📱 Pages

| Route | Page |
|---|---|
| `/` | Login / landing |
| `/dashboard` | Overview — stats, AI insights, recent expenses, balances |
| `/groups` | Group cards — create/view groups |
| `/expenses` | Filterable expense table |
| `/analytics` | Bar chart, donut chart, AI summary |
| `/settings` | User preferences, toggles, export |

---

## 🛠️ Extending the app

**Add a new page**: Create `app/yourpage/page.tsx`, wrap with `<AppShell title="Your page">`.

**Add a Firestore operation**: Add a function in `lib/db.ts` — all helpers follow the same pattern.

**Customise the AI prompt**: Edit the `content` string inside `fetch('https://api.anthropic.com/v1/messages', ...)` calls.

---

## 📄 License

MIT — free to use, modify, and deploy.
