import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  resend: vi.fn(),
  resetPassword: vi.fn(),
  updateUser: vi.fn(),
  rpc: vi.fn(),
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
    rpc: mocks.rpc,
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
  privacyConsent: true,
} as const;

describe("authentication action failures", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_BETA_MODE", "false");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

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

  it("stores a validated selected plan and privacy consent in signup metadata", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });

    await signUpAction({ ...registration, planId: "complete" });

    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            checkout_intent_plan_id: "complete",
            privacy_notice_version: expect.any(String),
            privacy_accepted_at: expect.any(String),
          }),
        }),
      }),
    );
  });

  it("refuses a sign-up without privacy consent", async () => {
    await expect(
      signUpAction({
        ...registration,
        privacyConsent: false as unknown as true,
      }),
    ).resolves.toMatchObject({ ok: false, reason: "invalid_submission" });
    expect(mocks.signUp).not.toHaveBeenCalled();
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

describe("closed beta sign-up", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_BETA_MODE", "true");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("checks the invite before creating the account and stores it for redemption", async () => {
    mocks.rpc.mockResolvedValue({ data: "valid", error: null });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });

    await expect(
      signUpAction({
        ...registration,
        inviteCode: " mpk-abcd-efgh ",
        planId: "complete",
      }),
    ).resolves.toEqual({ ok: true, confirmationRequired: true });

    expect(mocks.rpc).toHaveBeenCalledWith("mpk_check_beta_invite", {
      p_code: "mpk-abcd-efgh",
    });
    const metadata = mocks.signUp.mock.calls[0][0].options.data;
    expect(metadata.beta_invite_code).toBe("mpk-abcd-efgh");
    expect(metadata).not.toHaveProperty("checkout_intent_plan_id");
  });

  it("rejects a used invite without creating an account", async () => {
    mocks.rpc.mockResolvedValue({ data: "exhausted", error: null });

    await expect(
      signUpAction({ ...registration, inviteCode: "MPK-ABCD-EFGH" }),
    ).resolves.toMatchObject({ ok: false, reason: "invite_exhausted" });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("requires an invite code", async () => {
    await expect(signUpAction(registration)).resolves.toMatchObject({
      ok: false,
      reason: "invite_invalid",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("does not record checkout intents", async () => {
    await expect(setCheckoutIntentAction("complete")).resolves.toMatchObject({
      ok: false,
      reason: "invalid_plan",
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
