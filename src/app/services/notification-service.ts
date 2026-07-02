import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings';
import dayjs from 'dayjs';

import { Habit, HabitService } from './habit-service';
import { LogService } from './log-service';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Rappels locaux : planifie une notification toutes les 24 h depuis le dernier
  // log d'une habitude. Seul service à connaître le plugin natif.
  // Une notification n'est émise que si l'interrupteur global ET le toggle de
  // l'habitude sont actifs.

  // Intervalle du rappel (heures). Fixe pour l'instant (cf cahier des charges).
  private readonly INTERVAL_HOURS = 24;

  constructor(
    private storage: StorageService,
    private habits: HabitService,
    private logs: LogService
  ) { }

  // ----- Interrupteur global -----

  // Interrupteur global des notifications (activé par défaut).
  async getEnabled(): Promise<boolean> {
    const value = await this.storage.get("notificationsEnabled");
    return value === null || value === undefined ? true : value;
  }

  // État « effectif » des notifications : l'interrupteur global ET (sur natif) la
  // permission système doivent être actifs. Sur le web, seule compte la préférence.
  async isActive(): Promise<boolean> {
    if (!(await this.getEnabled())) {
      return false;
    }
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    return this.checkPermission();
  }

  // Active/désactive globalement les notifications, et (re)planifie ou annule tout.
  async setEnabled(enabled: boolean): Promise<void> {
    await this.storage.set("notificationsEnabled", enabled);
    if (enabled) {
      await this.rescheduleAll();
    } else {
      await this.cancelAll();
    }
  }

  // Demande la permission d'afficher des notifications (natif uniquement).
  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  }

  // Statut actuel de la permission, sans afficher de dialogue (natif uniquement).
  async checkPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const result = await LocalNotifications.checkPermissions();
    return result.display === "granted";
  }

  // Vrai sur plateforme native (les notifications n'existent pas sur le web).
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Ouvre l'écran de réglages des notifications de l'app (pour réautoriser après un refus).
  async openSettings(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await NativeSettings.open({
      optionAndroid: AndroidSettings.AppNotification,
      optionIOS: IOSSettings.App
    });
  }

  // ----- Planification -----

  // (Re)planifie le rappel d'une habitude à partir de son dernier log (ou de
  // maintenant si aucun log). Annule d'abord l'éventuel rappel existant. Sans effet
  // hors plateforme native, ou si l'interrupteur global / le toggle est désactivé.
  async scheduleForHabit(habit: Habit, lastLogISO: string | null): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await this.cancelForHabit(habit.id);
    // On ne planifie que si l'habitude le veut, l'interrupteur global est actif et
    // la permission système est accordée.
    if (!habit.notify || !(await this.getEnabled()) || !(await this.checkPermission())) {
      return;
    }

    // Point de départ = dernier log (ou maintenant), + l'intervalle. Si l'échéance
    // est déjà passée, on avance au prochain multiple à venir.
    let fire = dayjs(lastLogISO ?? undefined).add(this.INTERVAL_HOURS, "hour");
    const now = dayjs();
    if (fire.isBefore(now)) {
      const missedDays = Math.ceil(now.diff(fire, "day", true));
      fire = fire.add(missedDays, "day");
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: this.notifId(habit.id),
        title: "Nexty",
        // Texte fixe, positif : rappelle chaque jour qu'un cycle de 24 h de plus
        // s'est écoulé sans l'habitude (répétition quotidienne via `every: "day"`).
        body: `24 h de plus sans « ${habit.name} » !`,
        schedule: { at: fire.toDate(), every: "day", allowWhileIdle: true }
      }]
    });
  }

  // Annule le rappel d'une habitude.
  async cancelForHabit(habitId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await LocalNotifications.cancel({ notifications: [{ id: this.notifId(habitId) }] });
  }

  // (Re)planifie le rappel d'une seule habitude à partir de son dernier log
  // (à appeler après un log, un toggle de notification, etc.).
  async rescheduleForHabit(habitId: string): Promise<void> {
    const habit = await this.habits.getHabit(habitId);
    if (!habit) {
      return;
    }
    const last = await this.logs.getLastLog(habitId);
    await this.scheduleForHabit(habit, last ? last.occurredAt : null);
  }

  // Replanifie les rappels de toutes les habitudes (ex. au démarrage, ou après
  // réactivation globale).
  async rescheduleAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const habits = await this.habits.getHabits();
    for (const habit of habits) {
      const last = await this.logs.getLastLog(habit.id);
      await this.scheduleForHabit(habit, last ? last.occurredAt : null);
    }
  }

  // Annule les rappels de toutes les habitudes.
  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const habits = await this.habits.getHabits();
    for (const habit of habits) {
      await this.cancelForHabit(habit.id);
    }
  }

  // Dérive un id numérique stable (requis par le plugin) depuis l'id d'habitude (uuid).
  private notifId(habitId: string): number {
    let hash = 0;
    for (let i = 0; i < habitId.length; i++) {
      hash = (hash * 31 + habitId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
