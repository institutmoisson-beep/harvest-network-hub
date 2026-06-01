# Phase 3 — Canal, Contrats légaux, Plans de carrière

## 1. Canal de diffusion (broadcast + DM admin)

### Base de données
- `broadcast_messages` : `id`, `sender_id`, `target_user_id` (nullable = canal général), `title`, `content`, `image_url`, `link_url`, `link_label`, `created_at`
- `broadcast_reads` : `message_id`, `user_id`, `read_at` (PK composite) — pour le point rouge "non lu"
- RLS : INSERT réservé admin ; SELECT pour tous si `target_user_id IS NULL` OR `target_user_id = auth.uid()` OR admin
- Realtime activé sur `broadcast_messages`

### RPC
- `mark_broadcast_read(_message_id)` — marque comme lu
- `count_unread_broadcasts()` — retourne nombre non lu pour badge
- `list_my_broadcasts()` — broadcasts visibles + flag `is_read`

### UI
- `/dashboard/channel` (`DashboardChannel.tsx`) : boîte canal utilisateur, liste chrono, images affichées, liens cliquables (Zoom, etc.), marque comme lu au scroll/clic
- `/admin/broadcasts` (`AdminBroadcasts.tsx`) : composer (titre, contenu, image upload, lien + label), sélecteur destinataire (canal général OU recherche utilisateur par MSN/nom), historique envoyés
- Sidebar : badge rouge sur "Canal" si `count_unread_broadcasts > 0`
- Upload images dans bucket `broadcast-media` (public, compression WebP)

## 2. Contrats légaux téléchargeables

### 3 documents PDF générés côté client (templates HTML → print/PDF)
- **Contrat d'Adhésion Communautaire** — rempli avec : nom complet, user ID, email, pack souscrit, date d'adhésion, code MSN ; signature électronique = empreinte SHA + ID + horodatage
- **Statuts de l'Organisation** — document fixe avec en-tête utilisateur
- **Règlement Intérieur** — idem

### Implémentation
- `src/utils/generateAdhesionContract.ts` — template HTML complet du contrat (5 articles + signature)
- `src/utils/generateStatutes.ts` + `src/utils/generateReglement.ts`
- Visibilité **uniquement après achat d'un pack qui active le MLM** (`profiles.is_system_active = true`)
- Nouveau bloc dans `DashboardProfile.tsx` : "📜 Documents Officiels" avec 3 cartes téléchargeables + case "J'ai lu et j'accepte" (stockée dans `profiles.contract_signed_at`)
- Migration : `profiles.contract_signed_at timestamptz nullable`

## 3. Plans de carrière dynamiques (per-user + MLM grades)

### Base de données
- `career_grades` : `id`, `name`, `description`, `min_revenue` (CA cumulé pack/commerce), `min_active_referrals`, `min_downline_size`, `weekly_bonus`, `monthly_bonus`, `display_order`, `is_active`
- `user_career_overrides` : `id`, `user_id`, `grade_id` (nullable = auto), `custom_weekly_bonus`, `custom_monthly_bonus`, `notes`, `assigned_by`, `assigned_at` — pour l'attribution manuelle d'un grade et bonus à un user
- `career_bonus_payouts` : `id`, `user_id`, `grade_id`, `amount`, `period` ('weekly'|'monthly'), `period_start`, `period_end`, `paid_at`, `paid_by` — historique

### RPC
- `admin_upsert_grade(...)` / `admin_delete_grade(_id)` — admin + career_manager
- `admin_set_user_grade(_user_id, _grade_id, _weekly, _monthly, _notes)` — override manuel
- `admin_pay_career_bonus(_user_id, _amount, _period)` — crédite le wallet + log payout
- `compute_user_grade(_user_id)` — retourne grade calculé (CA, filleuls actifs, downline) + grade actuel

### Nouveau rôle `career_manager`
- Ajout à l'enum `app_role`
- Dashboard `/staff/career` (`StaffCareer.tsx`) : liste users avec CA + filleuls actifs + downline, attribution grade/bonus, paiement ponctuel
- `/admin/career` (`AdminCareer.tsx`) : CRUD grades (nom, conditions CA/filleuls/réseau, bonus hebdo/mensuel)
- Sidebar : entrée "Plan de Carrière" pour career_manager + admin

## 4. Sécurité
- Tous nouveaux RPC `SECURITY DEFINER` avec contrôle `has_role`
- GRANT sur toutes nouvelles tables (`authenticated` lecture/insert via RPC ; `service_role` ALL)
- RLS strict : broadcasts ciblés invisibles aux autres users

## 5. Hors scope (différé)
- Calcul automatique du CA en temps réel (snapshot manuel via bouton "Recalculer" pour l'instant)
- Auto-paiement hebdo/mensuel via cron (paiement manuel par staff pour l'instant)

Confirme et je lance migrations + code.
