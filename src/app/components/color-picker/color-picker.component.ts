import { Component, input, output } from '@angular/core';

import { Color } from '../../services/color-service';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  standalone: true,
  imports: []
})
export class ColorPickerComponent {
  // Choix d'une couleur dans la palette figée. Reçoit la palette et l'id sélectionné,
  // émet l'id choisi.
  colors = input.required<Color[]>();
  selectedId = input<string | null>(null);
  pick = output<string>();

  choose(color: Color) {
    this.pick.emit(color.id);
  }
}
