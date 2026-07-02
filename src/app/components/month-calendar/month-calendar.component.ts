import { Component, computed, input, output, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
import dayjs from 'dayjs';

@Component({
  selector: 'app-month-calendar',
  templateUrl: './month-calendar.component.html',
  styleUrls: ['./month-calendar.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class MonthCalendarComponent {
  // Calendrier mensuel navigable. Reçoit les jours « marqués » (avec ≥ 1 log) du mois
  // affiché et la couleur du marquage ; émet le mois affiché à chaque navigation pour
  // que la page recharge les jours marqués.
  markedDays = input<number[]>([]);
  markColor = input<string>("var(--app-accent)");
  monthChange = output<string>();

  // Mois affiché (ancre = 1er du mois), initialisé au mois courant.
  anchor = signal(dayjs().startOf("month"));

  // En-têtes de semaine (lundi → dimanche, cohérent avec la semaine ISO).
  weekdays = ["L", "M", "M", "J", "V", "S", "D"];

  monthLabel = computed(() => this.anchor().format("MMMM YYYY"));
  cells = computed<(number | null)[]>(() => this.buildCells(this.anchor()));

  constructor() {
    addIcons({ "chevron-back": chevronBack, "chevron-forward": chevronForward });
  }

  prev() {
    this.go(-1);
  }

  next() {
    this.go(1);
  }

  isMarked(day: number | null): boolean {
    return day !== null && this.markedDays().includes(day);
  }

  private go(delta: number) {
    this.anchor.set(this.anchor().add(delta, "month"));
    this.monthChange.emit(this.anchor().toISOString());
  }

  // Construit les cellules du mois : des cases vides pour aligner le 1er sur le bon
  // jour de semaine, puis les numéros de jour.
  private buildCells(anchor: dayjs.Dayjs): (number | null)[] {
    const daysInMonth = anchor.daysInMonth();
    const firstWeekday = anchor.isoWeekday(); // 1 (lundi) .. 7 (dimanche)
    const cells: (number | null)[] = [];
    for (let i = 1; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    return cells;
  }
}
