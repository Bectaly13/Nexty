// Configuration centralisée de dayjs : locale française et plugins utilisés dans l'app.
// Ce fichier est importé une seule fois au démarrage (main.ts) pour ses effets de bord.
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Semaine ISO (démarre le lundi) pour les comptages hebdomadaires.
dayjs.extend(isoWeek);
// Comparaisons bornes incluses (plages de dates : début/fin de jour, semaine, mois…).
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
// Parsing de formats personnalisés (ex. horodatage saisi à la main lors d'un rattrapage).
dayjs.extend(customParseFormat);

// Locale française : mois/jours en français, semaine démarrant le lundi, format 24 h.
dayjs.locale("fr");
