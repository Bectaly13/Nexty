import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, ViewWillEnter } from '@ionic/angular/standalone';

import { ThemeService } from 'src/app/services/theme-service';

import { RELEASE_NOTES, ReleaseNote } from 'src/app/utils/release-notes';

import { HeaderComponent } from 'src/app/components/header/header.component';

@Component({
  selector: 'app-versions',
  templateUrl: './versions.page.html',
  styleUrls: ['./versions.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, HeaderComponent]
})
export class VersionsPage implements ViewWillEnter {
  releases: ReleaseNote[] = RELEASE_NOTES;

  async ionViewWillEnter() {
    await this.theme.initTheme();
  }

  constructor(
    private theme: ThemeService,
    private router: Router
  ) { }

  // Retour vers les paramètres.
  goBack() {
    this.router.navigateByUrl("/settings");
  }
}
