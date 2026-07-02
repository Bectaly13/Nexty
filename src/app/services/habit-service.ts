import { Injectable } from '@angular/core';

import { DatabaseService } from './database-service';
import { StorageService } from './storage-service';

// Une habitude suivie par l'utilisateur.
export interface Habit {
  id: string;
  name: string;
  colorId: string;
  notify: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  // Gère les habitudes (CRUD), leur suppression en cascade et l'habitude courante
  // (dernière en date, persistée en storage sous la clé "currentHabit").

  constructor(
    private db: DatabaseService,
    private storage: StorageService
  ) { }

  // ----- CRUD -----

  // Renvoie toutes les habitudes.
  async getHabits(): Promise<Habit[]> {
    return await this.db.getTable("habits") || [];
  }

  // Renvoie une habitude par son id, ou undefined.
  async getHabit(id: string): Promise<Habit | undefined> {
    return await this.db.getEntryWith("habits", "id", id);
  }

  // Crée une habitude et la définit comme habitude courante. notify activé par défaut.
  async createHabit(name: string, colorId: string): Promise<Habit> {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: name,
      colorId: colorId,
      notify: true
    };
    await this.db.addEntry("habits", habit);
    await this.setCurrentHabitId(habit.id);
    return habit;
  }

  // Renomme une habitude.
  async renameHabit(id: string, name: string): Promise<void> {
    await this.db.updateEntriesWith("habits", "id", id, { name: name });
  }

  // Change la couleur d'une habitude.
  async setColor(id: string, colorId: string): Promise<void> {
    await this.db.updateEntriesWith("habits", "id", id, { colorId: colorId });
  }

  // Active/désactive les notifications d'une habitude.
  async setNotify(id: string, notify: boolean): Promise<void> {
    await this.db.updateEntriesWith("habits", "id", id, { notify: notify });
  }

  // Supprime une habitude et, en cascade, tous ses logs. Réinitialise l'habitude
  // courante si c'était celle-ci.
  async removeHabit(id: string): Promise<void> {
    await this.db.removeEntriesWith("habits", "id", id);
    await this.db.removeEntriesWith("logs", "habitId", id);

    const currentId = await this.getCurrentHabitId();
    if (currentId === id) {
      const habits = await this.getHabits();
      if (habits.length) {
        await this.setCurrentHabitId(habits[0].id);
      } else {
        await this.storage.remove("currentHabit");
      }
    }
  }

  // ----- Habitude courante -----

  // Renvoie l'id de l'habitude courante mémorisée (ou null).
  async getCurrentHabitId(): Promise<string | null> {
    return await this.storage.get("currentHabit") || null;
  }

  // Mémorise l'habitude courante.
  async setCurrentHabitId(id: string): Promise<void> {
    await this.storage.set("currentHabit", id);
  }

  // Renvoie l'habitude courante résolue (null si aucune habitude). Si la courante
  // mémorisée n'existe plus (ou aucune), retombe sur la première et la mémorise.
  async getCurrentHabit(): Promise<Habit | null> {
    const habits = await this.getHabits();
    if (habits.length === 0) {
      return null;
    }
    const id = await this.getCurrentHabitId();
    const found = habits.find((habit) => habit.id === id);
    if (found) {
      return found;
    }
    await this.setCurrentHabitId(habits[0].id);
    return habits[0];
  }
}
