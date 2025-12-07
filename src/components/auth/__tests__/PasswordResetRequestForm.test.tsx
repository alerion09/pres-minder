import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordResetRequestForm } from "../PasswordResetRequestForm";

const validEmail = "user@example.com";

const mockFetchResponse = (status: number, body: Record<string, unknown>) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("PasswordResetRequestForm", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should block submit on invalid email and show validation message", async () => {
    render(<PasswordResetRequestForm />);

    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();
  });

  it("should focus email field when validation fails", async () => {
    render(<PasswordResetRequestForm />);

    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));

    const emailInput = screen.getByLabelText(/email/i);
    expect(document.activeElement).toBe(emailInput);
  });

  it("should clear field errors and success when email changes", async () => {
    render(<PasswordResetRequestForm />);

    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));
    expect(await screen.findByText("Email jest wymagany")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    expect(screen.queryByText("Email jest wymagany")).not.toBeInTheDocument();
  });

  it("should submit successfully, show success alert, and clear email", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, {}));
    render(<PasswordResetRequestForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/reset/request",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validEmail }),
        })
      );
      expect(
        screen.getByText(
          "Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy na niego instrukcje resetowania hasła. Sprawdź swoją skrzynkę odbiorczą."
        )
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
    });
  });

  it("should show server error message on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(500, { error: "server_error" }));
    render(<PasswordResetRequestForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));

    expect(await screen.findByText("server_error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyślij link resetujący" })).not.toBeDisabled();
  });

  it("should show network error message on fetch rejection and reset pending", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<PasswordResetRequestForm />);

    await userEvent.type(screen.getByLabelText(/email/i), validEmail);
    await userEvent.click(screen.getByRole("button", { name: "Wyślij link resetujący" }));

    expect(await screen.findByText("Wystąpił błąd połączenia. Sprawdź połączenie z internetem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyślij link resetujący" })).not.toBeDisabled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
