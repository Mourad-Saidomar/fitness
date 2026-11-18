<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import {
  api,
  appState,
  setSession,
  hasDroit,
  SALLES,
  DEMO_ACCOUNTS
} from './services/api';

// Navigation
const activeView = ref('planning'); // planning | mes-cours | coachs | abonnements | membres | compte

// Data
const seances = ref([]);
const coachs = ref([]);
const abonnements = ref([]);
const adherents = ref([]);
const myParticipations = reactive({});
const loading = ref(false);

// Filters
const selectedSalle = ref(0);
const selectedCoach = ref(0);
const memberSearch = ref('');
const memberPlanFilter = ref('');

// Notifications
const toasts = ref([]);
function notify(message, type = 'success') {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4000);
}

// Auth Modal
const showAuthModal = ref(false);
const authTab = ref('login'); // login | register
const submittingAuth = ref(false);

const loginForm = reactive({
  email: '',
  password: ''
});

const registerForm = reactive({
  prenom: '',
  nom: '',
  email: '',
  password: '',
  date_naissance: '1996-05-15',
  sexe: 'M',
  telephone: '',
  adresse: '',
  id_abonnement: 2,
  poids: 72,
  taille_cm: 175,
  imc: 23.5,
  contrat: Math.floor(2000 + Math.random() * 7900)
});

function recomputeRegisterImc() {
  const p = Number(registerForm.poids);
  const t = Number(registerForm.taille_cm) / 100;
  if (p > 0 && t > 0.5) {
    registerForm.imc = Number((p / (t * t)).toFixed(1));
  }
}

// Course / Seance Modal (Coach & Admin)
const showSeanceModal = ref(false);
const seanceForm = reactive({
  date_seance: getFutureDateStr(2),
  heure_debut: '18:00',
  heure_fin: '19:00',
  id_salle: 1,
  id_coach: 1,
  capacite_max: 25
});

function getFutureDateStr(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function onSalleChange() {
  const s = SALLES.find((item) => item.id_salle === Number(seanceForm.id_salle));
  if (s) {
    seanceForm.capacite_max = s.capacite;
  }
}

// Attendance / Appel Modal (Coach & Admin)
const showAttendanceModal = ref(false);
const currentAttendanceSeance = ref(null);
const attendanceList = ref([]);
const loadingAttendance = ref(false);

// Member Create/Edit Modal (Admin)
const showMemberModal = ref(false);
const editingMemberId = ref(null);
const memberForm = reactive({
  prenom: '',
  nom: '',
  date_naissance: '1994-04-12',
  sexe: 'M',
  telephone: '',
  adresse: '',
  id_abonnement: 2,
  poids: 70,
  imc: 22.4,
  contrat: 1020
});

// Coach Create/Edit Modal (Admin)
const showCoachModal = ref(false);
const editingCoachId = ref(null);
const coachForm = reactive({
  prenom: '',
  nom: '',
  specialite: 'Musculation',
  date_naissance: '1988-06-15',
  sexe: 'M',
  telephone: '',
  adresse: ''
});

// Activate Online Account Modal (Admin)
const showAccessModal = ref(false);
const accessTarget = reactive({
  type: 'adherent',
  id: null,
  name: '',
  email: '',
  password: 'password123'
});

// Abonnement Modal (Admin)
const showPlanModal = ref(false);
const planForm = reactive({
  nom: '',
  duree_mois: 6,
  tarif: 149.99
});

// Personal Profile Form (/adherents/me or /coachs/me)
const profileForm = reactive({
  prenom: '',
  nom: '',
  date_naissance: '',
  sexe: 'M',
  telephone: '',
  adresse: '',
  poids: 72,
  taille_cm: 175,
  imc: 23.5,
  specialite: ''
});

function recomputeProfileImc() {
  const p = Number(profileForm.poids);
  const t = Number(profileForm.taille_cm) / 100;
  if (p > 0 && t > 0.5) {
    profileForm.imc = Number((p / (t * t)).toFixed(1));
  }
}

// Business & Date Helpers
function isSessionInPast(seance) {
  if (!seance?.date_seance) return false;
  const d = new Date(seance.date_seance);
  const [h = 0, m = 0] = String(seance.heure_debut || '00:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d < new Date();
}

function formatHumanDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function toInputDate(dateStr) {
  if (!dateStr) return '1995-01-01';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return d.toISOString().split('T')[0];
}

function formatHour(timeStr) {
  if (!timeStr) return '';
  return String(timeStr).slice(0, 5).replace(':', 'h');
}

function getSalle(id_salle) {
  return (
    SALLES.find((s) => s.id_salle === Number(id_salle)) || {
      id_salle,
      nom: `Studio ${id_salle}`,
      capacite: 20,
      icon: '🏋️'
    }
  );
}

function getCoach(id_coach) {
  return coachs.value.find((c) => Number(c.id_coach) === Number(id_coach)) || null;
}

function getCoachPhoto(c) {
  if (!c) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';
  const spec = (c.specialite || '').toLowerCase();
  if (spec.includes('yoga')) {
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit&w=600&q=80';
  }
  if (spec.includes('cross')) {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit&w=600&q=80';
  }
  if (spec.includes('cardio') || spec.includes('box')) {
    return 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit&w=600&q=80';
}

function getImcStatus(imc) {
  const val = Number(imc);
  if (!val) return { text: 'Non renseigné', cls: 'pill-studio' };
  if (val < 18.5) return { text: `${val} · Insuffisance pondérale`, cls: 'pill-warn' };
  if (val < 25) return { text: `${val} · Poids d'équilibre`, cls: 'pill-ok' };
  if (val < 30) return { text: `${val} · Surpoids léger`, cls: 'pill-warn' };
  return { text: `${val} · Suivi recommandé`, cls: 'pill-danger' };
}

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Direction du Club';
  if (role === 'COACH') return 'Espace Coach';
  if (role === 'ADHERENT') return 'Membre Adhérent';
  return 'Visiteur';
}

// Computed
const filteredSeances = computed(() => {
  return [...seances.value]
    .filter((s) => {
      if (selectedSalle.value && Number(s.id_salle) !== Number(selectedSalle.value)) return false;
      if (selectedCoach.value && Number(s.id_coach) !== Number(selectedCoach.value)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date_seance) - new Date(b.date_seance));
});

const myBookedSeances = computed(() => {
  return seances.value.filter((s) => Boolean(myParticipations[s.id_seance]));
});

const filteredMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase();
  return adherents.value.filter((m) => {
    if (memberPlanFilter.value && String(m.id_abonnement) !== String(memberPlanFilter.value)) {
      return false;
    }
    if (!q) return true;
    const text = `${m.prenom} ${m.nom} ${m.adresse} ${m.telephone || ''} ${m.contrat || ''} ${m.abonnement || ''}`.toLowerCase();
    return text.includes(q);
  });
});

// Load Data
async function loadClubData() {
  loading.value = true;
  try {
    const [seancesRes, coachsRes, abosRes] = await Promise.all([
      api.getSeances().catch(() => []),
      api.getCoachs().catch(() => []),
      api.getAbonnements().catch(() => [])
    ]);
    seances.value = Array.isArray(seancesRes) ? seancesRes : [];
    coachs.value = Array.isArray(coachsRes) ? coachsRes : [];
    abonnements.value = Array.isArray(abosRes) ? abosRes : [];

    if (appState.user) {
      if (hasDroit('voir_adherents')) {
        adherents.value = await api.getAdherents().catch(() => []);
      } else {
        adherents.value = [];
      }

      if (appState.user.role === 'ADHERENT') {
        const me = await api.getMyAdherentProfile().catch(() => null);
        appState.myProfile = me;
        if (me) {
          fillProfileForm(me);
          await syncMyBookings(me.id_adherent);
        }
      } else if (appState.user.role === 'COACH') {
        const me = await api.getMyCoachProfile().catch(() => null);
        appState.myProfile = me;
        if (me) fillProfileForm(me);
      } else {
        appState.myProfile = null;
      }
    } else {
      adherents.value = [];
      appState.myProfile = null;
    }
  } finally {
    loading.value = false;
  }
}

function fillProfileForm(me) {
  profileForm.prenom = me.prenom || '';
  profileForm.nom = me.nom || '';
  profileForm.date_naissance = toInputDate(me.date_naissance);
  profileForm.sexe = me.sexe || 'M';
  profileForm.telephone = me.telephone || '';
  profileForm.adresse = me.adresse || '';
  profileForm.poids = me.poids ?? 72;
  profileForm.imc = me.imc ?? 23.0;
  profileForm.specialite = me.specialite || '';
}

async function syncMyBookings(id_adherent) {
  for (const k of Object.keys(myParticipations)) {
    delete myParticipations[k];
  }
  await Promise.all(
    seances.value.map(async (s) => {
      try {
        const res = await api.getParticipation(id_adherent, s.id_seance);
        const row = Array.isArray(res) ? res[0] : res;
        if (row && row.id_seance) {
          myParticipations[s.id_seance] = row;
        }
      } catch {
        // not booked
      }
    })
  );
}

// Actions : Auth
async function submitLogin() {
  submittingAuth.value = true;
  try {
    await api.login(loginForm.email, loginForm.password);
    showAuthModal.value = false;
    await loadClubData();
    const welcomeName = appState.myProfile?.prenom || getRoleLabel(appState.user?.role);
    notify(`Heureux de vous revoir, ${welcomeName} !`);
  } catch (err) {
    notify('Email ou mot de passe incorrect.', 'error');
  } finally {
    submittingAuth.value = false;
  }
}

async function loginWithDemo(acc) {
  loginForm.email = acc.email;
  loginForm.password = acc.password;
  await submitLogin();
}

async function submitRegister() {
  submittingAuth.value = true;
  try {
    await api.register({
      email: registerForm.email,
      password: registerForm.password,
      nom: registerForm.nom,
      prenom: registerForm.prenom,
      date_naissance: registerForm.date_naissance,
      adresse: registerForm.adresse,
      telephone: registerForm.telephone || null,
      sexe: registerForm.sexe,
      id_abonnement: Number(registerForm.id_abonnement) || null,
      poids: Number(registerForm.poids) || null,
      imc: Number(registerForm.imc) || null,
      contrat: Number(registerForm.contrat) || null
    });
    await api.login(registerForm.email, registerForm.password);
    showAuthModal.value = false;
    await loadClubData();
    activeView.value = 'mes-cours';
    notify(`Bienvenue au club, ${registerForm.prenom} ! Votre adhésion est active.`);
  } catch (err) {
    notify(err.message || "Impossible de finaliser l'inscription.", 'error');
  } finally {
    submittingAuth.value = false;
  }
}

function logout() {
  setSession('', '');
  for (const k of Object.keys(myParticipations)) {
    delete myParticipations[k];
  }
  activeView.value = 'planning';
  notify('Vous êtes déconnecté.');
  loadClubData();
}

// Actions : Bookings (Adhérent)
async function bookSeance(seance) {
  if (!appState.user) {
    authTab.value = 'login';
    showAuthModal.value = true;
    return;
  }
  try {
    await api.inscrireSeance(seance.id_seance);
    notify(`Votre place est réservée pour le cours du ${formatShortDate(seance.date_seance)} !`);
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function cancelBooking(seance) {
  if (!appState.myProfile?.id_adherent) return;
  try {
    await api.annulerParticipation(appState.myProfile.id_adherent, seance.id_seance);
    notify('Votre réservation a été annulée.');
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

// Actions : Course Scheduling & Attendance (Coach & Admin)
function openScheduleModal() {
  seanceForm.date_seance = getFutureDateStr(2);
  seanceForm.heure_debut = '18:00';
  seanceForm.heure_fin = '19:00';
  seanceForm.id_salle = 1;
  seanceForm.capacite_max = 25;
  if (appState.user?.role === 'COACH' && appState.myProfile?.id_coach) {
    seanceForm.id_coach = appState.myProfile.id_coach;
  } else {
    seanceForm.id_coach = coachs.value[0]?.id_coach || 1;
  }
  showSeanceModal.value = true;
}

async function submitNewSeance() {
  try {
    const toTimeWithSec = (t) => (t.length === 5 ? `${t}:00` : t);
    const cap = Number(seanceForm.capacite_max);
    await api.createSeance({
      date_seance: seanceForm.date_seance,
      heure_debut: toTimeWithSec(seanceForm.heure_debut),
      heure_fin: toTimeWithSec(seanceForm.heure_fin),
      id_salle: Number(seanceForm.id_salle),
      id_coach: Number(seanceForm.id_coach),
      capacite_max: cap,
      places_restantes: cap
    });
    showSeanceModal.value = false;
    notify('Le cours a été ajouté au planning du club.');
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function openAttendanceSheet(seance) {
  currentAttendanceSeance.value = seance;
  showAttendanceModal.value = true;
  loadingAttendance.value = true;
  attendanceList.value = [];
  try {
    if (adherents.value.length === 0 && hasDroit('voir_adherents')) {
      adherents.value = await api.getAdherents().catch(() => []);
    }
    const enrolled = [];
    await Promise.all(
      adherents.value.map(async (member) => {
        try {
          const res = await api.getParticipation(member.id_adherent, seance.id_seance);
          const row = Array.isArray(res) ? res[0] : res;
          if (row && row.id_seance) {
            enrolled.push({
              ...member,
              present: Number(row.present) === 1
            });
          }
        } catch {
          // not enrolled
        }
      })
    );
    attendanceList.value = enrolled;
  } finally {
    loadingAttendance.value = false;
  }
}

async function markMemberPresent(member) {
  if (!currentAttendanceSeance.value) return;
  try {
    await api.enregistrerPresence(member.id_adherent, currentAttendanceSeance.value.id_seance);
    member.present = true;
    notify(`Présence validée pour ${member.prenom} ${member.nom}.`);
  } catch (err) {
    notify(err.message, 'error');
  }
}

// Actions : Members Management (Admin)
function openAddMemberModal() {
  editingMemberId.value = null;
  memberForm.prenom = '';
  memberForm.nom = '';
  memberForm.date_naissance = '1995-03-20';
  memberForm.sexe = 'M';
  memberForm.telephone = '';
  memberForm.adresse = '';
  memberForm.id_abonnement = abonnements.value[0]?.id_abonnement || 1;
  memberForm.poids = 70;
  memberForm.imc = 22.5;
  memberForm.contrat = Math.floor(1010 + Math.random() * 890);
  showMemberModal.value = true;
}

function openEditMemberModal(m) {
  editingMemberId.value = m.id_adherent;
  memberForm.prenom = m.prenom || '';
  memberForm.nom = m.nom || '';
  memberForm.date_naissance = toInputDate(m.date_naissance);
  memberForm.sexe = m.sexe || 'M';
  memberForm.telephone = m.telephone || '';
  memberForm.adresse = m.adresse || '';
  memberForm.id_abonnement = m.id_abonnement || 1;
  memberForm.poids = m.poids ?? 70;
  memberForm.imc = m.imc ?? 22.0;
  memberForm.contrat = m.contrat ?? 1001;
  showMemberModal.value = true;
}

async function submitMemberForm() {
  try {
    const payload = {
      prenom: memberForm.prenom,
      nom: memberForm.nom,
      date_naissance: memberForm.date_naissance,
      sexe: memberForm.sexe,
      telephone: memberForm.telephone || null,
      adresse: memberForm.adresse,
      id_abonnement: Number(memberForm.id_abonnement) || null,
      poids: Number(memberForm.poids) || null,
      imc: Number(memberForm.imc) || null,
      contrat: Number(memberForm.contrat) || null
    };
    if (editingMemberId.value) {
      await api.updateAdherent(editingMemberId.value, payload);
      notify('La fiche membre a été mise à jour.');
    } else {
      await api.createAdherent(payload);
      notify('Le nouveau membre a été inscrit au club.');
    }
    showMemberModal.value = false;
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function removeMember(m) {
  if (!confirm(`Voulez-vous vraiment résilier et supprimer la fiche de ${m.prenom} ${m.nom} ?`)) return;
  try {
    await api.deleteAdherent(m.id_adherent);
    notify(`Fiche de ${m.prenom} ${m.nom} supprimée.`);
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

// Actions : Coachs Management (Admin)
function openAddCoachModal() {
  editingCoachId.value = null;
  coachForm.prenom = '';
  coachForm.nom = '';
  coachForm.specialite = 'Musculation';
  coachForm.date_naissance = '1988-05-10';
  coachForm.sexe = 'M';
  coachForm.telephone = '';
  coachForm.adresse = '';
  showCoachModal.value = true;
}

function openEditCoachModal(c) {
  editingCoachId.value = c.id_coach;
  coachForm.prenom = c.prenom || '';
  coachForm.nom = c.nom || '';
  coachForm.specialite = c.specialite || 'Musculation';
  coachForm.date_naissance = toInputDate(c.date_naissance);
  coachForm.sexe = c.sexe || 'M';
  coachForm.telephone = c.telephone || '';
  coachForm.adresse = c.adresse || '';
  showCoachModal.value = true;
}

async function submitCoachForm() {
  try {
    const payload = {
      prenom: coachForm.prenom,
      nom: coachForm.nom,
      specialite: coachForm.specialite,
      date_naissance: coachForm.date_naissance,
      sexe: coachForm.sexe,
      telephone: coachForm.telephone || null,
      adresse: coachForm.adresse
    };
    if (editingCoachId.value) {
      await api.updateCoach(editingCoachId.value, payload);
      notify('Profil du coach mis à jour.');
    } else {
      await api.createCoach(payload);
      notify('Nouveau coach ajouté à l’équipe.');
    }
    showCoachModal.value = false;
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

async function removeCoach(c) {
  if (!confirm(`Retirer ${c.prenom} ${c.nom} de l'équipe des coachs ?`)) return;
  try {
    await api.deleteCoach(c.id_coach);
    notify(`Coach ${c.prenom} ${c.nom} retiré.`);
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

// Activate Online Login for existing Member or Coach (Admin)
function openAccessModal(type, person) {
  accessTarget.type = type;
  accessTarget.id = type === 'adherent' ? person.id_adherent : person.id_coach;
  accessTarget.name = `${person.prenom} ${person.nom}`;
  const first = (person.prenom || 'membre').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const last = (person.nom || 'club').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  accessTarget.email = `${first}.${last}@email.com`;
  accessTarget.password = 'password123';
  showAccessModal.value = true;
}

async function submitAccessModal() {
  try {
    const body = { email: accessTarget.email, password: accessTarget.password };
    if (accessTarget.type === 'adherent') {
      await api.createCompteAdherent(accessTarget.id, body);
    } else {
      await api.createCompteCoach(accessTarget.id, body);
    }
    showAccessModal.value = false;
    notify(`Accès en ligne activé pour ${accessTarget.name}.`);
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

// Create New Subscription Plan (Admin)
async function submitNewPlan() {
  try {
    await api.createAbonnement({
      nom: planForm.nom,
      duree_mois: Number(planForm.duree_mois),
      tarif: Number(planForm.tarif)
    });
    showPlanModal.value = false;
    planForm.nom = '';
    notify("Nouvelle formule d'abonnement publiée.");
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

function selectPlanForRegistration(abo) {
  registerForm.id_abonnement = abo.id_abonnement;
  authTab.value = 'register';
  showAuthModal.value = true;
}

function filterByCoachCourses(c) {
  selectedCoach.value = c.id_coach;
  selectedSalle.value = 0;
  activeView.value = 'planning';
}

// Save Personal Profile (/adherents/me or /coachs/me)
async function saveMyProfile() {
  try {
    if (appState.user?.role === 'ADHERENT') {
      await api.updateMyAdherentProfile({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        date_naissance: profileForm.date_naissance,
        sexe: profileForm.sexe,
        telephone: profileForm.telephone,
        adresse: profileForm.adresse,
        poids: Number(profileForm.poids),
        imc: Number(profileForm.imc)
      });
      notify('Vos coordonnées et votre suivi IMC ont été enregistrés.');
    } else if (appState.user?.role === 'COACH') {
      await api.updateMyCoachProfile({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        date_naissance: profileForm.date_naissance,
        sexe: profileForm.sexe,
        telephone: profileForm.telephone,
        adresse: profileForm.adresse,
        specialite: profileForm.specialite
      });
      notify('Votre fiche coach a été mise à jour.');
    }
    await loadClubData();
  } catch (err) {
    notify(err.message, 'error');
  }
}

onMounted(() => {
  loadClubData();
});
</script>

<template>
  <div>
    <!-- ==================== HEADER ==================== -->
    <header class="site-header">
      <div class="wrap header-inner">
        <button class="brand-link" @click="activeView = 'planning'">
          <div class="brand-mark">A<span>.</span></div>
          <div style="text-align: left">
            <span class="brand-name">ALOALO FITNESS</span>
            <span class="brand-location">Club de sport & Studios encadrés</span>
          </div>
        </button>

        <nav class="main-nav" aria-label="Navigation principale">
          <button
            class="nav-item"
            :class="{ active: activeView === 'planning' }"
            @click="activeView = 'planning'"
          >
            Planning des cours
          </button>

          <button
            v-if="appState.user?.role === 'ADHERENT'"
            class="nav-item"
            :class="{ active: activeView === 'mes-cours' }"
            @click="activeView = 'mes-cours'"
          >
            Mes réservations ({{ myBookedSeances.length }})
          </button>

          <button
            class="nav-item"
            :class="{ active: activeView === 'coachs' }"
            @click="activeView = 'coachs'"
          >
            Nos coachs
          </button>

          <button
            class="nav-item"
            :class="{ active: activeView === 'abonnements' }"
            @click="activeView = 'abonnements'"
          >
            Abonnements
          </button>

          <button
            v-if="hasDroit('voir_adherents')"
            class="nav-item"
            :class="{ active: activeView === 'membres' }"
            @click="activeView = 'membres'"
          >
            {{ appState.user?.role === 'ADMIN' ? 'Gestion des membres' : 'Annuaire membres' }}
          </button>

          <button
            v-if="appState.user && (appState.user.role === 'ADHERENT' || appState.user.role === 'COACH')"
            class="nav-item"
            :class="{ active: activeView === 'compte' }"
            @click="activeView = 'compte'"
          >
            Mon profil
          </button>
        </nav>

        <div class="header-user">
          <template v-if="appState.user">
            <div class="user-chip">
              <span class="role-dot"></span>
              <span>
                {{ appState.myProfile ? `${appState.myProfile.prenom} ${appState.myProfile.nom}` : getRoleLabel(appState.user.role) }}
              </span>
            </div>
            <button class="btn btn-outline btn-sm" @click="authTab = 'login'; showAuthModal = true">
              Changer de compte
            </button>
            <button class="btn btn-outline btn-sm" @click="logout">
              Déconnexion
            </button>
          </template>
          <template v-else>
            <button class="btn btn-outline btn-sm" @click="authTab = 'login'; showAuthModal = true">
              Se connecter
            </button>
            <button class="btn btn-primary btn-sm" @click="authTab = 'register'; showAuthModal = true">
              S'inscrire au club
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- ==================== HERO (ON PLANNING VIEW) ==================== -->
    <section v-if="activeView === 'planning'" class="hero-section">
      <div class="wrap">
        <div class="hero-card">
          <div class="hero-copy">
            <div>
              <div class="hero-eyebrow">
                <span>●</span> 4 studios spécialisés · Groupes de 15 à 30 personnes
              </div>
              <h1 class="hero-h1">
                Réservez vos séances encadrées par nos coachs certifiés.
              </h1>
              <p class="hero-lead">
                Musculation, Cardio-training, Yoga et CrossFit. Choisissez votre créneau, suivez votre évolution corporelle et entraînez-vous à votre rythme.
              </p>
            </div>

            <div class="hero-actions">
              <a href="#calendrier-cours" class="btn btn-primary">
                Réserver un cours
              </a>
              <button
                v-if="!appState.user"
                class="btn btn-ghost-light"
                @click="authTab = 'register'; showAuthModal = true"
              >
                Découvrir nos formules dès 29,99 €
              </button>
              <button
                v-if="hasDroit('creer_seance')"
                class="btn btn-ghost-light"
                @click="openScheduleModal"
              >
                + Programmer un nouveau cours
              </button>
            </div>

            <div class="hero-facts">
              <div>
                <div class="hero-fact-num">{{ seances.length }}</div>
                <div class="hero-fact-label">Séances au planning</div>
              </div>
              <div>
                <div class="hero-fact-num">{{ coachs.length }}</div>
                <div class="hero-fact-label">Coachs diplômés</div>
              </div>
              <div>
                <div class="hero-fact-num">4</div>
                <div class="hero-fact-label">Studios équipés</div>
              </div>
            </div>
          </div>

          <div class="hero-media">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80"
              alt="Salle d'entraînement Aloalo Fitness"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== VIEW 1 : PLANNING DES COURS ==================== -->
    <main class="wrap section-block" id="calendrier-cours">
      <template v-if="activeView === 'planning'">
        <div class="section-head">
          <div>
            <h2 class="section-title">Planning des séances collectives</h2>
            <p class="section-subtitle">
              Filtrez par studio ou par coach et réservez votre place en temps réel.
            </p>
          </div>
          <button
            v-if="hasDroit('creer_seance')"
            class="btn btn-dark"
            @click="openScheduleModal"
          >
            + Programmer un cours
          </button>
        </div>

        <!-- STUDIO & COACH FILTERS -->
        <div class="toolbar-filters">
          <div class="studio-pills">
            <button
              class="studio-pill"
              :class="{ active: selectedSalle === 0 }"
              @click="selectedSalle = 0"
            >
              Tous les studios
            </button>
            <button
              v-for="s in SALLES"
              :key="s.id_salle"
              class="studio-pill"
              :class="{ active: Number(selectedSalle) === s.id_salle }"
              @click="selectedSalle = s.id_salle"
            >
              {{ s.icon }} {{ s.nom }}
            </button>
          </div>

          <div style="margin-left: auto; display: flex; align-items: center; gap: 10px">
            <select v-model="selectedCoach" class="field-select" style="min-height: 38px; padding: 6px 12px">
              <option :value="0">Tous les coachs</option>
              <option v-for="c in coachs" :key="c.id_coach" :value="c.id_coach">
                {{ c.prenom }} {{ c.nom }} ({{ c.specialite }})
              </option>
            </select>
            <button
              v-if="selectedSalle !== 0 || selectedCoach !== 0"
              class="btn btn-outline btn-sm"
              @click="selectedSalle = 0; selectedCoach = 0"
            >
              Tout afficher
            </button>
          </div>
        </div>

        <!-- SEANCES GRID -->
        <div class="cards-grid">
          <article
            v-for="s in filteredSeances"
            :key="s.id_seance"
            class="surface-card interactive"
          >
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 14px">
                <span class="pill pill-studio">
                  {{ getSalle(s.id_salle).icon }} {{ getSalle(s.id_salle).nom }}
                </span>

                <span v-if="myParticipations[s.id_seance]" class="pill pill-ok">
                  ✓ Vous êtes inscrit
                </span>
                <span v-else-if="isSessionInPast(s)" class="pill pill-warn">
                  Séance passée
                </span>
                <span v-else-if="s.places_restantes <= 3 && s.places_restantes > 0" class="pill pill-warn">
                  Plus que {{ s.places_restantes }} place(s)
                </span>
                <span v-else-if="s.places_restantes <= 0" class="pill pill-danger">
                  Complet
                </span>
                <span v-else class="pill pill-ok">
                  Ouvert aux réservations
                </span>
              </div>

              <h3 style="font-size: 19px; font-weight: 800; text-transform: capitalize; margin-bottom: 4px">
                {{ formatHumanDate(s.date_seance) }}
              </h3>

              <div style="font-size: 15px; font-weight: 700; color: var(--accent-brand); margin-bottom: 14px">
                De {{ formatHour(s.heure_debut) }} à {{ formatHour(s.heure_fin) }}
              </div>

              <div
                v-if="getCoach(s.id_coach)"
                style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-page); border-radius: var(--radius-sm); margin-bottom: 16px"
              >
                <div
                  style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-dark); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px"
                >
                  {{ getCoach(s.id_coach).prenom[0] }}{{ getCoach(s.id_coach).nom[0] }}
                </div>
                <div>
                  <div style="font-size: 13.5px; font-weight: 700">
                    Coach {{ getCoach(s.id_coach).prenom }} {{ getCoach(s.id_coach).nom }}
                  </div>
                  <div style="font-size: 12px; color: var(--ink-muted)">
                    Spécialité {{ getCoach(s.id_coach).specialite }}
                  </div>
                </div>
              </div>

              <!-- SPOTS GAUGE -->
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px">
                <span style="color: var(--ink-secondary)">Disponibilité du cours</span>
                <strong>{{ s.places_restantes }} place(s) libre(s) sur {{ s.capacite_max }}</strong>
              </div>
              <div class="spots-bar">
                <div
                  class="spots-fill"
                  :style="{
                    width: `${Math.min(100, Math.round(((s.capacite_max - s.places_restantes) / s.capacite_max) * 100))}%`,
                    background: s.places_restantes > 3 ? 'var(--status-ok)' : 'var(--accent-brand)'
                  }"
                ></div>
              </div>
            </div>

            <!-- CARD FOOTER ACTIONS -->
            <div style="display: flex; gap: 10px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--border-light)">
              <!-- ADHERENT -->
              <template v-if="appState.user?.role === 'ADHERENT'">
                <template v-if="myParticipations[s.id_seance]">
                  <button
                    class="btn btn-danger-soft btn-sm"
                    style="width: 100%"
                    :disabled="isSessionInPast(s)"
                    @click="cancelBooking(s)"
                  >
                    {{ isSessionInPast(s) ? 'Cours déjà effectué' : 'Annuler ma réservation' }}
                  </button>
                </template>
                <button
                  v-else
                  class="btn btn-primary btn-sm"
                  style="width: 100%"
                  :disabled="s.places_restantes <= 0 || isSessionInPast(s)"
                  @click="bookSeance(s)"
                >
                  {{
                    isSessionInPast(s)
                      ? 'Créneau terminé — Choisir une date à venir'
                      : s.places_restantes > 0
                      ? 'Réserver ma place'
                      : 'Cours complet'
                  }}
                </button>
              </template>

              <!-- COACH / ADMIN -->
              <template v-else-if="hasDroit('enregistrer_presence')">
                <button
                  class="btn btn-outline btn-sm"
                  style="width: 100%"
                  @click="openAttendanceSheet(s)"
                >
                  📋 Faire l'appel / Voir les inscrits ({{ s.capacite_max - s.places_restantes }})
                </button>
              </template>

              <!-- VISITOR -->
              <template v-else>
                <button
                  class="btn btn-primary btn-sm"
                  style="width: 100%"
                  :disabled="s.places_restantes <= 0"
                  @click="bookSeance(s)"
                >
                  {{ s.places_restantes > 0 ? 'Réserver ce cours' : 'Cours complet' }}
                </button>
              </template>
            </div>
          </article>
        </div>
      </template>

      <!-- ==================== VIEW 2 : MES RESERVATIONS (ADHERENT) ==================== -->
      <template v-if="activeView === 'mes-cours'">
        <div class="section-head">
          <div>
            <h2 class="section-title">Mes réservations & suivi</h2>
            <p class="section-subtitle">
              Retrouvez tous les cours auxquels vous êtes inscrit et gérez votre planning personnel.
            </p>
          </div>
          <button class="btn btn-primary" @click="activeView = 'planning'">
            + Réserver un autre cours
          </button>
        </div>

        <div v-if="myBookedSeances.length === 0" class="surface-card" style="text-align: center; padding: 48px 24px">
          <div style="font-size: 36px; margin-bottom: 8px">🗓️</div>
          <h3 style="font-size: 19px; font-weight: 800">Vous n'avez aucune séance réservée</h3>
          <p style="color: var(--ink-secondary); max-width: 440px; margin: 6px auto 18px">
            Consultez le planning des cours collectifs pour réserver votre prochaine séance de Musculation, Cardio, Yoga ou CrossFit.
          </p>
          <div>
            <button class="btn btn-primary" @click="activeView = 'planning'">
              Voir le planning des cours
            </button>
          </div>
        </div>

        <div v-else class="cards-grid">
          <article v-for="s in myBookedSeances" :key="s.id_seance" class="surface-card">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px">
                <span class="pill pill-studio">
                  {{ getSalle(s.id_salle).icon }} {{ getSalle(s.id_salle).nom }}
                </span>
                <span
                  class="pill"
                  :class="Number(myParticipations[s.id_seance]?.present) === 1 ? 'pill-ok' : 'pill-warn'"
                >
                  {{
                    Number(myParticipations[s.id_seance]?.present) === 1
                      ? '✓ Présence validée au club'
                      : 'Réservation confirmée'
                  }}
                </span>
              </div>

              <h3 style="font-size: 19px; font-weight: 800; text-transform: capitalize">
                {{ formatHumanDate(s.date_seance) }}
              </h3>
              <div style="font-size: 15px; font-weight: 700; color: var(--accent-brand); margin: 4px 0 12px">
                De {{ formatHour(s.heure_debut) }} à {{ formatHour(s.heure_fin) }}
              </div>
              <p v-if="getCoach(s.id_coach)" style="font-size: 13.5px; color: var(--ink-secondary)">
                Coach : <strong>{{ getCoach(s.id_coach).prenom }} {{ getCoach(s.id_coach).nom }}</strong> ({{ getCoach(s.id_coach).specialite }})
              </p>
            </div>

            <button
              class="btn btn-danger-soft btn-sm"
              :disabled="isSessionInPast(s)"
              @click="cancelBooking(s)"
            >
              {{ isSessionInPast(s) ? 'Séance passée' : 'Annuler ma réservation' }}
            </button>
          </article>
        </div>
      </template>

      <!-- ==================== VIEW 3 : NOS COACHS ==================== -->
      <template v-if="activeView === 'coachs'">
        <div class="section-head">
          <div>
            <h2 class="section-title">Notre équipe de coachs</h2>
            <p class="section-subtitle">
              Des professionnels diplômés pour vous accompagner dans chaque discipline.
            </p>
          </div>
          <button
            v-if="hasDroit('creer_coach')"
            class="btn btn-dark"
            @click="openAddCoachModal"
          >
            + Recruter un coach
          </button>
        </div>

        <div class="cards-grid">
          <article v-for="c in coachs" :key="c.id_coach" class="surface-card interactive" style="padding: 0; overflow: hidden">
            <div style="height: 210px; overflow: hidden; position: relative; background: #1C1F24">
              <img
                :src="getCoachPhoto(c)"
                :alt="`Coach ${c.prenom} ${c.nom}`"
                style="width: 100%; height: 100%; object-fit: cover"
              />
              <span
                class="pill pill-studio"
                style="position: absolute; bottom: 12px; left: 14px; background: rgba(18, 20, 23, 0.85); color: #fff"
              >
                {{ c.specialite || 'Coach Sportif' }}
              </span>
            </div>

            <div style="padding: 22px; display: flex; flex-direction: column; gap: 14px; flex: 1; justify-content: space-between">
              <div>
                <h3 style="font-size: 20px; font-weight: 800">
                  {{ c.prenom }} {{ c.nom }}
                </h3>
                <p style="font-size: 13.5px; color: var(--ink-secondary); margin-top: 4px">
                  Spécialiste {{ c.specialite }} · {{ seances.filter((s) => Number(s.id_coach) === Number(c.id_coach)).length }} cours programmé(s)
                </p>

                <div style="margin-top: 12px; font-size: 13px; color: var(--ink-muted); display: flex; flex-direction: column; gap: 4px">
                  <span v-if="c.telephone">📞 {{ c.telephone }}</span>
                  <span>📍 {{ c.adresse }}</span>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px">
                <button class="btn btn-outline btn-sm" @click="filterByCoachCourses(c)">
                  Voir ses séances au planning →
                </button>

                <div
                  v-if="hasDroit('modifier_coach') || hasDroit('gerer_comptes')"
                  style="display: flex; gap: 6px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--border-light)"
                >
                  <button
                    v-if="!c.id_compte && hasDroit('gerer_comptes')"
                    class="btn btn-primary btn-sm"
                    @click="openAccessModal('coach', c)"
                  >
                    Activer son accès coach
                  </button>
                  <button
                    v-if="hasDroit('modifier_coach')"
                    class="btn btn-outline btn-sm"
                    @click="openEditCoachModal(c)"
                  >
                    Modifier
                  </button>
                  <button
                    v-if="hasDroit('supprimer_coach')"
                    class="btn btn-danger-soft btn-sm"
                    style="margin-left: auto"
                    @click="removeCoach(c)"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <!-- ==================== VIEW 4 : ABONNEMENTS ==================== -->
      <template v-if="activeView === 'abonnements'">
        <div class="section-head">
          <div>
            <h2 class="section-title">Choisissez votre formule d'adhésion</h2>
            <p class="section-subtitle">
              Toutes nos formules incluent l'accès aux 4 studios et la réservation des cours collectifs.
            </p>
          </div>
          <button
            v-if="hasDroit('gerer_abonnements')"
            class="btn btn-dark"
            @click="showPlanModal = true"
          >
            + Créer une formule
          </button>
        </div>

        <div class="cards-grid">
          <article
            v-for="abo in abonnements"
            :key="abo.id_abonnement"
            class="surface-card interactive"
            :style="abo.nom === 'Premium' ? 'border: 2px solid var(--bg-dark)' : ''"
          >
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px">
                <span class="pill" :class="abo.nom === 'Premium' ? 'pill-ok' : 'pill-studio'">
                  Engagement {{ abo.duree_mois }} mois
                </span>
                <span v-if="abo.nom === 'Premium'" style="font-size: 12px; font-weight: 800; color: var(--accent-brand)">
                  ★ Le plus avantageux
                </span>
              </div>

              <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 8px">
                Formule {{ abo.nom }}
              </h3>

              <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: -1px">
                  {{ (Number(abo.tarif) / Number(abo.duree_mois)).toFixed(2) }} €
                </span>
                <span style="color: var(--ink-secondary); font-size: 14px">/ mois</span>
              </div>

              <p style="font-size: 13px; color: var(--ink-muted); margin-bottom: 18px">
                Facturé {{ Number(abo.tarif).toFixed(2) }} € pour {{ abo.duree_mois }} mois
              </p>

              <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; color: var(--ink-secondary)">
                <li>✓ Accès libre aux studios Musculation, Cardio, Yoga & CrossFit</li>
                <li>✓ Réservation et annulation en ligne des séances</li>
                <li>✓ Bilan corporel & suivi IMC inclus</li>
              </ul>
            </div>

            <button
              class="btn"
              :class="abo.nom === 'Premium' ? 'btn-primary' : 'btn-dark'"
              @click="selectPlanForRegistration(abo)"
            >
              Choisir la formule {{ abo.nom }}
            </button>
          </article>
        </div>
      </template>

      <!-- ==================== VIEW 5 : GESTION DES MEMBRES (COACH / ADMIN) ==================== -->
      <template v-if="activeView === 'membres'">
        <div class="section-head">
          <div>
            <h2 class="section-title">Membres inscrits au club</h2>
            <p class="section-subtitle">
              Consultez les dossiers adhérents, leurs formules en cours et activez leurs accès en ligne.
            </p>
          </div>
          <button
            v-if="hasDroit('creer_adherent')"
            class="btn btn-primary"
            @click="openAddMemberModal"
          >
            + Inscrire un nouveau membre
          </button>
        </div>

        <div class="toolbar-filters">
          <input
            v-model="memberSearch"
            type="text"
            class="field-input"
            placeholder="Rechercher un membre par nom, prénom, téléphone ou N° de contrat..."
            style="flex: 1; min-width: 240px"
          />
          <select v-model="memberPlanFilter" class="field-select">
            <option value="">Toutes les formules</option>
            <option v-for="abo in abonnements" :key="abo.id_abonnement" :value="abo.id_abonnement">
              Formule {{ abo.nom }}
            </option>
          </select>
        </div>

        <div class="table-card">
          <table class="clean-table">
            <thead>
              <tr>
                <th>Contrat</th>
                <th>Membre</th>
                <th>Formule</th>
                <th>Suivi Corporel</th>
                <th>Coordonnées</th>
                <th>Accès Espace Membre</th>
                <th v-if="hasDroit('modifier_adherent')">Gestion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filteredMembers" :key="m.id_adherent">
                <td>
                  <strong>N° {{ m.contrat || m.id_adherent }}</strong>
                  <div style="font-size: 12px; color: var(--ink-muted)">
                    Inscrit le {{ formatShortDate(m.date_creation) }}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 700; font-size: 15px">{{ m.prenom }} {{ m.nom }}</div>
                  <div style="font-size: 12.5px; color: var(--ink-muted)">
                    Né(e) le {{ formatShortDate(m.date_naissance) }}
                  </div>
                </td>
                <td>
                  <span class="pill pill-studio">{{ m.abonnement || 'Sans formule' }}</span>
                </td>
                <td>
                  <div style="font-weight: 600; font-size: 13.5px">
                    {{ m.poids ? `${m.poids} kg` : '—' }}
                  </div>
                  <span class="pill" :class="getImcStatus(m.imc).cls" style="margin-top: 4px">
                    IMC {{ getImcStatus(m.imc).text }}
                  </span>
                </td>
                <td>
                  <div>{{ m.adresse }}</div>
                  <div style="font-size: 12.5px; color: var(--ink-muted)">
                    {{ m.telephone || 'Téléphone non renseigné' }}
                  </div>
                </td>
                <td>
                  <span v-if="m.id_compte" class="pill pill-ok">✓ Compte en ligne actif</span>
                  <button
                    v-else-if="hasDroit('gerer_comptes')"
                    class="btn btn-outline btn-sm"
                    @click="openAccessModal('adherent', m)"
                  >
                    Créer son accès web
                  </button>
                  <span v-else class="pill pill-studio">Non activé</span>
                </td>
                <td v-if="hasDroit('modifier_adherent')">
                  <div style="display: flex; gap: 6px">
                    <button class="btn btn-outline btn-sm" @click="openEditMemberModal(m)">
                      Modifier
                    </button>
                    <button
                      v-if="hasDroit('supprimer_adherent')"
                      class="btn btn-danger-soft btn-sm"
                      @click="removeMember(m)"
                    >
                      Résilier
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ==================== VIEW 6 : MON PROFIL PERSONNEL ==================== -->
      <template v-if="activeView === 'compte' && appState.myProfile">
        <div class="section-head">
          <div>
            <h2 class="section-title">Mon espace personnel</h2>
            <p class="section-subtitle">
              Gérez vos coordonnées personnelles et votre bilan corporel.
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px">
          <!-- LEFT : MEMBERSHIP CARD & BMI CALCULATOR -->
          <div class="surface-card">
            <div>
              <span class="pill pill-ok">{{ getRoleLabel(appState.user?.role) }}</span>
              <h3 style="font-size: 24px; font-weight: 800; margin-top: 10px">
                {{ appState.myProfile.prenom }} {{ appState.myProfile.nom }}
              </h3>
              <p style="color: var(--ink-muted); font-size: 13.5px; margin-bottom: 20px">
                Identifiant de connexion : {{ appState.userEmail }}
              </p>

              <template v-if="appState.user?.role === 'ADHERENT'">
                <div style="background: var(--bg-dark); color: #fff; padding: 20px; border-radius: var(--radius-md); margin-bottom: 20px">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; color: #94A3B8">
                    Carte Membre Aloalo Fitness
                  </div>
                  <div style="font-size: 20px; font-weight: 800; margin-top: 6px">
                    Formule {{ appState.myProfile.abonnement || 'Club' }}
                  </div>
                  <div style="font-size: 13px; color: #CBD5E1; margin-top: 4px">
                    Contrat N° {{ appState.myProfile.contrat }} · Membre depuis le {{ formatShortDate(appState.myProfile.date_creation) }}
                  </div>
                </div>

                <!-- BMI CALCULATOR -->
                <div style="background: var(--bg-page); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-light)">
                  <div style="font-weight: 800; margin-bottom: 12px">
                    ⚖️ Calculer et mettre à jour mon IMC
                  </div>
                  <div class="form-grid">
                    <div class="field">
                      <label class="field-label">Ma taille (cm)</label>
                      <input
                        v-model.number="profileForm.taille_cm"
                        type="number"
                        class="field-input"
                        @input="recomputeProfileImc"
                      />
                    </div>
                    <div class="field">
                      <label class="field-label">Mon poids actuel (kg)</label>
                      <input
                        v-model.number="profileForm.poids"
                        type="number"
                        step="0.1"
                        class="field-input"
                        @input="recomputeProfileImc"
                      />
                    </div>
                  </div>
                  <div style="margin-top: 14px; display: flex; align-items: center; justify-content: space-between">
                    <span style="font-size: 13.5px; color: var(--ink-secondary)">Indice de Masse Corporelle :</span>
                    <span class="pill" :class="getImcStatus(profileForm.imc).cls">
                      {{ getImcStatus(profileForm.imc).text }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- RIGHT : PERSONAL DETAILS FORM -->
          <form class="surface-card" @submit.prevent="saveMyProfile">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px">
                Mes coordonnées
              </h3>
              <div class="form-grid">
                <div class="field">
                  <label class="field-label">Prénom</label>
                  <input v-model="profileForm.prenom" class="field-input" required />
                </div>
                <div class="field">
                  <label class="field-label">Nom</label>
                  <input v-model="profileForm.nom" class="field-input" required />
                </div>
                <div class="field">
                  <label class="field-label">Date de naissance</label>
                  <input v-model="profileForm.date_naissance" type="date" class="field-input" required />
                </div>
                <div class="field">
                  <label class="field-label">Civilité / Sexe</label>
                  <select v-model="profileForm.sexe" class="field-select">
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div class="field" style="grid-column: 1 / -1">
                  <label class="field-label">Adresse postale</label>
                  <input v-model="profileForm.adresse" class="field-input" required />
                </div>
                <div class="field">
                  <label class="field-label">Téléphone</label>
                  <input v-model="profileForm.telephone" class="field-input" />
                </div>
                <div v-if="appState.user?.role === 'COACH'" class="field">
                  <label class="field-label">Discipline enseignée</label>
                  <input v-model="profileForm.specialite" class="field-input" />
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary">
              Enregistrer mes modifications
            </button>
          </form>
        </div>
      </template>
    </main>

    <!-- ==================== FOOTER ==================== -->
    <footer class="site-footer">
      <div class="wrap footer-inner">
        <div>
          <strong>ALOALO FITNESS CLUB</strong> — Musculation, Cardio, Yoga & CrossFit.
        </div>
        <div style="display: flex; align-items: center; gap: 12px">
          <span>Photographies : Unsplash Licence</span>
          <button
            class="btn btn-outline btn-sm"
            @click="authTab = 'login'; showAuthModal = true"
          >
            Accès rapide (Comptes de démonstration)
          </button>
        </div>
      </div>
    </footer>

    <!-- ==================== MODAL : AUTH (LOGIN & REGISTER) ==================== -->
    <div v-if="showAuthModal" class="modal-overlay" @click.self="showAuthModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <div style="display: flex; gap: 8px">
            <button
              class="btn btn-sm"
              :class="authTab === 'login' ? 'btn-dark' : 'btn-outline'"
              @click="authTab = 'login'"
            >
              Se connecter
            </button>
            <button
              class="btn btn-sm"
              :class="authTab === 'register' ? 'btn-dark' : 'btn-outline'"
              @click="authTab = 'register'"
            >
              Devenir membre
            </button>
          </div>
          <button class="btn btn-outline btn-sm" @click="showAuthModal = false">✕</button>
        </div>

        <!-- LOGIN -->
        <div v-if="authTab === 'login'">
          <form @submit.prevent="submitLogin" style="display: flex; flex-direction: column; gap: 14px">
            <div class="field">
              <label class="field-label">Adresse email</label>
              <input v-model="loginForm.email" type="email" class="field-input" placeholder="jean.dupont@email.com" required />
            </div>
            <div class="field">
              <label class="field-label">Mot de passe</label>
              <input v-model="loginForm.password" type="password" class="field-input" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="submittingAuth">
              {{ submittingAuth ? 'Connexion en cours...' : 'Accéder à mon espace' }}
            </button>
          </form>

          <!-- DISCREET DEMO SWITCHER FOR TESTING ROLES -->
          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border-light)">
            <div style="font-size: 12px; font-weight: 700; color: var(--ink-muted); margin-bottom: 10px; text-transform: uppercase">
              Comptes de démonstration (Connexion en 1 clic) :
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px">
              <div
                v-for="acc in DEMO_ACCOUNTS"
                :key="acc.email"
                style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-page); border-radius: var(--radius-sm); border: 1px solid var(--border-light)"
              >
                <div>
                  <div style="font-weight: 700; font-size: 13.5px">{{ acc.label }}</div>
                  <div style="font-size: 12px; color: var(--ink-muted)">{{ acc.desc }}</div>
                </div>
                <button class="btn btn-outline btn-sm" @click="loginWithDemo(acc)">
                  Tester
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- REGISTER -->
        <form v-else @submit.prevent="submitRegister" style="display: flex; flex-direction: column; gap: 14px">
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Prénom *</label>
              <input v-model="registerForm.prenom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Nom *</label>
              <input v-model="registerForm.nom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Email *</label>
              <input v-model="registerForm.email" type="email" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Mot de passe *</label>
              <input v-model="registerForm.password" type="password" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Date de naissance *</label>
              <input v-model="registerForm.date_naissance" type="date" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Civilité</label>
              <select v-model="registerForm.sexe" class="field-select">
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="field-label">Adresse postale *</label>
              <input v-model="registerForm.adresse" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Téléphone</label>
              <input v-model="registerForm.telephone" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Formule choisie</label>
              <select v-model="registerForm.id_abonnement" class="field-select">
                <option v-for="abo in abonnements" :key="abo.id_abonnement" :value="abo.id_abonnement">
                  {{ abo.nom }} ({{ abo.tarif }} € / {{ abo.duree_mois }} mois)
                </option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Poids (kg)</label>
              <input v-model.number="registerForm.poids" type="number" step="0.1" class="field-input" @input="recomputeRegisterImc" />
            </div>
            <div class="field">
              <label class="field-label">Taille (cm) · IMC : {{ registerForm.imc }}</label>
              <input v-model.number="registerForm.taille_cm" type="number" class="field-input" @input="recomputeRegisterImc" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="submittingAuth">
            {{ submittingAuth ? 'Validation...' : 'Valider mon adhésion' }}
          </button>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL : SCHEDULE COURSE (COACH / ADMIN) ==================== -->
    <div v-if="showSeanceModal" class="modal-overlay" @click.self="showSeanceModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <h3 style="font-size: 19px; font-weight: 800">Programmer un nouveau cours</h3>
          <button class="btn btn-outline btn-sm" @click="showSeanceModal = false">✕</button>
        </div>

        <form @submit.prevent="submitNewSeance" style="display: flex; flex-direction: column; gap: 14px">
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Date du cours *</label>
              <input v-model="seanceForm.date_seance" type="date" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Studio *</label>
              <select v-model="seanceForm.id_salle" class="field-select" @change="onSalleChange">
                <option v-for="s in SALLES" :key="s.id_salle" :value="s.id_salle">
                  {{ s.icon }} {{ s.nom }} ({{ s.capacite }} places)
                </option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Heure de début *</label>
              <input v-model="seanceForm.heure_debut" type="time" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Heure de fin *</label>
              <input v-model="seanceForm.heure_fin" type="time" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Coach animateur *</label>
              <select v-model="seanceForm.id_coach" class="field-select">
                <option v-for="c in coachs" :key="c.id_coach" :value="c.id_coach">
                  {{ c.prenom }} {{ c.nom }} ({{ c.specialite }})
                </option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Nombre de places (min. 5) *</label>
              <input v-model.number="seanceForm.capacite_max" type="number" min="5" class="field-input" required />
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            Publier le cours au planning
          </button>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL : ATTENDANCE SHEET (COACH / ADMIN) ==================== -->
    <div v-if="showAttendanceModal && currentAttendanceSeance" class="modal-overlay" @click.self="showAttendanceModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <div>
            <h3 style="font-size: 19px; font-weight: 800">Feuille de présence du cours</h3>
            <p style="font-size: 13px; color: var(--ink-secondary)">
              {{ formatHumanDate(currentAttendanceSeance.date_seance) }} · {{ formatHour(currentAttendanceSeance.heure_debut) }} - {{ formatHour(currentAttendanceSeance.heure_fin) }} ({{ getSalle(currentAttendanceSeance.id_salle).nom }})
            </p>
          </div>
          <button class="btn btn-outline btn-sm" @click="showAttendanceModal = false">✕</button>
        </div>

        <div v-if="loadingAttendance" style="padding: 24px; text-align: center; color: var(--ink-secondary)">
          Chargement de la liste des participants...
        </div>

        <div v-else-if="attendanceList.length === 0" style="padding: 24px; text-align: center; color: var(--ink-secondary)">
          Aucun membre n'est encore inscrit sur ce créneau.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="member in attendanceList"
            :key="member.id_adherent"
            style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-page); border-radius: var(--radius-sm); border: 1px solid var(--border-light)"
          >
            <div>
              <div style="font-weight: 700">{{ member.prenom }} {{ member.nom }}</div>
              <div style="font-size: 12px; color: var(--ink-muted)">
                Contrat N° {{ member.contrat }} · Formule {{ member.abonnement }}
              </div>
            </div>

            <span v-if="member.present" class="pill pill-ok">✓ Présent(e)</span>
            <button v-else class="btn btn-primary btn-sm" @click="markMemberPresent(member)">
              Valider la présence
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== MODAL : MEMBER CREATE / EDIT (ADMIN) ==================== -->
    <div v-if="showMemberModal" class="modal-overlay" @click.self="showMemberModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <h3 style="font-size: 19px; font-weight: 800">
            {{ editingMemberId ? 'Modifier la fiche membre' : 'Inscrire un nouveau membre' }}
          </h3>
          <button class="btn btn-outline btn-sm" @click="showMemberModal = false">✕</button>
        </div>

        <form @submit.prevent="submitMemberForm" style="display: flex; flex-direction: column; gap: 14px">
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Prénom *</label>
              <input v-model="memberForm.prenom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Nom *</label>
              <input v-model="memberForm.nom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Date de naissance *</label>
              <input v-model="memberForm.date_naissance" type="date" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Civilité</label>
              <select v-model="memberForm.sexe" class="field-select">
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="field-label">Adresse postale *</label>
              <input v-model="memberForm.adresse" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Téléphone</label>
              <input v-model="memberForm.telephone" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Formule d'abonnement</label>
              <select v-model="memberForm.id_abonnement" class="field-select">
                <option v-for="abo in abonnements" :key="abo.id_abonnement" :value="abo.id_abonnement">
                  {{ abo.nom }} ({{ abo.tarif }} €)
                </option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Poids (kg)</label>
              <input v-model.number="memberForm.poids" type="number" step="0.1" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">IMC</label>
              <input v-model.number="memberForm.imc" type="number" step="0.1" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Numéro de contrat</label>
              <input v-model.number="memberForm.contrat" type="number" class="field-input" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            Enregistrer la fiche membre
          </button>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL : COACH CREATE / EDIT (ADMIN) ==================== -->
    <div v-if="showCoachModal" class="modal-overlay" @click.self="showCoachModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <h3 style="font-size: 19px; font-weight: 800">
            {{ editingCoachId ? 'Modifier la fiche du coach' : 'Ajouter un coach à l’équipe' }}
          </h3>
          <button class="btn btn-outline btn-sm" @click="showCoachModal = false">✕</button>
        </div>

        <form @submit.prevent="submitCoachForm" style="display: flex; flex-direction: column; gap: 14px">
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Prénom *</label>
              <input v-model="coachForm.prenom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Nom *</label>
              <input v-model="coachForm.nom" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Spécialité sportive *</label>
              <input v-model="coachForm.specialite" class="field-input" placeholder="Musculation, Yoga, CrossFit..." required />
            </div>
            <div class="field">
              <label class="field-label">Date de naissance *</label>
              <input v-model="coachForm.date_naissance" type="date" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Civilité</label>
              <select v-model="coachForm.sexe" class="field-select">
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Téléphone</label>
              <input v-model="coachForm.telephone" class="field-input" />
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="field-label">Adresse postale *</label>
              <input v-model="coachForm.adresse" class="field-input" required />
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            Enregistrer le coach
          </button>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL : ACTIVATE ONLINE ACCESS (ADMIN) ==================== -->
    <div v-if="showAccessModal" class="modal-overlay" @click.self="showAccessModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <h3 style="font-size: 19px; font-weight: 800">
            Activer l'accès en ligne de {{ accessTarget.name }}
          </h3>
          <button class="btn btn-outline btn-sm" @click="showAccessModal = false">✕</button>
        </div>

        <form @submit.prevent="submitAccessModal" style="display: flex; flex-direction: column; gap: 14px">
          <p style="font-size: 13.5px; color: var(--ink-secondary)">
            Définissez l'adresse email et le mot de passe permettant à {{ accessTarget.name }} de se connecter à son espace personnel.
          </p>
          <div class="field">
            <label class="field-label">Adresse email de connexion *</label>
            <input v-model="accessTarget.email" type="email" class="field-input" required />
          </div>
          <div class="field">
            <label class="field-label">Mot de passe initial *</label>
            <input v-model="accessTarget.password" type="text" class="field-input" required />
          </div>
          <button type="submit" class="btn btn-primary">
            Créer les identifiants de connexion
          </button>
        </form>
      </div>
    </div>

    <!-- ==================== MODAL : CREATE SUBSCRIPTION PLAN (ADMIN) ==================== -->
    <div v-if="showPlanModal" class="modal-overlay" @click.self="showPlanModal = false">
      <div class="modal-box">
        <div class="modal-top">
          <h3 style="font-size: 19px; font-weight: 800">Nouvelle formule d'abonnement</h3>
          <button class="btn btn-outline btn-sm" @click="showPlanModal = false">✕</button>
        </div>

        <form @submit.prevent="submitNewPlan" style="display: flex; flex-direction: column; gap: 14px">
          <div class="field">
            <label class="field-label">Nom de la formule *</label>
            <input v-model="planForm.nom" class="field-input" placeholder="Ex: Liberté Trimestriel" required />
          </div>
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Durée d'engagement (en mois) *</label>
              <input v-model.number="planForm.duree_mois" type="number" min="1" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Tarif total (€) *</label>
              <input v-model.number="planForm.tarif" type="number" step="0.01" min="1" class="field-input" required />
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            Publier la formule
          </button>
        </form>
      </div>
    </div>

    <!-- TOAST NOTIFICATIONS -->
    <div class="toast-region">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast-card"
        :class="{ error: t.type === 'error' }"
      >
        <span>{{ t.message }}</span>
      </div>
    </div>
  </div>
</template>
