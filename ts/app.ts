// ============================================================
// MedClear — App State & Utilities
// ============================================================

import type { User, Medication, AppView, MedicalProfile } from './types.js';
import { getSpecialtyColor } from './types.js';

// ── App State ─────────────────────────────────────────────
export interface AppState {
  currentView: AppView;
  currentUser: User | null;
  medications: Medication[];
  selectedMed: Medication | null;
  isVisitMode: boolean;
}

export const state: AppState = {
  currentView: 'auth',
  currentUser: null,
  medications: [],
  selectedMed: null,
  isVisitMode: false,
};

// ── Navigation ────────────────────────────────────────────
export function navigateTo(view: AppView): void {
  state.currentView = view;

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Show target screen
  const target = document.getElementById(`screen-${view}`);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  // Update nav bar state
  updateNavBar(view);

  // Show/hide nav bar
  const nav = document.getElementById('bottom-nav');
  const visitBanner = document.getElementById('visit-banner');
  if (nav) {
    const noNavViews: AppView[] = ['auth', 'onboarding', 'add-success', 'visit-profile'];
    nav.style.display = noNavViews.includes(view) ? 'none' : 'flex';
  }
}

function updateNavBar(view: AppView): void {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const map: Partial<Record<AppView, string>> = {
    home: 'nav-home',
    'add-med': 'nav-add',
    visit: 'nav-visit',
    history: 'nav-history',
  };
  const activeId = map[view];
  if (activeId) {
    document.getElementById(activeId)?.classList.add('active');
  }
}

// ── Medication helpers ────────────────────────────────────
export function groupMedsBySpecialty(meds: Medication[]): Record<string, Medication[]> {
  return meds.reduce((acc, med) => {
    const key = med.specialty || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(med);
    return acc;
  }, {} as Record<string, Medication[]>);
}

export function renderMedCard(med: Medication, onClick: () => void): HTMLElement {
  const color = getSpecialtyColor(med.specialty);
  const card = document.createElement('div');
  card.className = 'med-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${med.name}, ${med.dosage}`);

  const imgHtml = med.imageUrl
    ? `<img src="${med.imageUrl}" alt="${med.name}" class="med-card-img" loading="lazy">`
    : `<div class="med-card-img-placeholder">💊</div>`;

  card.innerHTML = `
    <div class="med-card-accent" style="background:${color.accent}"></div>
    ${imgHtml}
    <div class="med-card-body">
      <div class="med-card-name">${esc(med.name)}</div>
      <div class="med-card-meta">
        <span class="med-badge">${esc(med.dosage)}</span>
        <span class="med-badge">${esc(med.frequency)}</span>
      </div>
      <div class="med-card-desc">${esc(med.explanation) || 'No description available.'}</div>
    </div>
    <div class="med-card-chevron">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  `;

  card.addEventListener('click', onClick);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onClick(); });
  return card;
}

export function renderMedList(
  container: HTMLElement,
  meds: Medication[],
  onSelect: (med: Medication) => void
): void {
  container.innerHTML = '';

  if (meds.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💊</div>
        <div class="empty-state-title">No medicines yet</div>
        <div class="empty-state-desc">Add your first medicine using the + button below.</div>
      </div>
    `;
    return;
  }

  const groups = groupMedsBySpecialty(meds);
  const colorKeys = ['#E05252','#E09A1A','#27A85C','#1A84CA','#D14F8F','#7C4DCC','#1A9CA8','#64748B'];
  let colorIdx = 0;

  for (const [specialty, specialtyMeds] of Object.entries(groups)) {
    const color = getSpecialtyColor(specialty);
    const section = document.createElement('div');
    section.className = 'specialty-section';
    section.innerHTML = `
      <div class="specialty-header">
        <div class="specialty-dot" style="background:${color.dot}"></div>
        <span class="specialty-title">${esc(specialty)}</span>
      </div>
      <div class="specialty-cards"></div>
    `;
    const cardsEl = section.querySelector('.specialty-cards') as HTMLElement;
    for (const med of specialtyMeds) {
      cardsEl.appendChild(renderMedCard(med, () => onSelect(med)));
    }
    container.appendChild(section);
    colorIdx++;
  }
}

// ── Profile header ────────────────────────────────────────
export function updateProfileHeaders(): void {
  const user = state.currentUser;
  if (!user) return;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  document.querySelectorAll('.profile-avatar').forEach(el => { el.textContent = initials; });
  document.querySelectorAll('.profile-name').forEach(el => { el.textContent = fullName; });
}

// ── Medical profile card render ───────────────────────────
export function renderMedicalProfile(container: HTMLElement, profile: MedicalProfile): void {
  const lifestyleHtml = `
    <div class="history-section">
      <div class="history-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Lifestyle
      </div>
      <div class="history-section-body flex flex-col gap-4">
        <div class="info-row">
          <div class="info-row-label">Smoking habit</div>
          <div class="info-row-value">${capitalize(profile.lifestyle.smoking)}</div>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <div class="info-row-label">Alcohol habit</div>
          <div class="info-row-value">${capitalize(profile.lifestyle.drinking)}</div>
        </div>
      </div>
    </div>
  `;

  const allergiesHtml = `
    <div class="history-section">
      <div class="history-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Allergies
      </div>
      <div class="history-section-body">
        ${profile.allergies.length > 0
          ? `<div class="flex" style="flex-wrap:wrap;gap:8px">${profile.allergies.map(a =>
              `<span class="tag-chip tag-chip-danger">${esc(a)}</span>`).join('')}</div>`
          : '<span class="text-muted text-sm">No known allergies recorded.</span>'}
      </div>
    </div>
  `;

  const surgeriesHtml = `
    <div class="history-section">
      <div class="history-section-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        Surgeries & Procedures
      </div>
      <div class="history-section-body">
        ${profile.surgeries.length > 0
          ? `<div class="flex" style="flex-wrap:wrap;gap:8px">${profile.surgeries.map(s =>
              `<span class="tag-chip tag-chip-warning">${esc(s)}</span>`).join('')}</div>`
          : '<span class="text-muted text-sm">No surgeries recorded.</span>'}
      </div>
    </div>
  `;

  container.innerHTML = lifestyleHtml + allergiesHtml + surgeriesHtml;
}

// ── Medication timeline ───────────────────────────────────
export function renderTimeline(container: HTMLElement, meds: Medication[]): void {
  const sorted = [...meds].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  if (sorted.length === 0) {
    container.innerHTML = '<span class="text-muted text-sm">No medications to display.</span>';
    return;
  }

  container.innerHTML = `
    <div class="timeline">
      ${sorted.map(med => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-date">${formatDate(med.startDate)}</div>
          <div class="timeline-name">${esc(med.name)}</div>
          <div class="timeline-dose">${esc(med.dosage)} · ${esc(med.frequency)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Tag input helper ──────────────────────────────────────
export function createTagInput(opts: {
  inputId: string;
  containerId: string;
  suggestions: string[];
  onUpdate: (tags: string[]) => void;
  placeholder?: string;
}): { getTags: () => string[]; setTags: (tags: string[]) => void } {
  const tags: string[] = [];
  const input = document.getElementById(opts.inputId) as HTMLInputElement;
  const container = document.getElementById(opts.containerId) as HTMLElement;

  // Suggestions list
  const suggestionsEl = document.createElement('ul');
  suggestionsEl.className = 'suggestions-list';
  suggestionsEl.setAttribute('role', 'listbox');
  input.parentElement?.appendChild(suggestionsEl);

  function renderTags() {
    // Remove existing chips
    container.querySelectorAll('.tag-chip').forEach(el => el.remove());
    for (const tag of tags) {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${esc(tag)} <span class="remove-tag" aria-label="Remove ${tag}">×</span>`;
      chip.querySelector('.remove-tag')?.addEventListener('click', () => {
        const idx = tags.indexOf(tag);
        if (idx > -1) { tags.splice(idx, 1); renderTags(); opts.onUpdate([...tags]); }
      });
      container.insertBefore(chip, input);
    }
  }

  function showSuggestions(query: string) {
    suggestionsEl.innerHTML = '';
    if (!query) { suggestionsEl.classList.remove('open'); return; }
    const matches = opts.suggestions.filter(s =>
      s.toLowerCase().includes(query.toLowerCase()) && !tags.includes(s)
    ).slice(0, 6);

    if (matches.length === 0) { suggestionsEl.classList.remove('open'); return; }

    for (const match of matches) {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.setAttribute('role', 'option');
      li.textContent = match;
      li.addEventListener('click', () => {
        addTag(match);
        input.value = '';
        suggestionsEl.classList.remove('open');
        input.focus();
      });
      suggestionsEl.appendChild(li);
    }
    suggestionsEl.classList.add('open');
  }

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    tags.push(trimmed);
    renderTags();
    opts.onUpdate([...tags]);
  }

  input.addEventListener('input', () => showSuggestions(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input.value);
      input.value = '';
      suggestionsEl.classList.remove('open');
    }
    if (e.key === 'Backspace' && !input.value && tags.length > 0) {
      tags.pop();
      renderTags();
      opts.onUpdate([...tags]);
    }
  });

  document.addEventListener('click', e => {
    if (!suggestionsEl.contains(e.target as Node) && e.target !== input) {
      suggestionsEl.classList.remove('open');
    }
  });

  return {
    getTags: () => [...tags],
    setTags: (newTags: string[]) => {
      tags.length = 0;
      tags.push(...newTags);
      renderTags();
    },
  };
}

// ── Utilities ─────────────────────────────────────────────
export function esc(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const existing = document.getElementById('toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position:fixed; bottom:calc(var(--nav-h) + 16px); left:50%;
    transform:translateX(-50%);
    background:${type === 'success' ? 'var(--green)' : 'var(--red)'};
    color:#fff; font-family:var(--font); font-size:.9rem; font-weight:600;
    padding:12px 24px; border-radius:999px;
    box-shadow:0 4px 16px rgba(0,0,0,.2);
    z-index:500; white-space:nowrap;
    animation: fadeInUp .25s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `@keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`;
  document.head.appendChild(style);

  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}
