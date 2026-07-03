# Nexty

Application mobile de **suivi d'addictions et de comportements** que l'on souhaite réduire ou arrêter (cigarette, alcool, écrans, grignotage…). L'utilisateur déclare chaque occurrence d'une **habitude** (un **log**) ; l'app restitue un **suivi chiffré** (statistiques, durée depuis le dernier log, calendrier, tendances) pour aider à progresser, **à son rythme et sans culpabiliser**.

Données **100 % locales** sur l'appareil (Ionic Storage), **sans compte ni cloud**.

---

## Fonctionnalités

- **Plusieurs habitudes** : créer, renommer, recolorer (palette figée), supprimer (avec suppression en cascade des logs).
- **Déclarer un log** (1 log = 1 occurrence) : en direct (habitude + commentaire, horodaté à la seconde près au moment de l'enregistrement) ou **log passé** via une fenêtre dédiée (date et heure). Habitude courante pré-sélectionnée.
- **Statistiques par habitude** : durée depuis le dernier log (compteur en direct), comptages du jour / de la semaine / du mois, calendrier mensuel navigable, courbe de tendance (7 / 30 jours).
- **Historique par habitude** : liste chronologique, chargée par lots, avec édition et suppression des logs.
- **Notifications locales** : rappel quotidien depuis la dernière occurrence, activable globalement et par habitude.
- **Thèmes** : Clair / Sombre.

---

## Stack

- **Ionic 8** + **Angular 20** (standalone, sans NgModule).
- **Capacitor 8** (Android).
- **Ionic Storage** (persistance locale).
- **dayjs** (dates), **@capacitor/local-notifications** (rappels), **capacitor-native-settings** (accès réglages système).

---

## Installation

```bash
npm install
npm start            # serveur de dev → http://localhost:4200
```

## Commandes

```bash
npm start                                   # ng serve
npm run build                               # build de production → www/
npm run lint                                # ESLint
npx tsc --noEmit -p tsconfig.app.json       # vérification de types
```

## Android (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android    # ouvre Android Studio
```

> Les notifications locales ne fonctionnent que sur l'appareil (inertes en navigateur).

### Notes techniques (safe areas / insets Android)

- L'app s'appuie sur l'**edge-to-edge automatique** d'Android 15+ (`targetSdk` récent + `viewport-fit=cover`) : la WebView passe sous les barres système, et `env(safe-area-inset-*)` est alimenté.
- **Pattern Ionic obligatoire** : `app-header` enveloppé dans `<ion-header>` + `<ion-content [fullscreen]="true">`. C'est ce couple qui rend la WebView réellement edge-to-edge ; sans lui, les paddings de safe area se cumulent (navbar « surélevée » de la hauteur de la barre système).
- On **n'appelle pas** `StatusBar.setOverlaysWebView` : la barre d'état est seulement teintée (`setStyle` + `setBackgroundColor`, couleur lue dans une variable CSS de thème).
- Les safe areas sont gérées en CSS via `--safe-top` / `--safe-bottom` (header : `padding-top`, navbar fixe : `padding-bottom` + fond plein, `ion-content` : `--padding-bottom`).
- Nécessite **Capacitor ≥ 8.4** (les versions 8.3.x avaient un bug d'insets sous Android 15/16) et les outils de build en **9.x** : **AGP 9.2.1 + Gradle 9.4.1** (avec l'AGP 8.x, l'edge-to-edge n'est pas appliqué et la navbar paraît « surélevée »).
- **`@capacitor/keyboard` ≥ 8.0.5 impératif** : sur Android, c'est ce plugin qui gère les `WindowInsets` alimentant `env(safe-area-inset-*)`. L'app **n'est pas** edge-to-edge en bas (le viewport s'arrête au-dessus de la barre de navigation : `window.innerHeight ≈ screen.height − navBar`, et un `position: fixed; bottom: 0` se cale pile au-dessus de la barre — ce qui est correct). Le bug de la **8.0.2** : `env(safe-area-inset-bottom)` renvoyait un inset **fantôme** égal à la hauteur de la barre de nav, alors que le viewport ne passait déjà pas dessous → notre `padding-bottom: calc(<n> + safe-bottom)` compensait un décalage inexistant → navbar/modales remontées d'autant. La **8.0.5** rend `safe-bottom` **cohérent** (0 quand le viewport ne va pas sous la barre). **Diagnostic** : si `env(safe-area-inset-bottom) > 0` alors qu'un `fixed; bottom:0` se cale déjà au-dessus de la barre (`fixedBottom < screen.height`), il y a un inset fantôme → mettre à jour keyboard.
- **Orientation** verrouillée en portrait (`@capacitor/screen-orientation` dans `app.component.ts`).
- Avec l'**AGP 9.x**, R8 exige `getDefaultProguardFile('proguard-android-optimize.txt')` dans `android/app/build.gradle` (au lieu de `proguard-android.txt`) — sinon erreur de build (« `-dontoptimize`… no longer supported »).

---

## Architecture

Sous `src/app/` :

- **`services/`** (fichiers plats `xxx-service.ts`)
  - `StorageService` — stockage clé/valeur (boîte noire).
  - `DatabaseService` — micro-ORM (tables/lignes) au-dessus du stockage.
  - `HabitService` / `LogService` / `ColorService` — CRUD du modèle métier.
  - `StatsService` — calculs statistiques (via dayjs).
  - `NotificationService` — rappels locaux (seul à connaître le plugin natif).
  - `ThemeService` — thèmes Clair / Sombre.
  - `VersionHandlerService` — versionnage du format de la bdd + migrations + seed initial.
- **`pages/`** — `welcome` (splash), `log` (créer un log, écran d'arrivée), `stats`, `history`, `habits`, `settings`, `versions` (notes de version).
- **`components/`** — `header`, `navbar`, `modal` / `confirm-modal`, `empty-state`, `habit-dropdown`, `color-picker`, `month-calendar`, `progress-chart`.
- **`utils/`** — fonctions et données pures (`dayjs`, `release-notes`).

### Modèle de données (tables `db`)

- **`habits`** : `id`, `name`, `colorId`, `notify`.
- **`logs`** : `id`, `habitId`, `occurredAt` (ISO), `comment`.
- **`colors`** : `id`, `value` — palette figée, semée au premier lancement.

---

## Conventions de code

Voir [`CLAUDE.md`](./CLAUDE.md).

---

## Licence

**Propriétaire — tous droits réservés.** © 2026 Dorian CADENEL.

Ce dépôt est *source-available* : le code est publié pour consultation uniquement.
Aucune utilisation, copie, modification ou redistribution n'est autorisée sans
accord écrit préalable de l'auteur. Voir [`LICENSE`](./LICENSE).
