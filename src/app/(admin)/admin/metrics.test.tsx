import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  EngagementSummary,
  FunnelSection,
  overviewSchema,
  TestersSection,
} from "./metrics";

afterEach(cleanup);

describe("admin metrics", () => {
  it("totals the funnel by language and relates each step to landing views", () => {
    render(
      <FunnelSection
        funnel={[
          { step: "landing_view", locale: "en", last7: 30, last30: 80 },
          { step: "landing_view", locale: "fr", last7: 10, last30: 20 },
          { step: "diagnostic_started", locale: "fr", last7: 5, last30: 25 },
        ]}
      />,
    );
    const landing = screen.getByText("Viewed the landing page").closest("tr")!;
    expect(within(landing).getByText("40")).toBeInTheDocument();
    expect(within(landing).getByText("100")).toBeInTheDocument();
    const started = screen.getByText("Started the diagnostic").closest("tr")!;
    expect(within(started).getByText("25%")).toBeInTheDocument();
    const activated = screen.getByText("Activated beta access").closest("tr")!;
    expect(within(activated).getByText("0%")).toBeInTheDocument();
  });

  it("explains when no tester can be measured after week one yet", () => {
    render(
      <EngagementSummary
        summary={{
          activated: 3,
          active7: 2,
          weekEligible: 0,
          weekReturned: 0,
          firstLearningCompleted: 2,
        }}
      />,
    );
    expect(screen.getByText("2 of 3 (67%)")).toBeVisible();
    expect(
      screen.getByText("No tester has passed day 7 yet"),
    ).toBeInTheDocument();
  });

  it("shows activation completion in French", () => {
    render(
      <EngagementSummary
        locale="fr"
        summary={{
          activated: 3,
          active7: 2,
          weekEligible: 0,
          weekReturned: 0,
          firstLearningCompleted: 2,
        }}
      />,
    );
    expect(
      screen.getByText("Première leçon ou séance terminée après l’activation"),
    ).toBeVisible();
    expect(screen.getByText("2 sur 3 (67%)")).toBeVisible();
  });

  it("keeps access and activity visible after an invitation is removed", () => {
    const joinedAt = "2026-10-01T12:00:00+00:00";
    const overview = overviewSchema.parse({
      seatLimit: 40,
      accessDays: 90,
      seatsUsed: 2,
      invites: [],
      testers: [
        {
          email: "amina@example.test",
          firstName: "Amina",
          code: null,
          redeemedAt: joinedAt,
          accessUntil: null,
          active: true,
        },
        {
          email: "new@example.test",
          firstName: "New",
          code: "MPK-CCCC-DDDD",
          redeemedAt: "2026-10-18T12:00:00+00:00",
          accessUntil: null,
          active: true,
        },
      ],
    });
    render(
      <TestersSection
        formatDate={(value) => value ?? "—"}
        access={overview.testers}
        engagement={[
          {
            email: "amina@example.test",
            firstName: "Amina",
            locale: "fr",
            joinedAt,
            lastActiveAt: "2026-10-18T12:00:00+00:00",
            activeDays7: 3,
            weekEligible: true,
            returnedAfterWeek: true,
            diagnostics: 1,
            mockExams: 0,
            practiceSessions: 6,
            writingTasks: 2,
            speakingTasks: 1,
            lessons: 4,
          },
        ]}
      />,
    );
    const amina = screen.getByText("amina@example.test").closest("tr")!;
    expect(within(amina).getByText("Removed")).toBeInTheDocument();
    expect(within(amina).getByText(joinedAt)).toBeInTheDocument();
    expect(within(amina).getByText("Active")).toBeInTheDocument();
    expect(within(amina).getByText("Yes")).toBeInTheDocument();
    expect(within(amina).getByText("6")).toBeInTheDocument();
    expect(within(amina).getByText("fr")).toBeInTheDocument();
    const fresh = screen.getByText("new@example.test").closest("tr")!;
    expect(within(fresh).getByText("MPK-CCCC-DDDD")).toBeInTheDocument();
    expect(within(fresh).getByText("Too early")).toBeInTheDocument();
  });
});
