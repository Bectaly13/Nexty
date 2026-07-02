import { Component, OnInit, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown } from 'ionicons/icons';

import { ColorService } from '../../services/color-service';
import { Habit } from '../../services/habit-service';

@Component({
  selector: 'app-habit-dropdown',
  templateUrl: './habit-dropdown.component.html',
  styleUrls: ['./habit-dropdown.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class HabitDropdownComponent implements OnInit {
  // Sélecteur d'habitude courante. Reçoit la liste et l'id sélectionné, émet le
  // nouvel id choisi. Résout les couleurs via ColorService pour la pastille.
  habits = input.required<Habit[]>();
  selectedId = input<string | null>(null);
  pick = output<string>();

  open = false;
  private colorMap: Record<string, string> = {};

  constructor(private colors: ColorService) {
    addIcons({ "chevron-down": chevronDown });
  }

  async ngOnInit() {
    const colors = await this.colors.getColors();
    for (const color of colors) {
      this.colorMap[color.id] = color.value;
    }
  }

  get selected(): Habit | undefined {
    return this.habits().find((habit) => habit.id === this.selectedId());
  }

  colorOf(habit: Habit): string {
    return this.colorMap[habit.colorId] || "var(--app-text-muted)";
  }

  toggle() {
    this.open = !this.open;
  }

  choose(habit: Habit) {
    this.open = false;
    this.pick.emit(habit.id);
  }
}
