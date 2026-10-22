// Public landing-page sample. Answers are still checked on the server so the
// sample behaves like the real practice flow.
import "server-only";
import { questions } from "./shared/builders";
import type { MCQ } from "./shared/types";

export const sampleItems: MCQ[] = [
  ...questions("shared", "reading", [
    [
      "sample-reading-b1-001",
      "B1",
      "specific_detail",
      "Bibliothèque",
      "avis",
      "Bibliothèque de quartier : à partir du 3 novembre, le prêt de livres numériques passe de deux à trois semaines. Les livres papier restent prêtés pour vingt et un jours.",
      "Qu'est-ce qui change le 3 novembre ?",
      "La durée du prêt des livres numériques.",
      "La durée du prêt des livres papier.",
      "Les horaires d'ouverture de la bibliothèque.",
      "Le nombre de livres qu'on peut emprunter.",
      "Only digital loans change (from two to three weeks); paper loans already last twenty-one days.",
      "Seul le prêt des livres numériques change (de deux à trois semaines) ; les livres papier étaient déjà prêtés pour vingt et un jours.",
    ],
  ]),
  ...questions("shared", "grammar", [
    [
      "sample-grammar-b1-001",
      "B1",
      "time_expressions",
      "Vie quotidienne",
      "phrase",
      "Complétez la phrase.",
      "J'habite à Montréal ___ trois ans, et je compte y rester.",
      "depuis",
      "pendant",
      "il y a",
      "dans",
      "Depuis links a past starting point to a situation that is still true.",
      "Depuis relie un point de départ passé à une situation toujours vraie aujourd’hui.",
    ],
  ]),
  ...questions("shared", "vocabulary", [
    [
      "sample-vocabulary-b2-001",
      "B2",
      "vocabulary_in_context",
      "Vie municipale",
      "article",
      "Le conseil municipal a décidé de reporter le vote : plusieurs résidents demandaient plus de temps pour étudier le projet.",
      "Que signifie « reporter » dans ce contexte ?",
      "Remettre à plus tard.",
      "Annuler définitivement.",
      "Raconter à la presse.",
      "Organiser plus vite.",
      "Reporter un vote means postponing it; residents wanted more time to study the project.",
      "Reporter un vote, c’est le remettre à plus tard : les résidents voulaient plus de temps pour étudier le projet.",
    ],
  ]),
];
