import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CheckoutSuccessView } from "./checkout-success-view";

afterEach(cleanup);

describe("checkout status", () => {
  it("offers a retry while payment confirmation is pending", () => {
    render(
      <CheckoutSuccessView
        status="pending"
        retryHref="/checkout/success?session_id=cs_test_123"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Payment confirmation pending" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Check payment again" }),
    ).toHaveAttribute("href", "/checkout/success?session_id=cs_test_123");
  });

  it("does not present an invalid session as a successful payment", () => {
    render(<CheckoutSuccessView status="invalid" />);
    expect(
      screen.getByRole("heading", { name: "Payment not confirmed" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute(
      "href",
      "/choose-plan",
    );
  });
});
