import { reactive } from 'vue';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'https://saidomar.alwaysdata.net';

export const SALLES = [
  { id_salle: 1, nom: 'Salle A - Musculation', capacite: 25, icon: '🏋️', color: '#C6FF00' },
  { id_salle: 2, nom: 'Salle B - Cardio', capacite: 30, icon: '⚡', color: '#38BDF8' },
  { id_salle: 3, nom: 'Salle C - Yoga', capacite: 15, icon: '🧘', color: '#A78BFA' },
  { id_salle: 4, nom: 'Salle D - CrossFit', capacite: 20, icon: '🔥', color: '#F97316' }
];

export const DEMO_ACCOUNTS = [
  {
    label: 'Admin Principal',
    role: 'ADMIN',
    email: 'admin@fitness.com',
    password: 'password123',
    badgeColor: '#F43F5E',
    desc: 'Gestion complète : adhérents, coachs, séances, abonnements et comptes'
  },
  {
    label: 'Coach Pierre (Musculation)',
    role: 'COACH',
    email: 'coach.pierre@email.com',
    password: 'password123',
    badgeColor: '#38BDF8',
    desc: 'Création de séances, consultation des adhérents, pointage des présences & profil'
  },
  {
    label: 'Coach Sophie (Yoga)',
    role: 'COACH',
    email: 'coach.sophie@email.com',
    password: 'password123',
    badgeColor: '#38BDF8',
    desc: 'Création de séances, consultation des adhérents, pointage des présences & profil'
  },
  {
    label: 'Jean Dupont (Adhérent)',
    role: 'ADHERENT',
    email: 'jean.dupont@email.com',
    password: 'password123',
    badgeColor: '#C6FF00',
    desc: 'Réservation & annulation de séances, suivi IMC/poids et modification de son profil'
  },
  {
    label: 'Marie Martin (Adhérente)',
    role: 'ADHERENT',
    email: 'marie.martin@email.com',
    password: 'password123',
    badgeColor: '#C6FF00',
    desc: 'Réservation & annulation de séances, suivi IMC/poids et modification de son profil'
  }
];

export const DROITS_PAR_ROLE = {
  ADHERENT: [
    'voir_seances',
    'inscription_seance',
    'annuler_inscription',
    'voir_profil',
    'modifier_profil'
  ],
  COACH: [
    'voir_seances',
    'creer_seance',
    'modifier_seance',
    'supprimer_seance',
    'voir_adherents',
    'voir_profil',
    'modifier_profil',
    'enregistrer_presence'
  ],
  ADMIN: [
    'voir_seances',
    'creer_seance',
    'modifier_seance',
    'supprimer_seance',
    'voir_adherents',
    'creer_adherent',
    'modifier_adherent',
    'supprimer_adherent',
    'voir_coachs',
    'creer_coach',
    'modifier_coach',
    'supprimer_coach',
    'gerer_abonnements',
    'gerer_comptes',
    'enregistrer_presence'
  ]
};

export function decodeJwt(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const savedToken = localStorage.getItem('fitness_jwt') || '';
const savedEmail = localStorage.getItem('fitness_email') || '';
const savedApiUrl = localStorage.getItem('fitness_api_url') || DEFAULT_API_URL;
const decodedInitial = decodeJwt(savedToken);

export const appState = reactive({
  apiUrl: savedApiUrl.replace(/\/+$/, ''),
  token: savedToken,
  userEmail: savedEmail,
  user: decodedInitial
    ? { id_compte: Number(decodedInitial.sub), role: decodedInitial.role, exp: decodedInitial.exp }
    : null,
  myProfile: null,
  apiStatus: {
    online: false,
    checking: false,
    latencyMs: null,
    message: ''
  }
});

export function setApiUrl(newUrl) {
  const cleaned = (newUrl || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  appState.apiUrl = cleaned;
  localStorage.setItem('fitness_api_url', cleaned);
}

export function setSession(token, email = '') {
  appState.token = token || '';
  appState.userEmail = email || '';
  if (token) {
    localStorage.setItem('fitness_jwt', token);
    if (email) localStorage.setItem('fitness_email', email);
    const payload = decodeJwt(token);
    appState.user = payload
      ? { id_compte: Number(payload.sub), role: payload.role, exp: payload.exp }
      : null;
  } else {
    localStorage.removeItem('fitness_jwt');
    localStorage.removeItem('fitness_email');
    appState.user = null;
    appState.myProfile = null;
  }
}

export function hasDroit(droit) {
  if (!appState.user?.role) return false;
  const droits = DROITS_PAR_ROLE[appState.user.role] || [];
  return droits.includes(droit);
}

async function request(path, options = {}) {
  const url = `${appState.apiUrl}${path}`;
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(appState.token ? { Authorization: `Bearer ${appState.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errMsg =
      (typeof data === 'object' && data !== null && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Erreur HTTP ${response.status}`;
    const err = new Error(errMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  async checkHealth() {
    appState.apiStatus.checking = true;
    const t0 = performance.now();
    try {
      const text = await request('/');
      const t1 = performance.now();
      appState.apiStatus.online = true;
      appState.apiStatus.latencyMs = Math.round(t1 - t0);
      appState.apiStatus.message = typeof text === 'string' ? text : 'OK';
      return true;
    } catch (err) {
      appState.apiStatus.online = false;
      appState.apiStatus.latencyMs = null;
      appState.apiStatus.message = err.message;
      return false;
    } finally {
      appState.apiStatus.checking = false;
    }
  },

  // AUTH
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    const token = res.data || res.token;
    setSession(token, email);
    return res;
  },

  async register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: payload
    });
  },

  async createCompteAdherent(id_adherent, payload) {
    return request(`/auth/register/adherent/${id_adherent}`, {
      method: 'POST',
      body: payload
    });
  },

  async createCompteCoach(id_coach, payload) {
    return request(`/auth/register/coach/${id_coach}`, {
      method: 'POST',
      body: payload
    });
  },

  // COACHS
  async getCoachs() {
    return request('/coachs');
  },

  async getCoachById(id) {
    return request(`/coachs/${id}`);
  },

  async getMyCoachProfile() {
    return request('/coachs/me');
  },

  async updateMyCoachProfile(payload) {
    return request('/coachs/me', {
      method: 'PUT',
      body: payload
    });
  },

  async createCoach(payload) {
    return request('/coachs', {
      method: 'POST',
      body: payload
    });
  },

  async updateCoach(id, payload) {
    return request(`/coachs/${id}`, {
      method: 'PUT',
      body: payload
    });
  },

  async deleteCoach(id) {
    return request(`/coachs/${id}`, {
      method: 'DELETE'
    });
  },

  // ADHERENTS
  async getAdherents() {
    return request('/adherents');
  },

  async getAdherentById(id) {
    return request(`/adherents/${id}`);
  },

  async getMyAdherentProfile() {
    return request('/adherents/me');
  },

  async updateMyAdherentProfile(payload) {
    return request('/adherents/me', {
      method: 'PUT',
      body: payload
    });
  },

  async createAdherent(payload) {
    return request('/adherents', {
      method: 'POST',
      body: payload
    });
  },

  async updateAdherent(id, payload) {
    return request(`/adherents/${id}`, {
      method: 'PUT',
      body: payload
    });
  },

  async deleteAdherent(id) {
    return request(`/adherents/${id}`, {
      method: 'DELETE'
    });
  },

  // SEANCES
  async getSeances() {
    return request('/seances');
  },

  async createSeance(payload) {
    return request('/seances', {
      method: 'POST',
      body: payload
    });
  },

  // ABONNEMENTS
  async getAbonnements() {
    return request('/abonnements');
  },

  async createAbonnement(payload) {
    return request('/abonnements', {
      method: 'POST',
      body: payload
    });
  },

  // PARTICIPATIONS
  async getParticipation(id_adherent, id_seance) {
    return request(`/participations/${id_adherent}/${id_seance}`);
  },

  async inscrireSeance(id_seance) {
    return request('/participations', {
      method: 'POST',
      body: { id_seance: Number(id_seance) }
    });
  },

  async annulerParticipation(id_adherent, id_seance) {
    return request(`/participations/${id_adherent}/${id_seance}`, {
      method: 'DELETE'
    });
  },

  async enregistrerPresence(id_adherent, id_seance) {
    return request(`/participations/${id_adherent}/${id_seance}`, {
      method: 'PUT'
    });
  }
};
