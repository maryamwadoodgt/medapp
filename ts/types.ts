// ============================================================
// MedClear — TypeScript Types
// ============================================================

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  medicalProfile: MedicalProfile;
  createdAt: string;
}

export interface MedicalProfile {
  allergies: string[];
  surgeries: string[];
  lifestyle: {
    smoking: 'never' | 'former' | 'current';
    drinking: 'never' | 'former' | 'current';
  };
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  prescriber: string;
  specialty: string;
  notes: string;
  explanation: string;
  imageUrl: string;
  createdAt: string;
}

export type AppView =
  | 'auth'
  | 'onboarding'
  | 'home'
  | 'add-med'
  | 'med-detail'
  | 'add-success'
  | 'visit'
  | 'visit-profile'
  | 'history';

export type AuthTab = 'login' | 'register';
export type OnboardingStep = 'lifestyle' | 'allergies' | 'surgeries';

// ── Specialty color mapping ────────────────────────────────
export const SPECIALTY_COLORS: Record<string, { dot: string; accent: string; badge: string }> = {
  Cardiology:    { dot: '#E05252', accent: '#E05252', badge: '#FDEAEA' },
  Neurology:     { dot: '#7C4DCC', accent: '#7C4DCC', badge: '#F3EEFF' },
  Endocrinology: { dot: '#E09A1A', accent: '#E09A1A', badge: '#FEF3E2' },
  Pulmonology:   { dot: '#1A84CA', accent: '#1A84CA', badge: '#E8F4FC' },
  Rheumatology:  { dot: '#D14F8F', accent: '#D14F8F', badge: '#FDEEF7' },
  Gastro:        { dot: '#27A85C', accent: '#27A85C', badge: '#E8F7ED' },
  Allergy:       { dot: '#1A9CA8', accent: '#1A9CA8', badge: '#E4F8FA' },
  General:       { dot: '#64748B', accent: '#64748B', badge: '#F1F5F9' },
};

export function getSpecialtyColor(specialty: string) {
  return SPECIALTY_COLORS[specialty] ?? SPECIALTY_COLORS['General'];
}

// ── Suggestion data ────────────────────────────────────────
export const ALLERGY_SUGGESTIONS = [
  'Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Milk', 'Eggs',
  'Wheat / Gluten', 'Soy', 'Sesame', 'Penicillin', 'Aspirin',
  'Ibuprofen', 'Sulfa drugs', 'Latex', 'Bee stings', 'Pollen',
  'Dust mites', 'Mold', 'Pet dander', 'Nickel',
];

export const SURGERY_SUGGESTIONS = [
  'Appendectomy', 'Gallbladder removal', 'Hip replacement',
  'Knee replacement', 'Heart bypass', 'Cataract surgery',
  'Hernia repair', 'Hysterectomy', 'Spinal fusion', 'Tonsillectomy',
  'C-section', 'Colonoscopy', 'Back surgery', 'Shoulder surgery',
  'Carpal tunnel release', 'Thyroid removal',
];

export const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every morning',
  'Every evening',
  'Before bed',
  'With meals',
  'As needed',
  'Weekly',
];

export const SPECIALTY_OPTIONS = [
  'General',
  'Cardiology',
  'Neurology',
  'Endocrinology',
  'Pulmonology',
  'Rheumatology',
  'Gastro',
  'Allergy',
  'Oncology',
  'Orthopedics',
  'Urology',
  'Dermatology',
  'Psychiatry',
];
