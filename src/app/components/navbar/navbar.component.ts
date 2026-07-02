import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, appsOutline, listOutline, settingsOutline, statsChart } from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonIcon, RouterLink, RouterLinkActive]
})
export class NavbarComponent {
  constructor() {
    addIcons({
      "stats-chart": statsChart,
      "list-outline": listOutline,
      "add": add,
      "apps-outline": appsOutline,
      "settings-outline": settingsOutline
    });
  }
}
