import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReminderPreferencesForm } from "./preferences";
const { save, refresh } = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue({ ok: true }),
  refresh: vi.fn(),
}));
vi.mock("@/app/actions/reminders", () => ({
  updateReminderPreferencesAction: save,
  getReminderPreferencesAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/i18n/client", () => ({ useI18n: () => ({ locale: "en" }) }));
vi.mock("@/components/providers/app-provider", () => ({
  useApp: () => ({ state: { user: null }, updateUser: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const initial = {
  enabled: true,
  timeZone: "America/Toronto",
  timeZoneSource: "auto" as const,
  targetDate: "2026-12-01",
};
it("allows opting out, manual timezone and clearing an exam date", async () => {
  render(<ReminderPreferencesForm initial={initial} />);
  fireEvent.click(screen.getByLabelText("Receive study reminders"));
  fireEvent.click(screen.getByLabelText("Detect my time zone when I visit"));
  fireEvent.change(screen.getByLabelText("Time zone"), {
    target: { value: "Europe/Paris" },
  });
  fireEvent.change(screen.getByLabelText("Exam date (optional)"), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      {
        enabled: false,
        timeZone: "Europe/Paris",
        timeZoneSource: "manual",
        targetDate: null,
      },
      true,
    ),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Preferences saved",
  );
});
it("does not overwrite the separate Settings goal editor when saving reminders", async () => {
  render(<ReminderPreferencesForm initial={initial} editExamDate={false} />);
  expect(
    screen.queryByLabelText("Exam date (optional)"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(initial, false));
});
