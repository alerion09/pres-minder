import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";
import { showSuccessToast } from "@/lib/utils/toast-helpers";

vi.mock("@/lib/utils/toast-helpers", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

const validEmail = "user@example.com";
const validPassword = "StrongP@ssw0rd!";

const mockFetchResponse = (status: number, body: Record<string, unknown>) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("LoginForm", () => {
  const originalLocation = window.location;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "http://localhost/" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { writable: true, value: originalLocation });
    vi.restoreAllMocks();
  });

  it("should block submit on client-side validation errors and show messages", async () => {
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();
    expect(screen.getByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).not.toBeDisabled();
  });

  it("should clear field and global errors after field change", async () => {
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    expect(screen.queryByText("Email jest wymagany")).not.toBeInTheDocument();
    expect(screen.getByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(await mockFetchResponse(401, { error: "invalid_credentials" }));
    await userEvent.type(screen.getByLabelText(/hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
    expect(await screen.findByText("Nieprawidłowy email lub hasło")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/hasło/i), "!");
    await waitFor(() => expect(screen.queryByText("Nieprawidłowy email lub hasło")).not.toBeInTheDocument());
  });

  it("should show toast and redirect to home on successful login", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, { message: "ok" }));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    await waitFor(() => {
      expect(showSuccessToast).toHaveBeenCalledWith("Zalogowano pomyślnie");
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validEmail, password: validPassword }),
        })
      );
      expect(window.location.href).toBe("/");
    });
    expect(screen.getByRole("button", { name: "Zaloguj się" })).not.toBeDisabled();
  });

  it("should set invalid credentials message for 401 invalid_credentials response", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(401, { error: "invalid_credentials" }));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByText("Nieprawidłowy email lub hasło")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).not.toBeDisabled();
  });

  it("should show rate limit message on 429 responses", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(429, { error: "rate_limited" }));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByText("Zbyt wiele prób logowania. Spróbuj ponownie później")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).not.toBeDisabled();
  });

  it("should show network error message and re-enable form on fetch rejection", async () => {
    const networkError = new Error("network");
    fetchMock.mockRejectedValueOnce(networkError);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(await screen.findByText("Wystąpił błąd połączenia. Sprawdź połączenie z internetem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zaloguj się" })).not.toBeDisabled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
