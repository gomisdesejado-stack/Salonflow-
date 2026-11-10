# SalonFlow

Application web responsive de gestion et de réservation pour salons de coiffure.

## Inclus
- Tableau de bord administrateur avec indicateurs et prochains rendez-vous
- Planning hebdomadaire et gestion des réservations
- Gestion des clients et prestations
- Formulaires d'ajout
- Mode démonstration sans configuration
- Authentification Supabase (inscription / connexion)
- Schéma PostgreSQL avec Row Level Security
- Edge Function Stripe Checkout pour encaisser une prestation de manière sécurisée

## 1. Lancer en local

Prérequis : Node.js 18 ou supérieur.

```bash
npm install
cp .env.example .env
npm run dev
```

Sans variables Supabase, l'application démarre en mode démonstration avec des données d'exemple. Les données de démonstration ne sont pas persistées sur un serveur.

## 2. Activer les comptes et la base de données

1. Créez un projet sur https://supabase.com.
2. Ouvrez SQL Editor et exécutez `supabase/schema.sql`.
3. Copiez l'URL du projet et la clé `anon` dans `.env` :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

4. Redémarrez `npm run dev`.
5. Créez un compte depuis l'écran de connexion. Selon la configuration Supabase, confirmez l'adresse e-mail.

La clé `anon` est prévue pour le navigateur. N'ajoutez JAMAIS `service_role` ou une clé secrète Stripe dans les variables `VITE_*`.

## 3. Activer les paiements Stripe

Le projet fournit l'Edge Function `supabase/functions/create-checkout-session/index.ts`.
Elle crée une session Stripe Checkout côté serveur après vérification de l'utilisateur et de la réservation.

```bash
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
supabase secrets set STRIPE_SECRET_KEY=sk_live_... APP_URL=https://votre-domaine.fr
supabase functions deploy create-checkout-session
```

L'appel depuis le front peut ensuite être effectué avec :

```js
const { data, error } = await supabase.functions.invoke("create-checkout-session", {
  body: { bookingId: "UUID_DE_LA_RESERVATION" }
});
if (error) throw error;
window.location.assign(data.url);
```

Pour une intégration de production complète, ajoutez un webhook Stripe vérifiant la signature (`checkout.session.completed`) et enregistrez le statut du paiement dans une table `payments`. Ne considérez jamais une redirection navigateur comme preuve de paiement.

## 4. Déploiement

Construisez le site avec `npm run build`, puis déployez le dossier `dist/` sur Vercel, Netlify ou un hébergeur statique. Configurez les deux variables Supabase dans les variables d'environnement du fournisseur.

## Points à compléter avant mise en production
- Ajouter une page de réservation publique destinée aux clients, avec contrôle des créneaux disponibles côté serveur.
- Ajouter les règles anti-chevauchement de rendez-vous en base de données.
- Ajouter les notifications e-mail/SMS et rappels.
- Ajouter un webhook Stripe et une table de paiements.
- Vérifier les obligations RGPD, politique de confidentialité et conservation des données.
- Adapter les politiques RLS et les flux de réservation publique à votre modèle commercial.

## Architecture
- Frontend : React + Vite
- Authentification / base de données : Supabase Auth + PostgreSQL
- Paiement : Stripe Checkout via Supabase Edge Function
