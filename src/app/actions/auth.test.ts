import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  resend: vi.fn(),
  resetPassword: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://mpk-academy.vercel.app",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: mocks.signUp,
      signInWithPassword: mocks.signIn,
      resend: mocks.resend,
      resetPasswordForEmail: mocks.resetPassword,
      updateUser: mocks.updateUser,
    },
  }),
}));

import {
  requestPasswordResetAction,
  resendConfirmationAction,
  setCheckoutIntentAction,
  signInAction,
  signUpAction,
} from "./auth";

const registration = {
  firstName: "Amina",
  lastName: "Diallo",
  email: "learner@example.com",
  password: "password123",
  locale: "en",
  exam: "TEF Canada",
  target: "NCLC 7",
} as const;

describe("authentication action failures", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("returns an explicit unconfirmed-email result", async () => {
    mocks.signIn.mockResolvedValue({
      error: {
        name: "AuthApiError",
        code: "email_not_confirmed",
        status: 400,
      },
    });

    await expect(
      signInAction({
        email: registration.email,
        password: registration.password,
      }),
    ).resolves.toMatchObject({
      ok: false,
      reason: "email_not_confirmed",
      message: expect.stringContaining("Confirm your email"),
      reference: expect.any(String),
    });
  });

  it("keeps invalid credentials distinct from service failures", async () => {
    mocks.signIn.mockResolvedValue({
      error: {
        name: "AuthApiError",
        code: "invalid_credentials",
        status: 400,
      },
    });

    await expect(
      signInAction({
        email: registration.email,
        password: registration.password,
      }),
    ).resolves.toMatchObject({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("identifies confirmation-email rate limits", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: null },
      error: {
        name: "AuthApiError",
        code: "over_email_send_rate_limit",
        status: 429,
      },
    });

    await expect(signUpAction(registration)).resolves.toMatchObject({
      ok: false,
      reason: "rate_limited",
      reference: expect.any(String),
    });
  });

  it("never logs the submitted email or password", async () => {
    mocks.signIn.mockRejectedValue(new Error("network unavailable"));

    await signInAction({
      email: registration.email,
      password: registration.password,
    });

    const serializedLog = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(serializedLog).not.toContain(registration.email);
    expect(serializedLog).not.toContain(registration.password);
  });

  it("uses the trusted app callback for signup, resend, and recovery", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.resend.mockResolvedValue({ error: null });
    mocks.resetPassword.mockResolvedValue({ error: null });

    await signUpAction(registration);
    await resendConfirmationAction(registration.email);
    await requestPasswordResetAction(registration.email);

    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: "https://mpk-academy.vercel.app/auth/confirm",
        }),
      }),
    );
    expect(mocks.resend).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          emailRedirectTo: "https://mpk-academy.vercel.app/auth/confirm",
        },
      }),
    );
    expect(mocks.resetPassword).toHaveBeenCalledWith(registration.email, {
      redirectTo: "https://mpk-academy.vercel.app/auth/confirm",
    });
  });

  it("stores a validated selected plan in signup metadata", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });

    await signUpAction({ ...registration, planId: "intensive" });

    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            checkout_intent_plan_id: "intensive",
          }),
        }),
      }),
    );
  });

  it("updates an authenticated learner's checkout intent", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });

    await expect(setCheckoutIntentAction("essential")).resolves.toEqual({
      ok: true,
      planId: "essential",
    });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { checkout_intent_plan_id: "essential" },
    });
  });

  it("rejects an invalid checkout intent with a support reference", async () => {
    await expect(setCheckoutIntentAction("free")).resolves.toMatchObject({
      ok: false,
      reason: "invalid_plan",
      reference: expect.any(String),
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
