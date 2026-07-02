import { Component } from '@angular/core';
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
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-log',
  templateUrl: './log.page.html',
  styleUrls: ['./log.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, FormsModule,
    EmptyStateComponent, HabitDropdownComponent, HeaderComponent, NavbarComponent
  ]
})
export class LogPage implements ViewWillEnter {
  habits: Habit[] = [];
  currentId: string | null = null;
  loaded = false;
  occurredAt = "";
  comment = "";
  toastOpen = false;
  toastMessage = "";
  private toastTimer: any;

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
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

  // Réinitialise le formulaire : horodatage = maintenant, commentaire vide.
  resetForm() {
    this.occurredAt = dayjs().format("YYYY-MM-DDTHH:mm");
    this.comment = "";
  }

  // Sélection d'une habitude dans le dropdown → devient l'habitude courante.
  async onPickHabit(id: string) {
    this.currentId = id;
    await this.habitService.setCurrentHabitId(id);
  }

  // Enregistre le log à l'horodatage choisi (par défaut « maintenant », modifiable
  // pour rattraper un oubli), avec un commentaire optionnel.
  async submit() {
    if (!this.currentId) {
      return;
    }
    const iso = dayjs(this.occurredAt).toISOString();
    await this.logService.addLog(this.currentId, iso, this.comment.trim() || null);
    await this.habitService.setCurrentHabitId(this.currentId);
    await this.notifications.rescheduleForHabit(this.currentId);
    this.showToast("Log enregistré");
    this.resetForm();
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
