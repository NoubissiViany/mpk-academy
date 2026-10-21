import { describe, expect, it } from "vitest";
import { checkWriting, countWords } from "./writing-checks";
import {
  compareBand,
  rawFeedbackSchema,
  targetBandFor,
  verifyFeedback,
  type RawFeedback,
} from "./writing-feedback";

const essay = `Madame, Monsieur,

Je vous écris pour vous parler de la journée sans voiture. D’abord, je pense que c’est une bonne idée parce que les enfants peuvent jouer dehors. Ensuite, l’air est plus propre. Cependant, les commerçants ont peur de perdre des clients.

En conclusion, je suis pour cette journée, mais il faut aider les magasin du centre-ville.`;

const raw = (overrides: Partial<RawFeedback> = {}): RawFeedback => ({
  criteria: [
    {
      id: "task",
      band: "B1",
      evidence: "je suis pour cette journée",
      comment: "Clear position.",
    },
    {
      id: "coherence",
      band: "B2",
      evidence: "D'abord, je pense",
      comment: "Good connectors.",
    },
    {
      id: "vocabulary",
      band: "B1",
      evidence: "a phrase the learner never wrote",
      comment: "Simple vocabulary.",
    },
    {
      id: "grammar",
      band: "B1",
      evidence: "les magasin du centre-ville",
      comment: "Agreement slips.",
    },
  ],
  fixes: [
    {
      quote: "les magasin du centre-ville",
      correction: "les magasins du centre-ville",
      explanation: "Plural noun.",
      category: "agreement",
    },
    {
      quote: "les enfants peuvent jouer dehors",
      correction:
        "the whole sentence replaced by something completely different and much longer than the original",
      explanation: "Too big.",
      category: "grammar",
    },
    {
      quote: "texte inventé",
      correction: "texte corrigé",
      explanation: "Not in the essay.",
      category: "spelling",
    },
  ],
  rewrite: {
    original: "Ensuite, l’air est plus propre.",
    improved: "Ensuite, l’air y serait nettement plus pur.",
  },
  summary: "Clear opinion; check plural agreement.",
  ...overrides,
});

describe("rule-based writing checks", () => {
  it("counts words, paragraphs, connectors, and the form of address", () => {
    const checks = checkWriting(essay, { min: 200 });
    expect(checks.words).toBe(countWords(essay));
    expect(checks.length).toBe("under");
    expect(checks.paragraphs).toBe(3);
    expect(checks.address).toBe("vous");
    expect(checks.connectors).toEqual(
      expect.arrayContaining([
        "d’abord",
        "ensuite",
        "cependant",
        "en conclusion",
        "mais",
      ]),
    );
    expect(checks.connectors).not.toContain("car");
    expect(checks.variety).toBe("ok");
  });

  it("flags mixed tu and vous, and a range it exceeds", () => {
    const checks = checkWriting(
      "Salut, tu vas bien ? Je vous remercie. Merci.",
      {
        min: 2,
        max: 5,
      },
    );
    expect(checks.address).toBe("mixed");
    expect(checks.length).toBe("over");
    expect(checks.variety).toBe("low");
  });

  it("does not mistake words that contain tu or car", () => {
    expect(checkWriting("Une voiture tuée par le carburant.").address).toBe(
      "none",
    );
    expect(checkWriting("Le carnaval arrive.").connectors).toEqual([]);
  });
});

describe("AI feedback verification", () => {
  it("keeps only quotes found in the essay and small corrections", () => {
    const verified = verifyFeedback(essay, rawFeedbackSchema.parse(raw()))!;
    expect(verified.fixes).toEqual([
      expect.objectContaining({ quote: "les magasin du centre-ville" }),
    ]);
    // Typographic apostrophes match straight ones.
    expect(verified.criteria[1].evidence).toBe("D'abord, je pense");
    expect(verified.criteria[2].evidence).toBeNull();
    expect(verified.rewrite?.improved).toContain("nettement");
    expect(verified.dropped).toBe(3);
  });

  it("rejects feedback that misses a criterion", () => {
    const partial = raw();
    expect(
      verifyFeedback(essay, {
        ...partial,
        criteria: partial.criteria.slice(1),
      }),
    ).toBeNull();
  });

  it("drops a rewrite of text the learner did not write", () => {
    const verified = verifyFeedback(
      essay,
      raw({
        rewrite: {
          original: "Une phrase qui n’existe pas du tout ici.",
          improved: "Autre.",
        },
      }),
    )!;
    expect(verified.rewrite).toBeNull();
  });

  it("compares bands with the target level", () => {
    expect(targetBandFor["NCLC 7"]).toBe("B2");
    expect(compareBand("B1", "B2")).toBe(-1);
    expect(compareBand("C1", "B2")).toBe(1);
  });
});
