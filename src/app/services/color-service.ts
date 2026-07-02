import { Injectable } from '@angular/core';

import { DatabaseService } from './database-service';

// Une couleur de la palette figée, référencée par les habitudes via son id.
export interface Color {
  id: string;
  value: string;
}

// Palette figée : couleurs classiques, bien visibles en thème Clair comme Sombre.
// Le bleu (#3B82F6) est réservé à l'accent de l'UI, donc absent de la palette.
// Les ids sont des slugs STABLES (et non des UUID) : une palette figée doit garder
// des identifiants constants pour que les habitudes conservent leur couleur même
// si la table est re-semée un jour.
export const PALETTE: Color[] = [
  { id: "red", value: "#EF4444" },
  { id: "orange", value: "#F97316" },
  { id: "amber", value: "#F59E0B" },
  { id: "green", value: "#22C55E" },
  { id: "teal", value: "#14B8A6" },
  { id: "cyan", value: "#06B6D4" },
  { id: "indigo", value: "#6366F1" },
  { id: "violet", value: "#8B5CF6" },
  { id: "rose", value: "#EC4899" },
  { id: "slate", value: "#64748B" }
];

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  // Donne accès à la palette figée et résout un colorId en sa valeur.

  constructor(
    private db: DatabaseService
  ) { }

  // Sème la table colors au premier lancement. Idempotent : ne fait rien si la
  // palette est déjà en place.
  async seed(): Promise<void> {
    const colors = await this.db.getTable("colors");
    if (!colors || colors.length === 0) {
      await this.db.updateTable("colors", PALETTE);
    }
  }

  // Renvoie toute la palette (depuis la db).
  async getColors(): Promise<Color[]> {
    return await this.db.getTable("colors") || [];
  }

  // Renvoie une couleur par son id, ou undefined si introuvable.
  async getColor(id: string): Promise<Color | undefined> {
    return await this.db.getEntryWith("colors", "id", id);
  }
}
