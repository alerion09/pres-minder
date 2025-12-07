import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdeaFormDialog } from "../IdeaFormDialog";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";
import type { IdeaDTO, RelationDTO, OccasionDTO } from "@/types";

const consoleErrorOriginal = console.error;
console.error = (...args: unknown[]) => {
  const [message] = args;
  if (typeof message === "string" && (message.includes("act(...)") || message.includes("[IdeaFormDialog]"))) {
    return;
  }
  consoleErrorOriginal(...args);
};

vi.mock("@/lib/utils/toast-helpers", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

const relations: RelationDTO[] = [
  { id: 1, name: "Brat" },
  { id: 2, name: "Siostra" },
];

const occasions: OccasionDTO[] = [
  { id: 1, name: "Urodziny" },
  { id: 2, name: "Święta" },
];

const baseIdea: IdeaDTO = {
  id: 10,
  name: "Pomysł AI",
  content: "Treść z AI",
  source: "ai",
  relation_name: "Brat",
  occasion_name: "Urodziny",
  relation_id: 1,
  occasion_id: 1,
  age: 30,
  budget_max: 200,
  budget_min: 100,
  interests: "sport",
  person_description: "opis",
  created_at: "",
  updated_at: "",
};

describe("IdeaFormDialog", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderDialog = (props?: Partial<React.ComponentProps<typeof IdeaFormDialog>>) =>
    render(
      <IdeaFormDialog
        open
        mode="create"
        userId="user-1"
        relations={relations}
        occasions={occasions}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        {...props}
      />
    );

  it("should block submit on validation errors and focus first field", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /dodaj pomysł/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Nazwa jest wymagana")).toBeInTheDocument();
    expect(screen.getByText("Treść pomysłu jest wymagana")).toBeInTheDocument();
    expect(document.activeElement?.getAttribute("id")).toBe("name");
  });

  it("should create idea successfully with manual source and close dialog", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 11, name: "Nowy", source: "manual" } }),
    } as Response);
    const user = userEvent.setup();
    renderDialog({ onSaved, onOpenChange });

    await user.type(screen.getByLabelText(/nazwa pomysłu/i), "Nowy pomysł");
    await user.type(screen.getByLabelText(/treść pomysłu/i), "Opis pomysłu");
    await user.click(screen.getByRole("button", { name: /dodaj pomysł/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/ideas",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(showSuccessToast).toHaveBeenCalledWith("Pomysł został dodany pomyślnie");
      expect(onSaved).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should mark edited AI content as edited-ai in edit mode", async () => {
    const onSaved = vi.fn();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { ...baseIdea, source: "edited-ai" } }),
    } as Response);
    const user = userEvent.setup();
    renderDialog({ mode: "edit", idea: baseIdea, onSaved });

    await user.type(screen.getByLabelText(/treść pomysłu/i), " zedytowane");
    await user.click(screen.getByRole("button", { name: /zapisz zmiany/i }));

    await waitFor(() => {
      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse((options as RequestInit).body as string).source).toBe("edited-ai");
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it("should show error toast on failed create response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "server_error" }),
    } as Response);
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/nazwa pomysłu/i), "Valid name");
    await user.type(screen.getByLabelText(/treść pomysłu/i), "Opis");
    await user.click(screen.getByRole("button", { name: /dodaj pomysł/i }));

    await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
  });

  it("should generate AI suggestions and accept one clearing content error", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { suggestions: [{ content: "Pomysł AI" }, { content: "Drugi" }] } }),
    } as Response);
    renderDialog();

    await user.click(screen.getByRole("button", { name: /dodaj pomysł/i }));
    expect(await screen.findByText("Treść pomysłu jest wymagana")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /wygeneruj pomysły/i }));
    await waitFor(() => expect(screen.getByText(/Pomysł AI/)).toBeInTheDocument());
    expect(screen.getByText(/Pomysł AI/)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText("Pomysł AI"));
    });
    expect(screen.queryByText("Treść pomysłu jest wymagana")).not.toBeInTheDocument();
  });

  it("should prevent closing dialog while pending submit is in progress", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    fetchMock.mockReturnValueOnce(pendingResponse);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOpenChange });

    await user.type(screen.getByLabelText(/nazwa pomysłu/i), "Test");
    await user.type(screen.getByLabelText(/treść pomysłu/i), "Opis");
    await user.click(screen.getByRole("button", { name: /dodaj pomysł/i }));

    await user.click(screen.getByRole("button", { name: /anuluj/i }));
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: () => Promise.resolve({ data: baseIdea }),
      } as Response);
    });
  });
});
