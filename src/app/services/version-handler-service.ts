import { Injectable } from '@angular/core';

import { ColorService } from './color-service';
import { DatabaseService } from './database-service';
import { StorageService } from './storage-service';

@Injectable({
  providedIn: 'root',
})
export class VersionHandlerService {
  // Gère les montées de version du format de la bdd : pose la version au premier
  // lancement, sème les données initiales, puis applique séquentiellement les
  // migrations nécessaires quand le format évolue (nouvelles tables, nouveaux
  // champs…). Évite d'éparpiller des correctifs de migration dans le reste du code.

  // Version du **format de stockage** (entier) : à incrémenter à chaque changement
  // de format, en ajoutant la migration updateToVx() correspondante. Sert à garantir
  // qu'un utilisateur d'une version antérieure récupère des données au bon format.
  // Indépendante de la version affichée ci-dessous.
  private readonly appVersion: number = 1;
  // Version **commerciale**, destinée à l'utilisateur (illustre l'ampleur des mises
  // à jour). Sans rapport avec appVersion. Doit toujours correspondre au versionName
  // de android/app/build.gradle.
  readonly appVersionDisplay: string = "1.0";

  constructor(
    private storage: StorageService,
    private db: DatabaseService,
    private colors: ColorService
  ) { }

  // À appeler une seule fois au démarrage de l'application, avant toute lecture de la bdd.
  async init(): Promise<void> {
    const userVersion: number = await this.storage.get("version");

    // Palette de couleurs : semée si absente (idempotent). Appelée à chaque
    // démarrage pour garantir sa présence.
    await this.colors.seed();

    // Premier lancement (ou utilisateur antérieur au versionnage) : on pose la
    // version courante et on matérialise la db. db.get() renvoie les données
    // existantes si elles existent, sinon la structure par défaut → aucune perte.
    if (!userVersion) {
      await this.db.update(await this.db.get());

      // Le thème par défaut est géré par ThemeService.

      await this.storage.set("version", this.appVersion);
      return;
    }

    // Déjà à jour : rien à faire.
    if (userVersion === this.appVersion) {
      return;
    }

    // Sinon, on applique les migrations dans l'ordre croissant, puis on enregistre
    // la nouvelle version.
    // if (userVersion < 2) {
    //   await this.updateToV2();
    // }
    // await this.storage.set("version", this.appVersion);
  }

  // Migration v1 → v2 : <explication de la migration>.
  // private async updateToV2(): Promise<void> {
  //   const db = await this.db.get();
  //   // ... transformations du format ...
  //   await this.db.update(db);
  // }
}
