import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';

import { NotificationService } from 'src/app/services/notification-service';
import { ThemeService } from 'src/app/services/theme-service';
import { VersionHandlerService } from 'src/app/services/version-handler-service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [IonContent]
})
export class WelcomePage implements ViewWillEnter {

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.theme.useBackgroundStatusBar();
    await this.initialize();
  }

  constructor(
    private notifications: NotificationService,
    private theme: ThemeService,
    private version: VersionHandlerService,
    private router: Router
  ) { }

  // Initialise l'app (versionnage + seed + notifications) puis redirige vers l'écran principal.
  async initialize() {
    await this.version.init();
    await this.setupNotifications();
    this.redirect();
  }

  // Demande la permission (dialogue au 1er lancement seulement) puis replanifie les
  // rappels (Android efface les notifications planifiées au redémarrage du téléphone).
  private async setupNotifications() {
    await this.notifications.requestPermission();
    await this.notifications.rescheduleAll();
  }

  // Laisse le splash affiché un court instant avant de basculer sur « Créer un log ».
  private redirect() {
    setTimeout(() => {
      this.router.navigateByUrl("/log", { replaceUrl: true });
    }, 1200);
  }
}
