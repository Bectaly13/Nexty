import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, createOutline, notificationsOffOutline, notificationsOutline, trashOutline } from 'ionicons/icons';

import { Color, ColorService } from 'src/app/services/color-service';
import { Habit, HabitService } from 'src/app/services/habit-service';
import { NotificationService } from 'src/app/services/notification-service';
import { ThemeService } from 'src/app/services/theme-service';

import { ColorPickerComponent } from 'src/app/components/color-picker/color-picker.component';
import { ConfirmModalComponent } from 'src/app/components/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from 'src/app/components/empty-state/empty-state.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { ModalComponent } from 'src/app/components/modal/modal.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@Component({
  selector: 'app-habits',
  templateUrl: './habits.page.html',
  styleUrls: ['./habits.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonIcon, FormsModule,
    ColorPickerComponent, ConfirmModalComponent, EmptyStateComponent,
    HeaderComponent, ModalComponent, NavbarComponent
  ]
})
export class HabitsPage implements ViewWillEnter {
  habits: Habit[] = [];
  colors: Color[] = [];
  notificationsActive = false;
  loaded = false;

  // Modale de création / édition (id null = création).
  editModal = { open: false, id: null as string | null, name: "", colorId: "" };
  // Modale de confirmation de suppression.
  deleteModal = { open: false, id: "", name: "" };

  async ionViewWillEnter() {
    await this.theme.initTheme();
    await this.load();
  }

  constructor(
    private colorService: ColorService,
    private habitService: HabitService,
    private notifications: NotificationService,
    private theme: ThemeService,
    private router: Router
  ) {
    addIcons({
      "add": add,
      "create-outline": createOutline,
      "trash-outline": trashOutline,
      "notifications-outline": notificationsOutline,
      "notifications-off-outline": notificationsOffOutline
    });
  }

  async load() {
    this.colors = await this.colorService.getColors();
    this.habits = await this.habitService.getHabits();
    this.notificationsActive = await this.notifications.isActive();
    this.loaded = true;
  }

  // Résout la couleur (hex) d'une habitude pour l'affichage.
  colorOf(colorId: string): string {
    return this.colors.find((color) => color.id === colorId)?.value || "var(--app-text-muted)";
  }

  openCreate() {
    this.editModal = { open: true, id: null, name: "", colorId: this.colors[0]?.id || "" };
  }

  openEdit(habit: Habit) {
    this.editModal = { open: true, id: habit.id, name: habit.name, colorId: habit.colorId };
  }

  pickColor(colorId: string) {
    this.editModal.colorId = colorId;
  }

  closeEdit() {
    this.editModal.open = false;
  }

  // Enregistre la création ou l'édition selon la présence d'un id.
  async saveEdit() {
    const name = this.editModal.name.trim();
    if (!name || !this.editModal.colorId) {
      return;
    }
    if (this.editModal.id) {
      await this.habitService.renameHabit(this.editModal.id, name);
      await this.habitService.setColor(this.editModal.id, this.editModal.colorId);
    } else {
      const created = await this.habitService.createHabit(name, this.editModal.colorId);
      await this.notifications.rescheduleForHabit(created.id);
    }
    this.editModal.open = false;
    await this.load();
  }

  // Bascule les notifications d'une habitude. Si les notifications sont globalement
  // inactives (interrupteur global ou permission système), on redirige vers les
  // réglages plutôt que de basculer (la préférence n'est modifiable qu'une fois débloqué).
  async toggleNotify(habit: Habit) {
    if (!this.notificationsActive) {
      this.router.navigateByUrl("/settings");
      return;
    }
    await this.habitService.setNotify(habit.id, !habit.notify);
    await this.notifications.rescheduleForHabit(habit.id);
    await this.load();
  }

  openDelete(habit: Habit) {
    this.deleteModal = { open: true, id: habit.id, name: habit.name };
  }

  closeDelete() {
    this.deleteModal.open = false;
  }

  async confirmDelete() {
    await this.notifications.cancelForHabit(this.deleteModal.id);
    await this.habitService.removeHabit(this.deleteModal.id);
    this.deleteModal.open = false;
    await this.load();
  }
}
