import { beforeEach, describe, expect, it } from "vitest";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { loadState, saveState } from "@/lib/persistence";
import { LocalAuthError, localAuthRepository } from "./local-auth";

const input = {
  firstName: "Amina",
  lastName: "Diallo",
  email: " Amina@Example.com ",
  password: "password123",
  locale: "en" as const,
  assistance: "full" as const,
  goal: { exam: "TEF Canada" as const, target: "NCLC 7" as const },
};

describe("local authentication", () => {
  beforeEach(() => localStorage.clear());

  it("stores a salted verifier and restores a valid session", async () => {
    const user = await localAuthRepository.register(input);
    saveState({ ...defaultState, user });

    const rawAccounts =
      localStorage.getItem(productConfig.accountsStorageKey) ?? "";
    expect(rawAccounts).not.toContain(input.password);
    expect(rawAccounts).toContain("passwordHash");
    expect(loadState().user?.email).toBe("amina@example.com");

    await localAuthRepository.logout();
    expect(loadState().user).toBeNull();
    await expect(
      localAuthRepository.login("AMINA@example.com", input.password),
    ).resolves.toMatchObject({ id: user.id });
    expect(loadState().user?.id).toBe(user.id);
  });

  it("rejects duplicate email addresses and invalid credentials", async () => {
    await localAuthRepository.register(input);
    await expect(localAuthRepository.register(input)).rejects.toMatchObject({
      code: "duplicate_email",
    } satisfies Partial<LocalAuthError>);
    await localAuthRepository.logout();
    await expect(
      localAuthRepository.login(input.email, "incorrect-password"),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
  });

  it("keeps learner state isolated by account", async () => {
    const first = await localAuthRepository.register(input);
    saveState({
      ...defaultState,
      user: first,
      activities: [
        {
          id: "first-activity",
          label: "Assessment completed",
          detail: "B1 estimated level",
          timestamp: "2026-09-15T12:00:00.000Z",
        },
      ],
    });
    await localAuthRepository.logout();

    const second = await localAuthRepository.register({
      ...input,
      email: "second@example.com",
    });
    saveState({ ...defaultState, user: second });
    expect(loadState().activities).toEqual([]);

    await localAuthRepository.logout();
    await localAuthRepository.login(input.email, input.password);
    expect(loadState().activities[0]?.id).toBe("first-activity");
  });
});
