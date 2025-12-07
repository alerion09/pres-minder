import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteAccountPanel from "../DeleteAccountPanel";

const mockFetchResponse = (status: number, body: Record<string, unknown>) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe("DeleteAccountPanel", () => {
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

  it("should block delete if checkbox not acknowledged and show error", async () => {
    render(<DeleteAccountPanel />);

    await userEvent.click(screen.getByRole("button", { name: "Usuń konto" }));

    expect(fetchMock).not.toHaveBeenCalled();
    const button = screen.getByRole("button", { name: "Usuń konto" });
    expect(button).toBeDisabled();
  });

  it("should call delete endpoint and redirect on success", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(200, {}));
    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation(
        (fn, _delay) => realSetTimeout(fn as TimerHandler, 0) as unknown as ReturnType<typeof setTimeout>
      );
    const user = userEvent.setup();
    render(<DeleteAccountPanel />);

    await user.click(screen.getByLabelText(/rozumiem nieodwracalność operacji/i));
    await user.click(screen.getByRole("button", { name: "Usuń konto" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/account/delete",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");
  });

  it("should show backend error message on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(500, { error: "server_error" }));
    render(<DeleteAccountPanel />);

    await userEvent.click(screen.getByLabelText(/rozumiem nieodwracalność operacji/i));
    await userEvent.click(screen.getByRole("button", { name: "Usuń konto" }));

    expect(await screen.findByText("server_error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuń konto" })).not.toBeDisabled();
  });

  it("should show generic error message when backend error is missing", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(500, {}));
    render(<DeleteAccountPanel />);

    await userEvent.click(screen.getByLabelText(/rozumiem nieodwracalność operacji/i));
    await userEvent.click(screen.getByRole("button", { name: "Usuń konto" }));

    expect(await screen.findByText("Wystąpił błąd podczas usuwania konta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuń konto" })).not.toBeDisabled();
  });

  it("should show network error message on fetch rejection and reset pending", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    render(<DeleteAccountPanel />);

    await userEvent.click(screen.getByLabelText(/rozumiem nieodwracalność operacji/i));
    await userEvent.click(screen.getByRole("button", { name: "Usuń konto" }));

    expect(await screen.findByText("Wystąpił błąd. Spróbuj ponownie później.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuń konto" })).not.toBeDisabled();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should disable button while submitting and prevent duplicate requests", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<DeleteAccountPanel />);

    const checkbox = screen.getByLabelText(/rozumiem nieodwracalność operacji/i);
    const button = screen.getByRole("button", { name: "Usuń konto" });

    await user.click(checkbox);
    await user.click(button);
    await user.click(button);

    expect(button).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should render user email inside warning text when provided", () => {
    render(<DeleteAccountPanel userEmail="test@example.com" />);
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });
});
