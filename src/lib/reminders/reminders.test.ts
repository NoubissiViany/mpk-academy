import { describe, expect, it } from "vitest";
import { chooseReminder } from "./eligibility";
import { calendarDaysUntil, localClock } from "./time";
import { renderReminder } from "./email";
import type { ReminderContext } from "./types";
import { getStudyPlan } from "@/lib/domain/study-plan";

const now = new Date("2026-11-26T23:00:00Z");
const ago = (hours: number) => new Date(+now - hours * 3_600_000).toISOString();
export const context = (
  changes: Partial<ReminderContext> = {},
): ReminderContext => ({
  userId: "00000000-0000-4000-8000-000000000001",
  email: "learner@example.test",
  firstName: "Camille",
  locale: "en",
  createdAt: ago(240),
  lastActiveAt: ago(80),
  lastLearningAt: null,
  enabled: true,
  verified: true,
  suppressed: false,
  timeZone: "America/Toronto",
  version: "00000000-0000-4000-8000-000000000002",
  unsubscribeVersion: "00000000-0000-4000-8000-000000000003",
  goalRevision: "2026-12-01:revision",
  targetDate: null,
  target: "NCLC 7",
  readiness: 50,
  weekStartedAt: "2026-11-23",
  sessions: 0,
  hasAccess: true,
  hasDiagnostic: true,
  pastExamNotified: null,
  attempts: [],
  pending: null,
  ...changes,
});

describe("reminder eligibility", () => {
  it("waits for verified accounts, 24 hours, and inactivity", () => {
    expect(chooseReminder(context(), now)?.kind).toBe("inactive");
    for (const changes of [
      { verified: false },
      { enabled: false },
      { suppressed: true },
      { createdAt: ago(23) },
      { lastActiveAt: ago(0.49) },
    ])
      expect(chooseReminder(context(changes), now)).toBeNull();
  });
  it("uses priority and pauses after a past exam notice until the date changes", () => {
    expect(
      chooseReminder(context({ targetDate: "2026-11-25" }), now)?.kind,
    ).toBe("exam_update");
    expect(
      chooseReminder(
        context({
          targetDate: "2026-11-25",
          pastExamNotified: "2026-12-01:revision",
        }),
        now,
      ),
    ).toBeNull();
    expect(
      chooseReminder(
        context({ targetDate: "2026-11-25", pastExamNotified: "old-revision" }),
        now,
      )?.kind,
    ).toBe("exam_update");
    expect(
      chooseReminder(context({ targetDate: "2026-11-26" }), now),
    ).toBeNull();
    expect(
      chooseReminder(context({ targetDate: "2026-12-10" }), now),
    ).toMatchObject({ kind: "countdown", daysLeft: 14 });
    expect(
      chooseReminder(context({ targetDate: "2026-12-11" }), now)?.kind,
    ).toBe("behind");
  });
  it("skips learning completed today but allows the past-date maintenance message", () => {
    expect(
      chooseReminder(
        context({ lastLearningAt: ago(4), targetDate: "2026-12-01" }),
        now,
      ),
    ).toBeNull();
    expect(
      chooseReminder(
        context({ lastLearningAt: ago(4), targetDate: "2026-11-20" }),
        now,
      )?.kind,
    ).toBe("exam_update");
  });
  it("does not invent weekly targets without an exam date", () => {
    expect(
      chooseReminder(context({ lastActiveAt: ago(71.9) }), now),
    ).toBeNull();
    expect(chooseReminder(context({ lastActiveAt: ago(72) }), now)).toEqual({
      kind: "inactive",
    });
  });
  it("enforces rolling frequency, spacing and dormant limits including uncertain sends", () => {
    expect(
      chooseReminder(
        context({ attempts: [{ at: ago(47.99), localDate: "2026-11-24" }] }),
        now,
      ),
    ).toBeNull();
    expect(
      chooseReminder(
        context({ attempts: [{ at: ago(48), localDate: "2026-11-24" }] }),
        now,
      )?.kind,
    ).toBe("inactive");
    const attempts = [49, 98, 150].map((n) => ({
      at: ago(n),
      localDate: ago(n).slice(0, 10),
    }));
    expect(chooseReminder(context({ attempts }), now)).toBeNull();
    expect(
      chooseReminder(
        context({ lastActiveAt: ago(721), attempts: attempts.slice(0, 1) }),
        now,
      ),
    ).toBeNull();
    expect(
      chooseReminder(
        context({
          lastActiveAt: ago(721),
          attempts: [{ at: ago(168), localDate: "2026-11-19" }],
        }),
        now,
      )?.kind,
    ).toBe("inactive");
    expect(
      chooseReminder(
        context({ attempts: [{ at: ago(49), localDate: "2026-11-26" }] }),
        now,
      ),
    ).toBeNull();
  });
  it("only retries the same eligible frozen message on the same evening", () => {
    const c = context();
    c.pending = {
      id: "delivery",
      kind: "inactive",
      version: c.version,
      goalRevision: c.goalRevision,
      email: c.email,
      localDate: "2026-11-26",
      attemptedAt: ago(0.25),
      eligibility: {
        locale: c.locale,
        hasAccess: c.hasAccess,
        hasDiagnostic: c.hasDiagnostic,
        timeZone: c.timeZone,
      },
    };
    c.attempts = [{ at: ago(0.25), localDate: "2026-11-26" }];
    expect(chooseReminder(c, now)?.kind).toBe("inactive");
    for (const changes of [
      { version: "changed" },
      { goalRevision: "changed" },
      { email: "new@example.test" },
      { locale: "fr" as const },
      { hasAccess: false },
      { timeZone: "America/Chicago" },
    ])
      expect(chooseReminder({ ...c, ...changes }, now)).toBeNull();
    expect(chooseReminder(c, new Date(+now + 2 * 3_600_000))).toBeNull();
  });
});
describe("calendar boundaries", () => {
  it("sends at local 18:00 across DST, half-hour zones and date boundaries", () => {
    expect(
      localClock(new Date("2026-03-07T23:00:00Z"), "America/Toronto").hour,
    ).toBe(18);
    expect(
      localClock(new Date("2026-03-08T22:00:00Z"), "America/Toronto").hour,
    ).toBe(18);
    expect(
      localClock(new Date("2026-11-01T23:00:00Z"), "America/Toronto").hour,
    ).toBe(18);
    expect(
      localClock(new Date("2026-11-26T21:30:00Z"), "America/St_Johns").hour,
    ).toBe(18);
    expect(
      localClock(new Date("2026-11-26T04:00:00Z"), "Pacific/Kiritimati"),
    ).toEqual({ date: "2026-11-26", hour: 18 });
    expect(
      chooseReminder(context(), new Date("2026-11-26T22:59:59Z")),
    ).toBeNull();
    expect(
      chooseReminder(context(), new Date("2026-11-27T01:00:00Z")),
    ).toBeNull();
    expect(
      calendarDaysUntil(
        "2026-03-09",
        new Date("2026-03-08T05:00:00Z"),
        "America/Toronto",
      ),
    ).toBe(1);
  });
  it("keeps Sunday-local/Monday-UTC practice expectations aligned with UTC totals", () => {
    const plan = getStudyPlan({
      targetDate: "2027-02-01",
      target: "NCLC 7",
      readiness: 70,
      weekly: {
        weekStartedAt: "2026-11-23",
        practiceSessions: 8,
        minutesStudied: 0,
        questionsReviewed: 0,
        readinessChange: 0,
      },
      now: new Date("2026-11-30T00:30:00Z"),
      timeZone: "America/Toronto",
    });
    expect(plan).toMatchObject({
      sessionsThisWeek: 0,
      expectedByToday: 0,
      status: "onTrack",
    });
  });
});
describe("bilingual email", () => {
  const options = {
    appUrl: "https://mpkacademy.com",
    unsubscribeUrl: "https://mpkacademy.com/unsubscribe?token=x",
    from: "MPK <no-reply@mpkacademy.com>",
    deliveryId: "test",
    beta: true,
  };
  it("escapes names and includes HTML, plain text and one-click unsubscribe headers", () => {
    const email = renderReminder(
      context({ firstName: '<script>alert("x")</script>', locale: "fr" }),
      { kind: "behind", sessions: 1, target: 4 },
      options,
    );
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("1 séance(s)");
    expect(email.text).toContain("4 recommandées");
    expect(email.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
  });
  it("routes to available activities and gives no invented progress for undated goals", () => {
    expect(
      renderReminder(
        context({ hasAccess: false }),
        { kind: "inactive" },
        options,
      ).text,
    ).toContain("https://mpkacademy.com/beta");
    expect(
      renderReminder(
        context({ hasDiagnostic: false }),
        { kind: "inactive" },
        options,
      ).text,
    ).toContain("https://mpkacademy.com/diagnostic");
    const email = renderReminder(context(), { kind: "inactive" }, options);
    expect(email.text).not.toMatch(/recommended|days away|undefined/);
    expect(
      renderReminder(context(), { kind: "exam_update" }, options).text,
    ).toContain("https://mpkacademy.com/email-preferences");
  });
});
