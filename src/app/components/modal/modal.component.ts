import { Component, input, output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [IonIcon],
  animations: [
    // Fondu du fond.
    trigger('backdropAnim', [
      transition(':enter', [style({ opacity: 0 }), animate('180ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('160ms ease', style({ opacity: 0 }))])
    ]),
    // Glissement de la feuille depuis le bas (et retour vers le bas à la fermeture).
    trigger('sheetAnim', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('240ms cubic-bezier(0.22, 1, 0.36, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [animate('200ms ease-in', style({ transform: 'translateY(100%)' }))])
    ])
  ]
})
export class ModalComponent {
  // Coquille de modale générique : titre + contenu projeté + pied projeté ([modalFooter]).
  open = input<boolean>(false);
  title = input<string>("");
  dismiss = output<void>();

  constructor() {
    addIcons({ "close": close });
  }

  onDismiss() {
    this.dismiss.emit();
  }
}
