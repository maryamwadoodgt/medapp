# MedClear — Firebase & Deployment Setup Guide

## Overview of Tools

| Tool | What it does | Cost |
|------|-------------|------|
| **Firebase** | Database (Firestore) + Auth + File storage | Free up to generous limits |
| **Vercel** | Hosts your app online, connects to GitHub | Free for personal projects |
| **GitHub** | Stores your code, triggers auto-deploys | Free |
| **VS Code** | Code editor | Free |

---

## PART 1: Firebase Setup (Database + Auth + Storage)

Firebase is made by Google and handles everything your app needs on the backend.
It has Authentication built in — you do NOT need a separate auth tool.

### Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `medclear` (or any name you like)
4. Disable Google Analytics (you don't need it)
5. Click **Create project**

---

### Step 2 — Enable Email/Password Authentication

1. In the left sidebar, click **Build → Authentication**
2. Click **Get started**
3. Click **Email/Password**
4. Toggle **Enable** to ON
5. Click **Save**

That's it — Firebase now handles login and account creation for your patients.

---

### Step 3 — Create a Firestore Database

Firestore is where your medications and user profiles are stored.

1. In the sidebar, click **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (you'll set rules next)
4. Select a region close to your users (e.g. `us-east1`)
5. Click **Enable**

#### Set Firestore Security Rules

After the database is created, click the **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only access their own medications
    match /medications/{medId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

---

### Step 4 — Enable Firebase Storage (for medicine photos)

1. In the sidebar, click **Build → Storage**
2. Click **Get started**
3. Choose **Start in production mode**
4. Click **Next → Done**

#### Set Storage Rules

Click the **Rules** tab and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /med-images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

---

### Step 5 — Get your Firebase config

1. Click the gear icon (⚙️) next to "Project Overview" → **Project settings**
2. Scroll down to **Your apps**
3. Click the **</>** (Web) icon
4. Name the app `medclear-web`, click **Register app**
5. Copy the `firebaseConfig` object — it looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "medclear-abc123.firebaseapp.com",
  projectId: "medclear-abc123",
  storageBucket: "medclear-abc123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Open `ts/firebase.ts` in VS Code and paste your config values into the matching fields.

**Note:** The `apiKey` here is safe to expose in your front-end code —
it's a Firebase client key, not a secret server key. Firebase's security
rules (set above) are what actually protect your data.

---

### Step 6 — Firestore data structure

Your database will have two main collections:

```
firestore/
├── users/
│   └── {uid}/                     ← one document per user
│       ├── uid: "abc123"
│       ├── email: "jane@example.com"
│       ├── firstName: "Jane"
│       ├── lastName: "Doe"
│       ├── dateOfBirth: "1952-03-14"
│       ├── createdAt: timestamp
│       └── medicalProfile: {
│               allergies: ["Penicillin"],
│               surgeries: ["Hip replacement"],
│               lifestyle: { smoking: "never", drinking: "former" }
│           }
│
└── medications/
    └── {autoId}/                  ← one document per medication
        ├── id: "auto-generated"
        ├── userId: "abc123"       ← links to the user
        ├── name: "Lisinopril"
        ├── dosage: "10mg"
        ├── frequency: "Once daily"
        ├── startDate: "2023-06-01"
        ├── prescriber: "Dr. Chen"
        ├── specialty: "Cardiology"
        ├── notes: "Take with water"
        ├── explanation: "Helps lower blood pressure"
        ├── imageUrl: "https://storage.googleapis.com/..."
        └── createdAt: timestamp
```

---

## PART 2: Backend API for Gemini (secure AI explanations)

Your app uses Google Gemini to explain medications in plain language.
The API key **must NOT** be in your front-end code. Here's how to add a simple backend.

### Option A: Vercel Serverless Function (easiest)

Create a file at `api/explain-medication.js`:

```javascript
// api/explain-medication.js
// This runs on Vercel's servers, not in the user's browser.
// The GEMINI_API_KEY environment variable is secret.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { medName } = req.body;
  if (!medName) return res.status(400).json({ error: 'medName required' });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Explain the medication "${medName}" in simple, clear language for an older adult.
                   What is it used for? Keep it under 25 words. Be reassuring and clear.
                   Respond with JSON: { "explanation": "...", "commonUse": "..." }`
          }]
        }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  res.json(JSON.parse(text));
}
```

Then in Vercel's dashboard, add the environment variable:
- Key: `GEMINI_API_KEY`
- Value: your Gemini API key from [aistudio.google.com](https://aistudio.google.com)

---

## PART 3: GitHub Setup

### Step 1 — Install Git and VS Code

- Download VS Code: [code.visualstudio.com](https://code.visualstudio.com)
- Download Git: [git-scm.com](https://git-scm.com)

### Step 2 — Open your project

1. Open VS Code
2. File → Open Folder → select your `medclear` folder

### Step 3 — Push to GitHub

In VS Code, open the terminal (Terminal → New Terminal) and run:

```bash
git init
git add .
git commit -m "Initial MedClear app"
```

Then:
1. Go to [github.com](https://github.com) and create a new repository named `medclear`
2. Follow GitHub's instructions to push your existing code

---

## PART 4: Deploy with Vercel

Vercel takes your GitHub repo and makes it a live website automatically.
Every time you push code to GitHub, Vercel rebuilds and redeploys your app.

### Step 1 — Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign up (use your GitHub account)
2. Click **Add New → Project**
3. Import your `medclear` GitHub repository
4. Leave all settings as default
5. Click **Deploy**

Vercel will give you a URL like `https://medclear.vercel.app` — that's your live app!

### Step 2 — Add environment variables in Vercel

1. In Vercel, go to your project → **Settings → Environment Variables**
2. Add: `GEMINI_API_KEY` = your Gemini key
3. Redeploy

### Step 3 — Custom domain (optional)

In Vercel → Settings → Domains, you can add a custom domain like
`medclear-app.com` if you purchase one from a registrar like Namecheap (~$10/year).

---

## PART 5: Connecting Firebase to Your Code

Once your Firebase config is in `ts/firebase.ts`, replace the mock functions
in `index.html`'s `<script>` block with the real Firebase calls:

### Replace login:
```javascript
// Old (mock):
currentUser = MOCK_USER;

// New (Firebase):
import { loginUser } from './ts/firebase.ts';
currentUser = await loginUser(email, password);
```

### Replace registration:
```javascript
// Old (mock):
currentUser = { uid: 'new-' + Date.now(), ... };

// New (Firebase):
import { registerUser } from './ts/firebase.ts';
currentUser = await registerUser({ email, password, firstName, lastName, dateOfBirth });
```

### Replace medications:
```javascript
// Old (mock):
medications.push(newMed);

// New (Firebase):
import { addMedication, getUserMedications } from './ts/firebase.ts';
const saved = await addMedication(newMed);
medications = await getUserMedications(currentUser.uid);
```

### Enable auth persistence (auto-login):
```javascript
// In init(), uncomment and add:
import { onAuthChange, getUserProfile, getUserMedications } from './ts/firebase.ts';

onAuthChange(async (fbUser) => {
  if (fbUser) {
    currentUser = await getUserProfile(fbUser.uid);
    medications = await getUserMedications(fbUser.uid);
    updateProfileUI();
    navigate('home');
    refreshHomeAndHistory();
  } else {
    navigate('auth');
  }
});
```

---

## Summary: The full workflow once set up

1. You edit code in **VS Code**
2. You push to **GitHub**
3. **Vercel** automatically deploys the update (takes ~30 seconds)
4. Patients open the app in their browser (iOS Safari, Android Chrome, or desktop)
5. Their data is stored in **Firebase Firestore** — accessible on any device they log into
6. Photos are stored in **Firebase Storage**
7. Auth (login/logout) is handled by **Firebase Authentication**
8. AI explanations are fetched via your **Vercel serverless function**

---

## Firebase free tier limits (Spark plan)

You get these for free every month:

| Feature | Free limit |
|---------|-----------|
| Firestore reads | 50,000 / day |
| Firestore writes | 20,000 / day |
| Storage | 5 GB |
| Auth users | Unlimited |
| Hosting bandwidth | 10 GB / month |

This is more than enough for a pilot with dozens to hundreds of patients.
