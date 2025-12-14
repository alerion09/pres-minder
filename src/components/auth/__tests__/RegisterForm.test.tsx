import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../RegisterForm";
import { showSuccessToast } from "@/lib/utils/toast-helpers";

vi.mock("@/lib/utils/toast-helpers", () => ({
  showSuccessToast: vi.fn(),
}));

const validEmail = "user@example.com";
const validPassword = "StrongP@ssw0rd!";

const mockFetchResponse = (status: number, body: Record<string, unknown>) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("RegisterForm", () => {
  const originalLocation = window.location;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.clearAllMocks();
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
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();
    expect(screen.getByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();
    expect(screen.getByText("Potwierdzenie hasła jest wymagane")).toBeInTheDocument();
  });

  it("should clear field and global errors after field change", async () => {
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    expect(screen.queryByText("Email jest wymagany")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), "Mismatch!");
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));
    expect(await screen.findByText("Hasła muszą być identyczne")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword.slice(-1));
    expect(screen.queryByText("Hasła muszą być identyczne")).not.toBeInTheDocument();
  });

  it("should leave focus on submit when validation fails (current behavior)", async () => {
    render(<RegisterForm />);

    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    const active = document.activeElement as HTMLElement | null;
    expect(active?.getAttribute("type")).toBe("submit");
  });

  it("should register successfully without email verification", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, { requiresEmailVerification: false }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validEmail, password: validPassword, confirmPassword: validPassword }),
        })
      );
      expect(showSuccessToast).toHaveBeenCalledWith("Konto zostało utworzone pomyślnie");
      expect(window.location.href).toBe("/");
    });
  });

  it("should register with email verification flow and show success message", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, { requiresEmailVerification: true }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    await waitFor(() => {
      expect(screen.getByText("Konto zostało utworzone!")).toBeInTheDocument();
      expect(
        screen.getByText("Sprawdź swoją skrzynkę email i potwierdź konto, aby móc się zalogować.")
      ).toBeInTheDocument();
      expect(showSuccessToast).not.toHaveBeenCalled();
      expect(window.location.href).toBe("http://localhost/");
    });
  });

  it("should show conflict error on 409 responses and re-enable submit", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(409, { error: "conflict" }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(await screen.findByText("Ten adres email jest już zajęty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Utwórz konto" })).not.toBeDisabled();
  });

  it("should show validation error on 422 responses and re-enable submit", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(422, { error: "invalid_payload" }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(await screen.findByText("invalid_payload")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Utwórz konto" })).not.toBeDisabled();
  });

  it("should show network error message on fetch rejection and reset pending", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.type(screen.getByLabelText(/Hasło/), validPassword);
    await userEvent.type(screen.getByLabelText(/Powtórz hasło/), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Utwórz konto" }));

    expect(await screen.findByText("Wystąpił błąd połączenia. Sprawdź połączenie z internetem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Utwórz konto" })).not.toBeDisabled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
