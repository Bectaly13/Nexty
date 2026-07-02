import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirection par défaut vers le splash.
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  // Splash de démarrage.
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage)
  },
  // Créer un log — cœur de l'app, écran d'arrivée après le splash.
  {
    path: 'log',
    loadComponent: () => import('./pages/log/log.page').then((m) => m.LogPage)
  },
  // Statistiques de l'habitude courante.
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then((m) => m.StatsPage)
  },
  // Historique des logs de l'habitude courante.
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPage)
  },
  // Gestion des habitudes.
  {
    path: 'habits',
    loadComponent: () => import('./pages/habits/habits.page').then((m) => m.HabitsPage)
  },
  // Paramètres.
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  },
  // Notes de version (sous-page des paramètres).
  {
    path: 'versions',
    loadComponent: () => import('./pages/versions/versions.page').then((m) => m.VersionsPage)
  }
];
