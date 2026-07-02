import { Injectable } from '@angular/core';
import dayjs from 'dayjs';

import { DatabaseService } from './database-service';

// Une occurrence déclarée d'une habitude (1 log = 1 occurrence unitaire).
export interface Log {
  id: string;
  habitId: string;
  occurredAt: string; // horodatage ISO du moment de l'occurrence
  comment: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  // Gère les logs (CRUD) d'une habitude.

  constructor(
    private db: DatabaseService
  ) { }

  // Renvoie les logs d'une habitude (ordre de stockage, non trié).
  async getLogs(habitId: string): Promise<Log[]> {
    return await this.db.getEntriesWith("logs", "habitId", habitId);
  }

  // Renvoie le log le plus récent d'une habitude, ou null.
  async getLastLog(habitId: string): Promise<Log | null> {
    const logs = await this.getLogs(habitId);
    if (logs.length === 0) {
      return null;
    }
    return logs.reduce((a, b) => (dayjs(a.occurredAt).isAfter(dayjs(b.occurredAt)) ? a : b));
  }

  // Ajoute un log. `occurredAt` est un ISO (par défaut « maintenant », ou une date
  // passée pour rattraper un oubli).
  async addLog(habitId: string, occurredAt: string, comment: string | null): Promise<Log> {
    const log: Log = {
      id: crypto.randomUUID(),
      habitId: habitId,
      occurredAt: occurredAt,
      comment: comment
    };
    await this.db.addEntry("logs", log);
    return log;
  }

  // Modifie un log (ex. horodatage ou commentaire).
  async editLog(id: string, changes: Partial<Log>): Promise<void> {
    await this.db.updateEntriesWith("logs", "id", id, changes);
  }

  // Supprime un log.
  async removeLog(id: string): Promise<void> {
    await this.db.removeEntriesWith("logs", "id", id);
  }
}
