import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogoutButton from "../LogoutButton";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";

vi.mock("@/lib/utils/toast-helpers", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

const mockFetchResponse = (ok: boolean) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve({}),
  } as Response);

describe("LogoutButton", () => {
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
    vi.useRealTimers();
    Object.defineProperty(window, "location", { writable: true, value: originalLocation });
    vi.restoreAllMocks();
  });

  it("should call logout endpoint and redirect after successful response", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(true));
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation((fn) => {
      if (typeof fn === "function") {
        (fn as () => void)();
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(showSuccessToast).toHaveBeenCalledWith("Wylogowano pomyślnie");

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(window.location.href).toBe("/");
  });

  it("should prevent duplicate submissions while request is pending", async () => {
    // Keep promise pending to simulate in-flight request
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Wyloguj" });
    await user.click(button);
    await user.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });

  it("should show spinner while loading", async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    const { container } = render(<LogoutButton />);

    expect(container.querySelector("svg.animate-spin")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Wyloguj" }));
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("should show error toast and re-enable button on non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(false));
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Wyloguj" });
    await user.click(button);

    expect(await screen.findByRole("button", { name: "Wyloguj" })).not.toBeDisabled();
    expect(showErrorToast).toHaveBeenCalledWith("Nie udało się wylogować. Spróbuj ponownie.");
  });

  it("should show error toast and re-enable button on fetch rejection", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Wyloguj" });
    await user.click(button);

    expect(await screen.findByRole("button", { name: "Wyloguj" })).not.toBeDisabled();
    expect(showErrorToast).toHaveBeenCalledWith("Nie udało się wylogować. Spróbuj ponownie.");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("should redirect to provided path after success", async () => {
    fetchMock.mockResolvedValueOnce(await mockFetchResponse(true));
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation((fn) => {
      if (typeof fn === "function") {
        (fn as () => void)();
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
    const user = userEvent.setup();
    render(<LogoutButton redirectTo="/dashboard" />);

    await user.click(screen.getByRole("button", { name: "Wyloguj" }));

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(window.location.href).toBe("/dashboard");
  });
});
