-- ============================================================
-- Script SQL MariaDB - Base de données Fitness
-- Supprime l'ancienne base et en crée une nouvelle
-- correspondant au MPD (utilisateur / compte / role / droit)
-- ============================================================

-- Supprimer l'ancienne base de données si elle existe
DROP DATABASE IF EXISTS fitness;

-- Créer la nouvelle base de données
CREATE DATABASE fitness
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE fitness;

-- ============================================================
-- TABLE : role
-- Les rôles (ADHERENT, COACH, ADMIN)
-- ============================================================
CREATE TABLE role (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : droit
-- Les fonctionnalités de l'application (une seule ligne par droit)
-- ============================================================
CREATE TABLE droit (
    id_droit INT AUTO_INCREMENT PRIMARY KEY,
    fonctionnalite VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : role_droit
-- Table d'association : un rôle a plusieurs droits,
-- un droit appartient à plusieurs rôles (relation N,N)
-- Utilisée par : droitModel.js (middleware requireDroit)
-- ============================================================
CREATE TABLE role_droit (
    id_role INT NOT NULL,
    id_droit INT NOT NULL,
    PRIMARY KEY (id_role, id_droit),
    CONSTRAINT fk_role_droit_role
        FOREIGN KEY (id_role) REFERENCES role(id_role)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_role_droit_droit
        FOREIGN KEY (id_droit) REFERENCES droit(id_droit)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : compte
-- Les identifiants de connexion (un seul login pour tous les rôles)
-- Utilisée par : authModel.js (login, register)
-- ============================================================
CREATE TABLE compte (
    id_compte INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    id_role INT NOT NULL,
    CONSTRAINT fk_compte_role
        FOREIGN KEY (id_role) REFERENCES role(id_role)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : utilisateur
-- Les informations personnelles communes aux adhérents et aux coachs
-- Un utilisateur peut ne pas avoir de compte (id_compte NULL)
-- UNIQUE : un compte n'appartient qu'à un seul utilisateur
-- ============================================================
CREATE TABLE utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    sexe VARCHAR(10),
    id_compte INT DEFAULT NULL UNIQUE,
    CONSTRAINT fk_utilisateur_compte
        FOREIGN KEY (id_compte) REFERENCES compte(id_compte)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : abonnement
-- Utilisée par : abonnementModel.js
-- ============================================================
CREATE TABLE abonnement (
    id_abonnement INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    duree_mois INT NOT NULL,
    tarif DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : adherent
-- Spécialisation d'un utilisateur (informations propres à l'adhérent)
-- Utilisée par : adherentModel.js
-- ============================================================
CREATE TABLE adherent (
    id_adherent INT AUTO_INCREMENT PRIMARY KEY,
    id_abonnement INT DEFAULT NULL,
    date_creation DATE NOT NULL DEFAULT (CURRENT_DATE),
    poids DECIMAL(5,2),
    imc DECIMAL(4,2),
    contrat INT,
    id_utilisateur INT NOT NULL UNIQUE,
    CONSTRAINT fk_adherent_abonnement
        FOREIGN KEY (id_abonnement) REFERENCES abonnement(id_abonnement)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_adherent_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : coach
-- Spécialisation d'un utilisateur (informations propres au coach)
-- Utilisée par : coachModel.js
-- ============================================================
CREATE TABLE coach (
    id_coach INT AUTO_INCREMENT PRIMARY KEY,
    specialite VARCHAR(100),
    id_utilisateur INT NOT NULL UNIQUE,
    CONSTRAINT fk_coach_utilisateur
        FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : salle
-- Référencée par : seance.id_salle
-- ============================================================
CREATE TABLE salle (
    id_salle INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    capacite INT NOT NULL DEFAULT 20
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : seance
-- Utilisée par : seanceModel.js
-- ============================================================
CREATE TABLE seance (
    id_seance INT AUTO_INCREMENT PRIMARY KEY,
    date_seance DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    capacite_max INT NOT NULL DEFAULT 20,
    id_coach INT NOT NULL,
    id_salle INT NOT NULL,
    places_restantes INT NOT NULL DEFAULT 20,
    CONSTRAINT fk_seance_coach
        FOREIGN KEY (id_coach) REFERENCES coach(id_coach)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_seance_salle
        FOREIGN KEY (id_salle) REFERENCES salle(id_salle)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : participation
-- Table d'association entre adherent et seance (relation N,N)
-- Utilisée par : participationModel.js
-- ============================================================
CREATE TABLE participation (
    id_seance INT NOT NULL,
    id_adherent INT NOT NULL,
    present TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_seance, id_adherent),
    CONSTRAINT fk_participation_seance
        FOREIGN KEY (id_seance) REFERENCES seance(id_seance)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_participation_adherent
        FOREIGN KEY (id_adherent) REFERENCES adherent(id_adherent)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- DONNÉES DE TEST
-- ============================================================

-- Rôles
INSERT INTO role (nom) VALUES
('ADHERENT'),
('COACH'),
('ADMIN');

-- Droits : chaque fonctionnalité n'est écrite qu'une seule fois
INSERT INTO droit (fonctionnalite) VALUES
('voir_seances'),
('inscription_seance'),
('annuler_inscription'),
('voir_profil'),
('modifier_profil'),
('creer_seance'),
('modifier_seance'),
('supprimer_seance'),
('voir_adherents'),
('creer_adherent'),
('modifier_adherent'),
('supprimer_adherent'),
('voir_coachs'),
('creer_coach'),
('modifier_coach'),
('supprimer_coach'),
('gerer_abonnements'),
('gerer_comptes'),
('enregistrer_presence');

-- Droits de l'ADHERENT
INSERT INTO role_droit (id_role, id_droit)
SELECT r.id_role, d.id_droit
FROM role r, droit d
WHERE r.nom = 'ADHERENT'
AND d.fonctionnalite IN ('voir_seances', 'inscription_seance', 'annuler_inscription',
                         'voir_profil', 'modifier_profil');

-- Droits du COACH
INSERT INTO role_droit (id_role, id_droit)
SELECT r.id_role, d.id_droit
FROM role r, droit d
WHERE r.nom = 'COACH'
AND d.fonctionnalite IN ('voir_seances', 'creer_seance', 'modifier_seance', 'supprimer_seance',
                         'voir_adherents', 'voir_profil', 'modifier_profil', 'enregistrer_presence');

-- Droits de l'ADMIN : tous les droits sauf ceux propres à l'adhérent
INSERT INTO role_droit (id_role, id_droit)
SELECT r.id_role, d.id_droit
FROM role r, droit d
WHERE r.nom = 'ADMIN'
AND d.fonctionnalite NOT IN ('inscription_seance', 'annuler_inscription', 'voir_profil', 'modifier_profil');

-- Comptes (mot de passe : "password123")
-- Le hash correspond à bcrypt.hash("password123", 10)
-- id_role : 1=ADHERENT, 2=COACH, 3=ADMIN
INSERT INTO compte (email, password_hash, id_role) VALUES
('admin@fitness.com',      '$2b$10$Co8sdLokLqc4kKasIPy0oOQE1Lcp1GNvJsBeeQEk4vb93IkCQ.w36', 3),
('jean.dupont@email.com',  '$2b$10$Co8sdLokLqc4kKasIPy0oOQE1Lcp1GNvJsBeeQEk4vb93IkCQ.w36', 1),
('marie.martin@email.com', '$2b$10$Co8sdLokLqc4kKasIPy0oOQE1Lcp1GNvJsBeeQEk4vb93IkCQ.w36', 1),
('coach.pierre@email.com', '$2b$10$Co8sdLokLqc4kKasIPy0oOQE1Lcp1GNvJsBeeQEk4vb93IkCQ.w36', 2),
('coach.sophie@email.com', '$2b$10$Co8sdLokLqc4kKasIPy0oOQE1Lcp1GNvJsBeeQEk4vb93IkCQ.w36', 2);

-- Utilisateurs (1 à 5 : adhérents, 6 à 9 : coachs)
INSERT INTO utilisateur (nom, prenom, date_naissance, adresse, telephone, sexe, id_compte) VALUES
('Dupont',   'Jean',    '1990-05-15', '12 rue de la Paix, 75001 Paris',           '0601020304', 'M', 2),
('Martin',   'Marie',   '1985-08-22', '5 avenue des Champs, 69001 Lyon',          '0605060708', 'F', 3),
('Bernard',  'Lucas',   '2000-01-10', '8 boulevard Victor Hugo, 13001 Marseille', NULL,         'M', NULL),
('Petit',    'Emma',    '1995-11-30', '20 rue Gambetta, 31000 Toulouse',          NULL,         'F', NULL),
('Durand',   'Thomas',  '1988-03-18', '15 place Bellecour, 69002 Lyon',           NULL,         'M', NULL),
('Lefebvre', 'Pierre',  '1982-04-12', '3 rue Nationale, 59000 Lille',             '0612345678', 'M', 4),
('Moreau',   'Sophie',  '1991-07-05', '9 rue Sainte-Catherine, 33000 Bordeaux',   '0698765432', 'F', 5),
('Garcia',   'Antoine', '1987-02-20', '14 cours Mirabeau, 13100 Aix',             '0654321987', 'M', NULL),
('Roux',     'Julie',   '1993-09-14', '27 rue de Strasbourg, 44000 Nantes',       '0678901234', 'F', NULL);

-- Abonnements
INSERT INTO abonnement (nom, duree_mois, tarif) VALUES
('Basic',    1,  29.99),
('Standard', 6,  149.99),
('Premium',  12, 249.99),
('Étudiant', 3,  59.99);

-- Adhérents (id_abonnement : 1=Basic, 2=Standard, 3=Premium)
INSERT INTO adherent (id_abonnement, date_creation, poids, imc, contrat, id_utilisateur) VALUES
(3, '2026-01-10', 78.50, 24.20, 1001, 1),
(2, '2026-02-15', 62.00, 22.10, 1002, 2),
(1, '2026-03-01', 70.00, 21.60, 1003, 3),
(3, '2026-03-20', 55.40, 20.30, 1004, 4),
(2, '2026-04-05', 85.10, 26.80, 1005, 5);

-- Coachs
INSERT INTO coach (specialite, id_utilisateur) VALUES
('Musculation',   6),
('Yoga',          7),
('CrossFit',      8),
('Cardio-Boxing', 9);

-- Salles
INSERT INTO salle (nom, capacite) VALUES
('Salle A - Musculation', 25),
('Salle B - Cardio',      30),
('Salle C - Yoga',        15),
('Salle D - CrossFit',    20);

-- Séances (dates futures pour que les tests fonctionnent)
INSERT INTO seance (date_seance, heure_debut, heure_fin, capacite_max, id_coach, id_salle, places_restantes) VALUES
('2026-11-01', '09:00:00', '10:00:00', 20, 1, 1, 18),
('2026-11-01', '10:30:00', '11:30:00', 15, 2, 3, 15),
('2026-11-02', '14:00:00', '15:00:00', 25, 3, 4, 24),
('2026-11-03', '08:00:00', '09:00:00', 30, 1, 2, 30),
('2026-11-03', '17:00:00', '18:00:00', 20, 4, 1, 19);

-- Participations
INSERT INTO participation (id_seance, id_adherent, present) VALUES
(1, 1, 0),
(1, 2, 0),
(3, 1, 0),
(2, 3, 0),
(5, 4, 0);
