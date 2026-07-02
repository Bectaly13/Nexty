import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class HeaderComponent {
  title = input.required<string>();
  showBack = input<boolean>(false);
  back = output<void>();

  constructor() {
    addIcons({ "arrow-back": arrowBack });
  }

  onBack() {
    this.back.emit();
  }
}
