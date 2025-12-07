import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordUpdateForm } from "../PasswordUpdateForm";
import { showSuccessToast } from "@/lib/utils/toast-helpers";

vi.mock("@/lib/utils/toast-helpers", () => ({
  showSuccessToast: vi.fn(),
}));

const validPassword = "StrongP@ssw0rd!";

const mockFetchResponse = (status: number, body: Record<string, unknown>) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("PasswordUpdateForm", () => {
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
    render(<PasswordUpdateForm />);

    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();
    expect(screen.getByText("Potwierdzenie hasła jest wymagane")).toBeInTheDocument();
  });

  it("should clear field errors and global error after changes", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(401, {}));
    render(<PasswordUpdateForm />);

    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));
    expect(await screen.findByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    expect(screen.queryByText("Hasło musi mieć co najmniej 8 znaków")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));
    expect(
      await screen.findByText("Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie")
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), "!");
    expect(
      screen.queryByText("Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie")
    ).not.toBeInTheDocument();
  });

  it("should update password successfully and redirect to login", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, {}));
    const user = userEvent.setup();
    render(<PasswordUpdateForm />);

    await user.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    await user.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await user.click(screen.getByRole("button", { name: "Zmień hasło" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/reset/confirm",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: validPassword }),
        })
      );
      expect(showSuccessToast).toHaveBeenCalledWith("Hasło zostało zmienione pomyślnie");
    });
    await waitFor(() => expect(window.location.href).toBe("/login"), { timeout: 2000 });
  });

  it("should show link invalid error for 401/400 responses and keep form enabled", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(400, {}));
    render(<PasswordUpdateForm />);

    await userEvent.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(
      await screen.findByText("Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zmień hasło" })).not.toBeDisabled();
  });

  it("should show backend error message on non-ok response with error payload", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(500, { error: "server_error" }));
    render(<PasswordUpdateForm />);

    await userEvent.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(await screen.findByText("server_error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zmień hasło" })).not.toBeDisabled();
  });

  it("should show network error message on fetch rejection and reset pending", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<PasswordUpdateForm />);

    await userEvent.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await userEvent.click(screen.getByRole("button", { name: "Zmień hasło" }));

    expect(await screen.findByText("Wystąpił błąd połączenia. Sprawdź połączenie z internetem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zmień hasło" })).not.toBeDisabled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should prevent duplicate submissions while request is pending", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<PasswordUpdateForm />);

    const submit = screen.getByRole("button", { name: "Zmień hasło" });
    await user.type(screen.getByLabelText(/nowe hasło/i), validPassword);
    await user.type(screen.getByLabelText(/potwierdź hasło/i), validPassword);
    await user.click(submit);
    await user.click(submit);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
  });
});
