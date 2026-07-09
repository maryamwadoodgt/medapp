// ============================================================
// MedClear — Firebase Configuration & Service Layer
//
// SETUP STEPS (see SETUP.md for full guide):
// 1. Create a Firebase project at console.firebase.google.com
// 2. Enable Authentication (Email/Password)
// 3. Create a Firestore database
// 4. Enable Storage (for medicine photos)
// 5. Replace the config object below with your project's config
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

import type { User, Medication, MedicalProfile } from './types.js';

// ── 🔧 REPLACE THIS WITH YOUR FIREBASE CONFIG ─────────────
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
// ──────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// ── Auth Services ──────────────────────────────────────────

export async function registerUser(opts: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}): Promise<User> {
  const { user: fbUser } = await createUserWithEmailAndPassword(auth, opts.email, opts.password);

  const newUser: User = {
    uid: fbUser.uid,
    email: opts.email,
    firstName: opts.firstName,
    lastName: opts.lastName,
    dateOfBirth: opts.dateOfBirth,
    medicalProfile: {
      allergies: [],
      surgeries: [],
      lifestyle: { smoking: 'never', drinking: 'never' },
    },
    createdAt: new Date().toISOString(),
  };

  // Store user profile in Firestore
  await setDoc(doc(db, 'users', fbUser.uid), newUser);
  return newUser;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
  const userData = await getUserProfile(fbUser.uid);
  if (!userData) throw new Error('User profile not found');
  return userData;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── User Profile ───────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function updateMedicalProfile(uid: string, profile: MedicalProfile): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { medicalProfile: profile });
}

// ── Medications ────────────────────────────────────────────

export async function addMedication(med: Omit<Medication, 'id' | 'createdAt'>): Promise<Medication> {
  const docRef = await addDoc(collection(db, 'medications'), {
    ...med,
    createdAt: serverTimestamp(),
  });
  return { ...med, id: docRef.id, createdAt: new Date().toISOString() };
}

export async function getUserMedications(uid: string): Promise<Medication[]> {
  const q = query(
    collection(db, 'medications'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Medication));
}

export async function deleteMedication(medId: string): Promise<void> {
  await deleteDoc(doc(db, 'medications', medId));
}

// ── Image Upload ───────────────────────────────────────────

export async function uploadMedImage(uid: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `med-images/${uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ── Gemini API proxy call (via your backend) ───────────────
// NOTE: Call YOUR backend endpoint, not Gemini directly.
// The backend holds the API key. See SETUP.md for server code.

export async function getMedExplanation(medName: string): Promise<{ explanation: string; commonUse: string }> {
  try {
    const res = await fetch('/api/explain-medication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medName }),
    });
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch {
    return {
      explanation: 'A medication prescribed by your doctor to help manage your health.',
      commonUse: 'General',
    };
  }
}
