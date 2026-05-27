## Phase 2 — Relais de livraison + rôles étendus

### 1. Base de données

**Nouveaux enums:**
- Étendre `app_role` avec: `zone_harvester`, `city_harvester`, `country_harvester`, `emergency_admin`, `hr_manager`, `delivery_manager`
- Étendre `account_status` avec: `blocked` (suspended existe déjà)
- Nouveau enum `delivery_status`: `en_preparation`, `en_route_relais`, `disponible_au_relais`, `recupere`

**Nouvelles tables:**

`relay_points` — nom, type (boutique/maquis/autre), pays, ville, adresse, téléphone, responsable, manager_id (uuid nullable), is_active
- RLS: lecture publique des actifs ; admin + country_harvester du pays peuvent gérer

`role_assignments` — user_id, role, country (nullable), city (nullable), assigned_by, assigned_at
- RLS: admin manage tout ; user lit ses propres assignations

**Modifications:**
- `orders` + `commerce_orders` : ajout `relay_point_id uuid`, `delivery_status delivery_status default 'en_preparation'`
- Index: `relay_points(country, city, is_active)`, `orders(relay_point_id)`, `commerce_orders(relay_point_id)`

**RPC sécurisées:**
- `assign_role(_user_id, _role, _country, _city)` — admin seulement, insère dans `user_roles` + `role_assignments`
- `revoke_role(_user_id, _role)` — admin seulement
- `update_delivery_status(_order_id, _kind, _status)` — admin/delivery_manager + scope géographique
- `set_account_status(_user_id, _status)` — admin/hr_manager + scope géographique respecté
- `list_relay_points(_country, _city)` — lecture publique active
- Helper `has_geo_scope(_uid, _country, _city)` security definer

### 2. UI

**Checkout (PurchaseDialog + CommerceProducts):**
- Cascade Pays → Ville → Point de relais (chargé depuis `list_relay_points`)
- Option "Livraison à domicile" (adresse) vs "Retrait en point de relais"
- Affichage statut livraison dans `DashboardOrders`

**Nouveaux dashboards staff:**
- `/staff/country` — `StaffCountry.tsx` : users de son pays, commandes, relais (CRUD), blocage
- `/staff/city` — `StaffCity.tsx` : users de sa ville, commandes, urgences
- `/staff/zone` — `StaffZone.tsx` : agrégation multi-pays/villes assignés
- `/staff/hr` — `StaffHR.tsx` : liste users, suspendre/bloquer/débloquer
- `/staff/delivery` — `StaffDelivery.tsx` : commandes à expédier, mise à jour statut, marquer disponible
- `/staff/emergency` — alias vers `AdminEmergencies` avec scope

**Admin:**
- `/admin/roles` — `AdminRoles.tsx` : recherche utilisateur par code MSN, attribution rôle + pays/ville, liste assignations actives, révocation
- `/admin/relays` — `AdminRelays.tsx` : CRUD complet des points de relais

**Sidebar (`DashboardLayout`):**
- Ajout des entrées par rôle (zone_harvester, country_harvester, city_harvester, hr_manager, delivery_manager, emergency_admin)
- Ajout liens admin "Gestion Rôles" et "Points de relais"

**Routes (`App.tsx`):**
- 6 nouvelles routes staff + 2 routes admin

### 3. Sécurité

- Toute écriture passe par RPC `SECURITY DEFINER` avec vérification `has_role` + `has_geo_scope`
- GRANT explicite sur les nouvelles tables (anon: select sur relay_points actifs ; authenticated: select + crud via RPC)
- RLS strict : pas de bypass côté client

### Hors scope (Phase 3)
- Canal de diffusion (broadcast_messages) — sera traité ensuite

Confirme et je lance la migration + le code.
