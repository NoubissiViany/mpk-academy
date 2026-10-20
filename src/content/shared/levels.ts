export const levels = ["A2", "B1", "B2", "C1"] as const;
export type ContentLevel = (typeof levels)[number];
export const difficultyByLevel = { A2: 1, B1: 2, B2: 3, C1: 4 } as const;
