import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminSubmitButton, CopyInviteCode } from "./controls";
const mocks = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mocks.error.mockReset();
});
describe("invitation controls", () => {
  it("copies only the code and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<CopyInviteCode code="MPK-EXAMPLE" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Copy invitation code/ }),
    );
    expect(await screen.findByText("Copied")).toBeVisible();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("MPK-EXAMPLE");
  });
  it("reports clipboard failure without claiming success", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    render(<CopyInviteCode code="MPK-EXAMPLE" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        expect.stringContaining("manually"),
      ),
    );
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });
  it.each([
    ["Create invite", "Creating invite…"],
    ["Save settings", "Saving settings…"],
    ["Revoke", "Revoking…"],
  ])(
    "prevents duplicate %s submissions while leaving other forms usable",
    async (label, pendingLabel) => {
      let resolve!: () => void;
      const delayed = vi.fn(
        () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      );
      render(
        <>
          <form action={delayed}>
            <AdminSubmitButton pendingLabel={pendingLabel}>
              {label}
            </AdminSubmitButton>
          </form>
          <form action={async () => {}}>
            <AdminSubmitButton pendingLabel="Saving…">
              Other form
            </AdminSubmitButton>
          </form>
        </>,
      );
      fireEvent.click(screen.getByRole("button", { name: label }));
      const pending = await screen.findByRole("button", { name: pendingLabel });
      expect(pending).toBeDisabled();
      expect(pending).toHaveAttribute("aria-busy", "true");
      fireEvent.click(pending);
      expect(delayed).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Other form" })).toBeEnabled();
      await act(async () => resolve());
      expect(screen.getByRole("button", { name: label })).toBeEnabled();
    },
  );
});
