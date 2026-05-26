## Vue d'ensemble

Cette demande couvre 6 chantiers majeurs. Vu l'ampleur, je propose de la livrer en **3 phases** pour garder la qualité et la stabilité. Confirme la priorité avant que je commence.

---

## Phase 1 — Fondations critiques (bugs bloquants + UX wallet + réseau)

### 1.1 Correction du transfert P2P entre portefeuilles
- Créer une fonction RPC `transfer_to_user(_recipient_code, _amount, _note)` `SECURITY DEFINER` qui:
  - Verrouille les deux portefeuilles (`FOR UPDATE`) dans un ordre déterministe (anti-deadlock)
  - Débite l'émetteur, crédite le destinataire, crée **deux** lignes `wallet_transactions` (sortie + entrée) liées
  - Renvoie les nouveaux soldes pour mise à jour UI immédiate
- Brancher Supabase Realtime sur `wallets` et `wallet_transactions` pour rafraîchir automatiquement les soldes des deux côtés
- Retirer toute logique de transfert côté client qui fait deux `update` séparés

### 1.2 Portefeuille : recherche + format compact
- Barre de recherche dans l'historique (filtre par type, statut, note, montant, date)
- Format de date court (`dd/MM HH:mm`) au lieu de l'heure longue
- Tri par défaut: transactions récentes en haut, pagination/scroll

### 1.3 Réseau : arbre + liste détaillée
- Arbre généalogique strict par parrainage (déjà via `get_downline`, vérifier l'ordre G/D)
- Nouvel onglet **"Liste de mes filleuls"** avec: nom, code MSN, pays, ville, date d'inscription, statut actif, niveau
- Fonction admin/parrain `move_referral_position(_member_id, _new_parent_id, _position)` pour repositionner un filleul dans sa branche (réservé admin + parrain direct, avec vérification que la cible reste dans sa descendance)

---

## Phase 2 — Système de relais de livraison + rôles étendus

### 2.1 Points de relais
- Nouvelles tables:
  - `relay_points` (nom, type [boutique/maquis/autre], pays, ville, adresse, téléphone, responsable, actif, manager_id)
  - Ajout colonne `relay_point_id` sur `orders` et `commerce_orders`
- RLS:
  - Lecture publique des points actifs
  - Gestion par admin + Moissonneur Pays/Zone du pays concerné
- UI:
  - Dans le checkout des packs et du commerce: sélection cascade Pays → Ville → Point de relais
  - Statuts de livraison: `en_preparation` → `en_route_relais` → `disponible_au_relais` → `recupere`
  - Notification à l'utilisateur quand statut = `disponible_au_relais`

### 2.2 Nouveaux rôles + dashboards dédiés
Ajout au enum `app_role`:
- `zone_harvester`, `city_harvester`, `country_harvester`
- `emergency_admin`, `hr_manager`, `delivery_manager`
(les rôles `financier`, `pack_manager`, `partner_manager`, `communication`, `admin` existent déjà)

Nouvelle table `role_assignments` pour scoper les rôles géographiques:
- `user_id`, `role`, `country` (nullable), `city` (nullable), `assigned_by`, `assigned_at`

Dashboards créés (un par rôle, scope géographique respecté):
- `/staff/zone` — Moissonneur de Zone (multi pays/villes assignés)
- `/staff/country` — Moissonneur de Pays (users, soldes, commandes, relais, blocage)
- `/staff/city` — Moissonneur de Ville (users, commandes, urgences, blocage)
- `/staff/emergency` — Admin urgences (vue + chat, déjà partiellement présent)
- `/staff/hr` — RH (CRUD users: suspendre, bloquer, débloquer, supprimer)
- `/staff/delivery` — Livraison (commandes à livrer, relais, marquer disponible)

Interface admin `/admin/roles` pour assigner/retirer un rôle à un utilisateur avec scope pays/ville.

Actions de blocage: nouvelle valeur `account_status` `blocked`, `suspended` (déjà partiellement) + fonction RPC sécurisée qui vérifie le scope géographique du rôle.

---

## Phase 3 — Canal de diffusion administrateur

### 3.1 Tables
- `broadcast_messages` (sender_id, content, image_url, link_url, link_label, sent_at)
- `broadcast_reads` (message_id, user_id, read_at) — détecte les non-lus

### 3.2 Fonctionnalités
- Composition admin: texte + image (upload bucket `broadcast-images` avec compression auto via `imageCompression.ts` existant) + lien (Zoom, etc.)
- Boîte canal utilisateur `/dashboard/canal` : liste chronologique, message non-lu badgé
- **Point rouge** sur l'icône "Canal" dans la sidebar quand au moins un message non-lu
- Realtime sur `broadcast_messages` pour notification instantanée
- Historique complet consultable

---

## Notes techniques (résilience & scalabilité)

- Toutes les opérations financières/critiques passent par des RPC `SECURITY DEFINER` avec `FOR UPDATE` pour éviter les race conditions
- Index ajoutés sur: `wallet_transactions(user_id, created_at desc)`, `wallet_transactions(recipient_id)`, `orders(relay_point_id)`, `relay_points(country, city, is_active)`, `broadcast_reads(user_id, message_id)`
- Pagination systématique côté client (50 lignes/page) pour ne jamais charger la table entière
- Compression image automatique déjà en place — réutilisée pour le canal

---

## Question importante

Vu l'ampleur (≈ 8 nouvelles tables, ≈ 12 nouvelles pages/dashboards, ≈ 10 RPC), je recommande de **livrer Phase 1 d'abord** (corrige les bugs bloquants que tes utilisateurs voient déjà), puis Phase 2 et Phase 3 dans des messages suivants.

**Confirme stp:**
- (A) Je fais la Phase 1 maintenant, puis on enchaîne sur 2 et 3
- (B) Je fais tout d'un coup (plus long, risque d'erreurs plus élevé)
- (C) Tu veux modifier l'ordre des priorités
