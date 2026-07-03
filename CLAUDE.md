# Nexty — Conventions de code

Application Ionic 8 / Angular 20 (standalone) : un suivi d'addictions / comportements que
l'utilisateur juge nuisibles (cigarette, alcool…). L'utilisateur déclare chaque occurrence
d'une **habitude** (un **log**) ; l'app restitue un suivi chiffré (statistiques, durée depuis
le dernier log, calendrier mensuel, courbes). Données **100 % locales** (Ionic Storage), sans
compte ni cloud. Ton **bienveillant, jamais culpabilisant**. Ce document recense les
conventions de code du projet. Il est agrémenté au fur et à mesure.

> Le cahier des charges détaillé vit dans `docs/CAHIER_DES_CHARGES.md` (dossier `docs/`
> git-ignoré, interne).

---

## Général

- **Tous les noms d'éléments de code** (méthodes, variables, services, pages, composants, types…) sont en **anglais**. Seuls les libellés destinés à l'utilisateur (textes affichés) peuvent être en français.
- **Vocabulaire métier dans le code** (anglais) : `habit` (habitude), `log` (occurrence), `color` (couleur de la palette).
- **Tous les commentaires de code sont en français.**
- **Strings entre doubles guillemets** (`"`) en priorité, plutôt que des simples (`'`). **Exception** : ce qui est généré par Ionic/Angular reste tel quel, en simples guillemets — notamment les chemins des `import` et les métadonnées du décorateur `@Component` (`selector`, `templateUrl`, `styleUrls`). On ne convertit pas l'existant.
- **Fichiers `.spec.ts`** : on garde toujours le `.spec.ts` généré pour chaque **page**, **composant** et **service**.
- **Identifiants** : générés via `crypto.randomUUID()`.

---

## Documentation

- **`README.md`** (racine) doit rester **à jour à tout moment** : à chaque évolution du projet (nouvelle fonctionnalité, changement d'installation, de configuration ou d'architecture), répercuter le changement dans le README.
- Les TODO de travail vivent dans `docs/TODOs/` (cf. Workflow) : on coche/déplace leurs points au fil de l'implémentation. Il n'y a pas de TODO « vivant » à la racine.

---

## Frontend

### Structuration des fichiers
Sous `src/app/` :
- `services/` : les **services**, en fichiers plats `xxx-service.ts` (+ `xxx-service.spec.ts`), **sans** sous-dossier.
- `components/` : les **composants**, chacun dans son sous-dossier `xxx/` : `xxx.component.ts`, `.html`, `.scss`, `.spec.ts`.
- `pages/` : les **pages**, chacune dans son sous-dossier `xxx/` : `xxx.page.ts`, `.html`, `.scss`, `.spec.ts`.
- `utils/` : fonctions utilitaires pures, sans `.spec.ts`.

Autres : `src/environments/` (variables d'environnement), `src/theme/variables.scss` (thèmes), `src/assets/` (images).

### Variables d'environnement
- Définies dans `src/environments/environment.ts` (et `environment.prod.ts`).
- Nommées au format `NOM_VARIABLE` (majuscules, underscore).
- L'app est 100 % locale : pas de secret à protéger pour l'instant.

### Imports dans un `.ts` de page ou de composant
Trois blocs séparés par une ligne vide :
1. Les imports framework (Angular, Ionic, RxJS, dayjs…).
2. *(ligne vide)* puis les **services** (ordre alphabétique).
3. *(ligne vide)* puis les **composants** (ordre alphabétique).

```ts
import { Component } from '@angular/core';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';

import { HabitService } from 'src/app/services/habit-service';
import { ThemeService } from 'src/app/services/theme-service';

import { HeaderComponent } from 'src/app/components/header/header.component';
```

### Types du modèle métier
- **Typage strict** : chaque entité du modèle a une **interface TypeScript** explicite (`Habit`, `Log`, `Color`…). Pas de `any` pour le modèle métier.
- Une interface est **co-localisée avec le service qui la possède** et **exportée** depuis ce fichier ; les autres modules l'importent depuis le service (comme pour un service).

```ts
// habit-service.ts
export interface Habit {
  id: string;
  name: string;
  colorId: string;
  notify: boolean;
}
```

### Services
- Un service est **suffixé par `Service`** : classe `XxxService`, fichier `xxx-service.ts` (kebab + `-service`).
- Objectif : l'import d'un service contient toujours le mot « Service », ce qui le distingue d'un type, d'un composant, etc.
- Injectés en `private` dans le constructeur (dependency injection classique — la règle ESLint `@angular-eslint/prefer-inject` est désactivée, on n'utilise pas `inject()`).
- **Séparation des responsabilités** — un service = une responsabilité :
  - `HabitService` : CRUD des habitudes, gestion de l'**habitude courante** (persistée), suppression **en cascade** des logs.
  - `LogService` : CRUD des logs.
  - `ColorService` : accès à la palette **figée**, résolution `colorId → valeur`.
  - `StatsService` : **calculs** statistiques (durée depuis dernier log, comptages, séries calendrier & courbes) — ne fait que calculer à partir des données, aucun effet de bord.
  - `NotificationService` : rappels locaux ; **seul** à connaître le plugin natif (`@capacitor/local-notifications`). Changer de mécanisme de notification ne touche que ce service.

### Dates & temps
- Toute manipulation de date/temps passe par **`dayjs`** (`import dayjs from 'dayjs'`) — jamais de calculs de fuseaux/semaines/mois à la main.
- Les logs stockent leur horodatage en **ISO** dans `occurredAt` (`dayjs().toISOString()`), et l'affichage (date, heure) est **dérivé** via dayjs.
- Affichage utilisateur : **locale française**, heures au **format 24 h**.

### Inputs / Outputs
- Utiliser l'API **signal** : `title = input.required<string>();` (import de `input`) plutôt que `@Input()`.
  Dans le template, un input signal se lit en l'appelant : `{{ title() }}`.
- Pour les sorties : utiliser `output()` plutôt que le décorateur `@Output`.

### Constructeur et méthodes
- Les **services** sont injectés en `private` dans le constructeur.
- La **seule** méthode autorisée au-dessus du constructeur est `ionViewWillEnter`.
- `ionViewWillEnter` ne contient **pas de logique** : uniquement des appels à d'autres méthodes (quitte à définir des méthodes d'une seule ligne).
- Code à exécuter au chargement : `ionViewWillEnter` pour les **pages**, `ngOnInit` pour les **composants**.
- `await this.theme.initTheme();` est **toujours la première instruction** de `ionViewWillEnter` d'une **page** (applique le thème au plus tôt ; inutile dans les composants, qui héritent du thème de la page).

```ts
export class StatsPage implements ViewWillEnter {

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.loadCurrentHabit();
    await this.loadStats();
  }

  constructor(
    private habit: HabitService,
    private stats: StatsService,
    private theme: ThemeService
  ) { }

  // ... autres méthodes ...
}
```

### Templates HTML des pages
- **Structure Ionic standard** (indispensable pour la bonne gestion des safe areas / edge-to-edge) : le composant **`app-header` est enveloppé dans un `<ion-header>`**, suivi d'un **`<ion-content [fullscreen]="true">`**, puis (si onglet) de `<app-navbar>`. Pas d'autre `<ion-header>`/`<ion-footer>`.
- Le `<ion-content>` porte toujours l'attribut `[fullscreen]="true"` et la classe `<nom-de-la-page>-content`.
- **Éviter les balises `<ion-xxx>`** : privilégier du HTML classique quand c'est possible (et ne pas importer les `IonXxx` correspondants dans le `.ts`). **Exception** : `<ion-icon>` est autorisé pour les icônes ; elles sont enregistrées via `addIcons({ … })` dans le constructeur du composant standalone.
- **Control flow** : utiliser `@for`, `@if`, `@switch` — **pas** `*ngFor`, `*ngIf`, `*ngSwitch`.
- **Classes sur toutes les balises** : chaque balise porte un nom de classe, même sans propriété SCSS associée. **Exception** : les fichiers HTML générés de base (ex. `app.component.html`) sont laissés tels quels.
- **Boîtes de dialogue** : utiliser les modales applicatives `app-modal` (coquille) et `app-confirm-modal` (confirmation) — **jamais** `AlertController` (pop-ups natifs). Chaque page pilote ses modales via un état local.

### Safe areas (Android)
- **Edge-to-edge automatique** (Android 15+, `targetSdk` récent + `viewport-fit=cover`) : le contenu passe sous les barres système. **Ne pas** appeler `StatusBar.setOverlaysWebView`.
- **Pattern Ionic** : `app-header` dans `<ion-header>` + `<ion-content [fullscreen]="true">`. C'est ce couple qui fait qu'Ionic gère correctement les insets (sinon la WebView n'est pas réellement edge-to-edge et les paddings safe se cumulent → navbar « surélevée »).
- `--safe-top` / `--safe-bottom` (= `env(safe-area-inset-*)`) sont appliqués en `padding` : **header** → `padding-top: calc(<n> + var(--safe-top))` (+ fond, pour fusionner avec la barre d'état) ; **navbar** → `position: fixed; bottom: 0` + `padding-bottom: calc(<n> + var(--safe-bottom))` + **fond plein** (couvre jusqu'en bas, pas de « gap »). Les `ion-content` des pages à navbar ont `--padding-bottom: calc(72px + var(--safe-bottom))`.
- La barre d'état est **teintée** par `ThemeService` : `--header-background` sur les pages (via `initTheme`), `--app-background` sur Welcome (`useBackgroundStatusBar`).
- **Prérequis outils** : Capacitor **≥ 8.4**, **AGP 9.2.1** + **Gradle 9.4.1**, **`@capacitor/keyboard` ≥ 8.0.5**. Avec l'AGP 8.x, l'edge-to-edge Android 15/16 n'est pas appliqué → navbar « surélevée » de la hauteur de la barre système, malgré un code identique. **Accepter l'update AGP vers 9.x.**
- **Piège `@capacitor/keyboard`** : c'est ce plugin qui, sur Android, alimente `env(safe-area-inset-*)` via les `WindowInsets`. L'app n'est **pas** edge-to-edge en bas (le viewport s'arrête au-dessus de la barre de nav : `innerHeight ≈ screen.height − navBar`, un `fixed; bottom:0` se cale pile au-dessus — correct). Bug de la **8.0.2** : `safe-bottom` renvoyait un inset **fantôme** (= hauteur barre de nav) alors que le viewport ne passait déjà pas dessous → `padding-bottom: calc(<n> + safe-bottom)` remontait la navbar/les modales d'autant. **Aligner sur 8.0.5** (rend `safe-bottom` cohérent = 0). Diagnostic : `safe-bottom > 0` alors qu'un `fixed; bottom:0` est déjà au-dessus de la barre (`fixedBottom < screen.height`) = inset fantôme.

### Fichiers SCSS
- Les classes sont ordonnées selon leur **ordre d'apparition dans le HTML**.
- **Pas de couleur codée en dur** : toute couleur passe par une variable CSS `var(--xxx)`.
- **Éviter les variables Ionic** (`--ion-xxx`) : utiliser nos propres variables (`src/theme/variables.scss`). Pour styliser un composant Ionic, lui passer nos variables via ses custom properties (ex. `ion-content { --background: var(--app-background); }`).

### Thèmes / couleurs
- L'app gère deux thèmes : **`Clair`** (par défaut) et **`Sombre`**, via `ThemeService`, qui pose une classe (`theme-light` / `theme-dark`) sur `<body>`. `ThemeService` accorde aussi la barre d'état Android au thème.
- **Toute couleur d'un `.scss` passe par une variable CSS** `var(--xxx)` définie dans `src/theme/variables.scss` — jamais de couleur codée en dur. Les variables y sont déclarées par thème (`body.theme-xxx`) et regroupées par catégorie logique.
- Les **couleurs d'habitude** (palette `colors`) sont des données, pas des variables de thème : elles proviennent de `ColorService` et sont appliquées en style inline / custom property, pas via `variables.scss`.

### Direction artistique
- Design **moderne** et **épuré**, lignes **douces** (coins arrondis, « pas trop carré »).
- **Couleur d'accent** : **bleu océan** (`#3B82F6`, foncé `#2563EB`, texte sur accent `#FFFFFF`) — guide boutons, éléments actifs, bouton central de la navbar.
- **Style « tech / lumineux »** : dégradés subtils et léger effet lumineux (glow) sur l'accent, particulièrement en **thème Sombre** (soigné) ; effets discrets, jamais criards.
- **Typographie** : **police système** (San Francisco / Roboto), aucune font embarquée.
- À affiner écran par écran.

### Stockage des données utilisateur
- Pour manipuler l'entrée `"db"` du stockage : **toujours passer par `DatabaseService`**, jamais par `StorageService`. `DatabaseService` est l'interface dev-friendly (tables/lignes).
- `StorageService` est une **boîte noire** qu'on ne touche pas quand on peut l'éviter ; on l'utilise directement pour les autres clés.
- **Tables de la db** : `habits`, `logs`, `colors`.
- **Autres clés `storage`** : `theme`, `version`, `currentHabit` (id de l'habitude courante), `notificationsEnabled` (interrupteur global des notifications).

---

## Workflow

- **Toujours démarrer un correctif ou une fonctionnalité par un TODO structuré** : un fichier `TODO_*.md` dans le dossier `docs/TODOs/`, points **ordonnés par priorité**, avec pour chacun le **constat/symptôme**, la **méthode**, les **limites** et les **questions à trancher**. On formalise (et on tranche les questions) **avant** d'implémenter, puis on coche les points au fur et à mesure.
- **Nommage des TODO** : pour une version, `TODO_vX_Y.md` (ex. `TODO_v1_1.md`) ; les autres chantiers gardent un nom descriptif (`TODO_STYLE.md`, `TODO_UI.md`…). Préfixer les versions par `v` pour éviter les conflits de noms.
- **Implémentation** : un point à la fois, en vérifiant `npx tsc --noEmit -p tsconfig.app.json` + `npm run lint` (+ `npm run build` pour un changement SCSS ou de structure) après chaque point.

---

## Versionnage

Deux numéros **indépendants**, tous deux dans `VersionHandlerService` :
- **`appVersion`** (entier) : version du **format de la bdd**. **N'évolue QUE si nécessaire**, c'est-à-dire uniquement quand une **migration** de données est requise (nouvelle table, nouveau champ…). On l'incrémente d'1 et on ajoute la migration `updateToVx()` correspondante.
- **`appVersionDisplay`** (chaîne) : version **commerciale** affichée à l'utilisateur (notes de version). Doit **toujours correspondre** au `versionName` de `android/app/build.gradle`.

**À chaque changement de version commerciale** (procédure à appliquer automatiquement) :
1. **Demander à l'utilisateur l'ampleur** de la version pour choisir le numéro : **majeure** (ex. `2.0`), **mineure** (ex. `1.2`) ou **correctif** (ex. `1.1.1`).
2. Mettre à jour **de façon synchronisée** : `appVersionDisplay` (`VersionHandlerService`), `versionName` **et** `versionCode` (incrémenté de 1, toujours croissant) dans `android/app/build.gradle`, et une entrée **en tête** de `RELEASE_NOTES` (`utils/release-notes.ts`) listant les points revus (alimente la sous-page « Notes de version »).
3. Ne **pas** toucher `appVersion` sauf migration de bdd réellement nécessaire.
4. **Vérifier la cohérence de `README.md` et `CLAUDE.md`** au regard des modifications de la version : répercuter tout changement de fonctionnalité, d'installation, de configuration, d'architecture ou de convention, et corriger toute incohérence introduite. À faire **avant** le commit.

---

## GitHub

- **Nom du commit** : minimaliste, uniquement le numéro de version de l'application — celui-ci correspond toujours à la variable `appVersionDisplay` de `VersionHandlerService`.
- **Description du commit** : liste des features ajoutées.
- **Jamais** de trailer `Co-Authored-By: Claude` dans les commits.
- **Garde-fou version** : avant de commit, comparer la valeur de `appVersionDisplay` au nom du dernier commit. Si elles sont identiques (= la variable n'a pas été incrémentée), **ne pas commit** et le signaler à l'utilisateur, pour éviter de publier deux fois sous le même nom de version.
