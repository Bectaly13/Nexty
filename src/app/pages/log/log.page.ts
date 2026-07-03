import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, ViewWillEnter } from '@ionic/angular/standalone';
import dayjs from 'dayjs';

import { Habit, HabitService } from 'src/app/services/habit-service';
import { LogService } from 'src/app/services/log-service';
import { NotificationService } from 'src/app/services/notification-service';
import { ThemeService } from 'src/app/services/theme-service';

import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { HabitDropdownComponent } from 'src/app/components/habit-dropdown/habit-dropdown.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { ModalComponent } from 'src/app/components/modal/modal.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-log',
  templateUrl: './log.page.html',
  styleUrls: ['./log.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, FormsModule,
    EmptyStateComponent, HabitDropdownComponent, HeaderComponent, ModalComponent, NavbarComponent
  ]
})
export class LogPage implements ViewWillEnter {
  habits: Habit[] = [];
  currentId: string | null = null;
  loaded = false;
  comment = "";
  toastOpen = false;
  toastMessage = "";
  private toastTimer: any;

  // Modale « log en retard » : autonome (sa propre habitude, son horodatage à la
  // seconde, sa note).
  lateModal = { open: false, habitId: "", occurredAt: "", comment: "" };

  @ViewChild(HabitDropdownComponent) private dropdown?: HabitDropdownComponent;
  @ViewChild('lateDropdown') private lateDropdown?: HabitDropdownComponent;

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
    this.closeDropdown();
  }

  constructor(
    private habitService: HabitService,
    private logService: LogService,
    private notifications: NotificationService,
    private theme: ThemeService,
    private router: Router
  ) { }

  async load() {
    this.habits = await this.habitService.getHabits();
    const current = await this.habitService.getCurrentHabit();
    this.currentId = current ? current.id : null;
    this.resetForm();
    this.loaded = true;
  }

  // Réinitialise le formulaire : commentaire vide (l'horodatage est capturé au clic).
  resetForm() {
    this.comment = "";
  }

  // Sélection d'une habitude dans le dropdown → devient l'habitude courante.
  async onPickHabit(id: string) {
    this.currentId = id;
    await this.habitService.setCurrentHabitId(id);
  }

  // Enregistre un log « en direct » : horodaté à l'instant du clic (à la seconde),
  // avec un commentaire optionnel. Les logs en retard passeront par une modale dédiée.
  async submit() {
    if (!this.currentId) {
      return;
    }
    const iso = dayjs().toISOString();
    await this.logService.addLog(this.currentId, iso, this.comment.trim() || null);
    await this.habitService.setCurrentHabitId(this.currentId);
    await this.notifications.rescheduleForHabit(this.currentId);
    this.showToast("Log enregistré");
    this.resetForm();
  }

  // Ouvre la modale « log en retard » : pré-remplie sur l'habitude courante, horodatage
  // = maintenant (à la seconde), note vide. Le dropdown de la modale est refermé.
  openLate() {
    this.lateModal = {
      open: true,
      habitId: this.currentId ?? "",
      occurredAt: dayjs().format("YYYY-MM-DDTHH:mm"),
      comment: ""
    };
    this.lateDropdown?.close();
  }

  closeLate() {
    this.lateModal.open = false;
  }

  // Changer l'habitude dans la modale met à jour l'habitude courante (propagée à tous
  // les dropdowns et persistée), en plus de cibler ce log.
  async onPickLateHabit(id: string) {
    this.lateModal.habitId = id;
    this.currentId = id;
    await this.habitService.setCurrentHabitId(id);
  }

  // Enregistre un log en retard à l'horodatage saisi (à la seconde).
  async submitLate() {
    if (!this.lateModal.habitId) {
      return;
    }
    const iso = dayjs(this.lateModal.occurredAt).toISOString();
    await this.logService.addLog(this.lateModal.habitId, iso, this.lateModal.comment.trim() || null);
    await this.habitService.setCurrentHabitId(this.lateModal.habitId);
    await this.notifications.rescheduleForHabit(this.lateModal.habitId);
    this.lateModal.open = false;
    this.showToast("Log enregistré");
  }

  // Referme le dropdown d'habitude à l'arrivée sur la page (undefined si empty state).
  private closeDropdown() {
    this.dropdown?.close();
  }

  goToHabits() {
    this.router.navigateByUrl("/habits");
  }

  // Affiche un toast de confirmation éphémère.
  private showToast(message: string) {
    this.toastMessage = message;
    this.toastOpen = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastOpen = false;
    }, 2000);
  }
}
