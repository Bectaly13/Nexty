import { Component, NgZone } from '@angular/core';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonIcon, ViewDidLeave, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

import { NotificationService } from 'src/app/services/notification-service';
import { Theme, ThemeService } from 'src/app/services/theme-service';
import { VersionHandlerService } from 'src/app/services/version-handler-service';

import { HeaderComponent } from 'src/app/components/header/header.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonIcon,
    HeaderComponent, NavbarComponent
  ]
})
export class SettingsPage implements ViewWillEnter, ViewDidLeave {
  themes: Theme[] = [];
  currentTheme: Theme = "Clair";
  notificationsEnabled = false;
  notificationsSupported = false;
  permissionGranted = false;
  version = "";
  loaded = false;

  private resumeListener?: PluginListenerHandle;

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
    await this.registerResume();
  }

  constructor(
    private notificationService: NotificationService,
    private theme: ThemeService,
    private versionHandler: VersionHandlerService,
    private router: Router,
    private zone: NgZone
  ) {
    addIcons({ "chevron-forward": chevronForward });
  }

  async load() {
    this.themes = this.theme.getThemes();
    this.currentTheme = await this.theme.getTheme();
    this.notificationsEnabled = await this.notificationService.getEnabled();
    this.notificationsSupported = this.notificationService.isNative();
    this.permissionGranted = await this.notificationService.checkPermission();
    this.version = this.versionHandler.appVersionDisplay;
    this.loaded = true;
  }

  // Écoute le retour de l'app au premier plan : la permission a pu être modifiée
  // dans les réglages système → on recharge l'état et on replanifie.
  private async registerResume() {
    // Le listener Capacitor s'exécute hors zone Angular → on repasse dans la zone
    // pour que le rechargement d'état rafraîchisse bien l'affichage.
    this.resumeListener = await App.addListener("resume", () => {
      this.zone.run(() => this.onResume());
    });
  }

  async ionViewDidLeave() {
    await this.resumeListener?.remove();
    this.resumeListener = undefined;
  }

  private async onResume() {
    await this.load();
    await this.notificationService.rescheduleAll();
  }

  // ----- Apparence -----

  async selectTheme(theme: Theme) {
    await this.theme.applyTheme(theme);
    this.currentTheme = theme;
  }

  // ----- Notifications -----

  // Vrai si le système autorise les notifications (toujours vrai hors natif).
  get systemAllowed(): boolean {
    return !this.notificationsSupported || this.permissionGranted;
  }

  async toggleNotifications() {
    // Permission système refusée : impossible d'activer depuis l'app → réglages système.
    if (this.notificationsSupported && !this.permissionGranted) {
      await this.notificationService.openSettings();
      return;
    }
    this.notificationsEnabled = !this.notificationsEnabled;
    await this.notificationService.setEnabled(this.notificationsEnabled);
  }

  // Ouvre les réglages système des notifications de l'app (si la permission a été refusée).
  async openNotificationSettings() {
    await this.notificationService.openSettings();
  }

  // ----- À propos -----

  goToVersions() {
    this.router.navigateByUrl("/versions");
  }
}
