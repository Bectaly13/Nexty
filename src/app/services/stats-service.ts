import { Injectable } from '@angular/core';
import dayjs from 'dayjs';

import { Log, LogService } from './log-service';

// Durée écoulée depuis un log, décomposée pour l'affichage.
export interface SinceLastLog {
  log: Log;
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

// Unité de comptage (calendaire).
export type CountUnit = "day" | "week" | "month";

// Un point de la courbe : un jour et son nombre de logs.
export interface DailyCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  // Calculs statistiques (par habitude) à partir des logs. Service pur : il ne fait
  // que calculer, sans effet de bord. Toutes les dates passent par dayjs.

  constructor(
    private logs: LogService
  ) { }

  // Durée depuis le dernier log (null si aucun log).
  async sinceLastLog(habitId: string): Promise<SinceLastLog | null> {
    const last = await this.logs.getLastLog(habitId);
    if (!last) {
      return null;
    }
    const totalMinutes = dayjs().diff(dayjs(last.occurredAt), "minute");
    return {
      log: last,
      days: Math.floor(totalMinutes / 1440),
      hours: Math.floor((totalMinutes % 1440) / 60),
      minutes: totalMinutes % 60,
      totalMinutes: totalMinutes
    };
  }

  // Nombre de logs sur la période calendaire courante (jour, semaine ISO, ou mois).
  async count(habitId: string, unit: CountUnit): Promise<number> {
    const logs = await this.logs.getLogs(habitId);
    const now = dayjs();
    return logs.filter((log) => this.isSamePeriod(log.occurredAt, now, unit)).length;
  }

  // Jours du mois (numéros 1..31) comportant au moins un log, pour le calendrier.
  // `monthAnchor` est un ISO situé dans le mois voulu.
  async monthDays(habitId: string, monthAnchor: string): Promise<number[]> {
    const anchor = dayjs(monthAnchor);
    const logs = await this.logs.getLogs(habitId);
    const days = new Set<number>();
    for (const log of logs) {
      const d = dayjs(log.occurredAt);
      if (d.isSame(anchor, "month")) {
        days.add(d.date());
      }
    }
    return [...days].sort((a, b) => a - b);
  }

  // Série jour par jour (nombre de logs) entre deux dates incluses, pour la courbe.
  async dailyCounts(habitId: string, fromISO: string, toISO: string): Promise<DailyCount[]> {
    const logs = await this.logs.getLogs(habitId);
    const buckets = new Map<string, number>();
    for (const log of logs) {
      const key = dayjs(log.occurredAt).format("YYYY-MM-DD");
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const out: DailyCount[] = [];
    const to = dayjs(toISO).startOf("day");
    let cur = dayjs(fromISO).startOf("day");
    while (cur.isSameOrBefore(to, "day")) {
      const key = cur.format("YYYY-MM-DD");
      out.push({ date: key, count: buckets.get(key) || 0 });
      cur = cur.add(1, "day");
    }
    return out;
  }

  // Vrai si `iso` tombe dans la même période calendaire que `ref` (semaine = ISO, lundi).
  private isSamePeriod(iso: string, ref: dayjs.Dayjs, unit: CountUnit): boolean {
    const d = dayjs(iso);
    if (unit === "week") {
      return d.startOf("isoWeek").isSame(ref.startOf("isoWeek"));
    }
    return d.isSame(ref, unit);
  }
}
