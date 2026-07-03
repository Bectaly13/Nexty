// Notes de version de l'app, la plus récente en tête. Alimente la page « Notes de
// version ». La toute première version a une liste de points vide (rien à lister
// par rapport à un état antérieur).
export interface ReleaseNote {
  version: string;
  points: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.1",
    points: [
      "Les logs sont désormais enregistrés à la seconde près.",
      "Saisie simplifiée : un log « sur le moment » ne demande plus que l'habitude et un commentaire.",
      "Nouvelle saisie d'un log passé (date et heure) via une fenêtre dédiée."
    ]
  },
  {
    version: "1.0.1",
    points: [
      "Le sélecteur d'habitude se referme désormais toujours en revenant sur un onglet.",
      "Affichage stabilisé de la section « Depuis le dernier log »."
    ]
  },
  {
    version: "1.0",
    points: []
  }
];
