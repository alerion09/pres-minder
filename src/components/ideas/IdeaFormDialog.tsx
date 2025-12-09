import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";
import type {
  IdeaDTO,
  RelationDTO,
  OccasionDTO,
  CreateIdeaCommand,
  UpdateIdeaCommand,
  IdeaSource,
  GenerateIdeaCommand,
  GenerateIdeaResponseDTO,
} from "@/types";

interface IdeaFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  userId: string;
  idea?: IdeaDTO;
  relations: RelationDTO[];
  occasions: OccasionDTO[];
  onOpenChange: (open: boolean) => void;
  onSaved: (idea: IdeaDTO) => void;
}

interface FormData {
  name: string;
  age: string;
  interests: string;
  person_description: string;
  relation_id: string;
  occasion_id: string;
  budget_min: string;
  budget_max: string;
  content: string;
}

type FormErrors = Record<string, string>;

export function IdeaFormDialog({
  open,
  mode,
  userId,
  idea,
  relations,
  occasions,
  onOpenChange,
  onSaved,
}: IdeaFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    interests: "",
    person_description: "",
    relation_id: "",
    occasion_id: "",
    budget_min: "",
    budget_max: "",
    content: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, setIsPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [originalContent, setOriginalContent] = useState("");
  const [clickedCardIndex, setClickedCardIndex] = useState<number | null>(null);

  // Inicjalizacja formularza w trybie edycji
  useEffect(() => {
    if (open) {
      if (mode === "edit" && idea) {
        setFormData({
          name: idea.name,
          age: idea.age?.toString() || "",
          interests: idea.interests || "",
          person_description: idea.person_description || "",
          relation_id: idea.relation_id?.toString() || "",
          occasion_id: idea.occasion_id?.toString() || "",
          budget_min: idea.budget_min?.toString() || "",
          budget_max: idea.budget_max?.toString() || "",
          content: idea.content,
        });
        setOriginalContent(idea.content);
      } else if (mode === "create") {
        // Reset formularza w trybie create
        setFormData({
          name: "",
          age: "",
          interests: "",
          person_description: "",
          relation_id: "",
          occasion_id: "",
          budget_min: "",
          budget_max: "",
          content: "",
        });
        setOriginalContent("");
      }
      // Jeśli mode === "edit" && !idea, nie rób nic - czekaj aż idea się pojawi
      setErrors({});
      setAiSuggestions([]);
    }
  }, [open, mode, idea]);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Walidacja nazwy (wymagane, 2-255 znaków)
    if (!formData.name.trim()) {
      newErrors.name = "Nazwa jest wymagana";
    } else if (formData.name.length < 2) {
      newErrors.name = "Nazwa musi mieć co najmniej 2 znaki";
    } else if (formData.name.length > 255) {
      newErrors.name = "Nazwa może mieć maksymalnie 255 znaków";
    }

    // Walidacja treści (wymagane, 1-10000 znaków)
    if (!formData.content.trim()) {
      newErrors.content = "Treść pomysłu jest wymagana";
    } else if (formData.content.length > 10000) {
      newErrors.content = "Treść może mieć maksymalnie 10000 znaków";
    }

    // Walidacja wieku (opcjonalne, 1-500)
    if (formData.age) {
      const age = Number(formData.age);
      if (isNaN(age) || age < 1) {
        newErrors.age = "Liczba lat musi być większa od 0";
      } else if (age > 500) {
        newErrors.age = "Wiek nie może przekraczać 500 lat";
      }
    }

    // Walidacja budżetu
    const budgetMin = formData.budget_min ? Number(formData.budget_min) : null;
    const budgetMax = formData.budget_max ? Number(formData.budget_max) : null;

    if (budgetMin && (isNaN(budgetMin) || budgetMin < 0)) {
      newErrors.budget_min = "Minimalny budżet musi być liczbą większą lub równą 0";
    }

    if (budgetMax && (isNaN(budgetMax) || budgetMax < 0)) {
      newErrors.budget_max = "Maksymalny budżet musi być liczbą większą lub równą 0";
    }

    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      newErrors.budget_min = "Minimalny budżet nie może być większy od maksymalnego";
    }

    // Walidacja długości pól tekstowych
    if (formData.interests && formData.interests.length > 1000) {
      newErrors.interests = "Zainteresowania mogą mieć maksymalnie 1000 znaków";
    }

    if (formData.person_description && formData.person_description.length > 1000) {
      newErrors.person_description = "Opis osoby może mieć maksymalnie 1000 znaków";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const determineSource = (): IdeaSource => {
    if (mode === "edit" && idea) {
      // Jeśli treść została zmieniona i oryginalnie była z AI, zmień na edited-ai
      if (idea.source === "ai" && formData.content !== originalContent) {
        return "edited-ai";
      }
      // W przeciwnym razie zachowaj oryginalne źródło
      return idea.source;
    }

    // W trybie create: jeśli treść pochodzi z AI suggestions, to "ai", w przeciwnym razie "manual"
    return aiSuggestions.includes(formData.content) ? "ai" : "manual";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      // Fokus na pierwszym błędnym polu
      const firstErrorField = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setIsPending(true);

    try {
      const source = determineSource();

      if (mode === "create") {
        // POST /api/ideas
        const command: CreateIdeaCommand = {
          user_id: userId,
          name: formData.name.trim(),
          content: formData.content.trim(),
          source,
          age: formData.age ? Number(formData.age) : null,
          interests: formData.interests.trim() || null,
          person_description: formData.person_description.trim() || null,
          relation_id: formData.relation_id ? Number(formData.relation_id) : null,
          occasion_id: formData.occasion_id ? Number(formData.occasion_id) : null,
          budget_min: formData.budget_min ? Number(formData.budget_min) : null,
          budget_max: formData.budget_max ? Number(formData.budget_max) : null,
        };

        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error("[IdeaFormDialog] Create error:", { status: response.status, error: data });
          showErrorToast(data.error || "Nie udało się dodać pomysłu");
          return;
        }

        const result = await response.json();
        showSuccessToast("Pomysł został dodany pomyślnie");
        onSaved(result.data);
      } else {
        // PUT /api/ideas/:id
        const command: UpdateIdeaCommand = {
          user_id: userId,
          name: formData.name.trim(),
          content: formData.content.trim(),
          source,
          age: formData.age ? Number(formData.age) : null,
          interests: formData.interests.trim() || null,
          person_description: formData.person_description.trim() || null,
          relation_id: formData.relation_id ? Number(formData.relation_id) : null,
          occasion_id: formData.occasion_id ? Number(formData.occasion_id) : null,
          budget_min: formData.budget_min ? Number(formData.budget_min) : null,
          budget_max: formData.budget_max ? Number(formData.budget_max) : null,
        };

        const response = await fetch(`/api/ideas/${idea?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error("[IdeaFormDialog] Update error:", { status: response.status, error: data });
          showErrorToast(data.error || "Nie udało się zaktualizować pomysłu");
          return;
        }

        const result = await response.json();
        showSuccessToast("Pomysł został zaktualizowany pomyślnie");
        onSaved(result.data);
      }

      onOpenChange(false);
    } catch (err) {
      console.error("[IdeaFormDialog] Submit error:", err);
      showErrorToast("Wystąpił błąd podczas zapisywania pomysłu");
    } finally {
      setIsPending(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);

    try {
      const command: GenerateIdeaCommand = {
        age: formData.age ? Number(formData.age) : null,
        interests: formData.interests.trim() || null,
        person_description: formData.person_description.trim() || null,
        relation_id: formData.relation_id ? Number(formData.relation_id) : null,
        occasion_id: formData.occasion_id ? Number(formData.occasion_id) : null,
        budget_min: formData.budget_min ? Number(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number(formData.budget_max) : null,
      };

      const response = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("[IdeaFormDialog] Generate AI error:", { status: response.status, error: data });
        showErrorToast(data.error || "Nie udało się wygenerować pomysłów");
        return;
      }

      const result = await response.json();
      const responseData: GenerateIdeaResponseDTO = result.data;
      setAiSuggestions(responseData.suggestions.map((s) => s.content));
      showSuccessToast("Wygenerowano propozycje pomysłów");
    } catch (err) {
      console.error("[IdeaFormDialog] Generate AI error:", err);
      showErrorToast("Wystąpił błąd podczas generowania pomysłów");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: string, index: number) => {
    setClickedCardIndex(index);
    setFormData((prev) => ({ ...prev, content: suggestion }));
    setErrors((prev) => {
      const { content, ...rest } = prev;
      return rest;
    });
    showSuccessToast("Propozycja dodana do treści pomysłu");

    setTimeout(() => {
      setClickedCardIndex(null);
    }, 150);
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Usuń błąd dla tego pola
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isPending && onOpenChange(newOpen)}>
      <DialogContent
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0"
        data-test-id="idea-form-dialog"
      >
        <div className="flex-1 overflow-y-auto px-6 pt-6">
          <DialogHeader className="mb-6">
            <DialogTitle>{mode === "create" ? "Dodaj nowy pomysł" : "Edytuj pomysł"}</DialogTitle>
            <DialogDescription className="sr-only">
              {mode === "create" ? "Formularz dodawania pomysłu" : "Formularz edycji pomysłu"}
            </DialogDescription>
          </DialogHeader>

          <form id="idea-form" onSubmit={handleSubmit} noValidate className="space-y-6 pb-6">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="name">
                Nazwa pomysłu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="np. Książka o astronomii"
                maxLength={255}
                disabled={isPending}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                data-test-id="idea-name-input"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Budżet w PLN (od - do)</Label>
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    id="budget_min"
                    type="number"
                    min="0"
                    value={formData.budget_min}
                    onChange={(e) => handleFieldChange("budget_min", e.target.value)}
                    placeholder="od"
                    disabled={isPending}
                    aria-label="Budżet minimalny w PLN"
                    aria-invalid={!!errors.budget_min}
                    aria-describedby={errors.budget_min ? "budget_min-error" : undefined}
                    data-test-id="idea-budget-min-input"
                  />
                  {errors.budget_min && (
                    <p id="budget_min-error" className="text-sm text-destructive">
                      {errors.budget_min}
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground pt-2" aria-hidden="true">
                  –
                </span>
                <div className="flex-1 space-y-1">
                  <Input
                    id="budget_max"
                    type="number"
                    min="0"
                    value={formData.budget_max}
                    onChange={(e) => handleFieldChange("budget_max", e.target.value)}
                    placeholder="do"
                    disabled={isPending}
                    aria-label="Budżet maksymalny w PLN"
                    aria-invalid={!!errors.budget_max}
                    aria-describedby={errors.budget_max ? "budget_max-error" : undefined}
                    data-test-id="idea-budget-max-input"
                  />
                  {errors.budget_max && (
                    <p id="budget_max-error" className="text-sm text-destructive">
                      {errors.budget_max}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 min-w-0 md:col-span-2">
                <Label htmlFor="relation_id">Relacja</Label>
                <Select
                  value={formData.relation_id || undefined}
                  onValueChange={(val) => handleFieldChange("relation_id", val)}
                  disabled={isPending}
                >
                  <SelectTrigger id="relation_id" className="w-full" data-test-id="idea-relation-select">
                    <SelectValue placeholder="Wybierz relację" />
                  </SelectTrigger>
                  <SelectContent>
                    {relations.map((rel) => (
                      <SelectItem key={rel.id} value={rel.id.toString()}>
                        {rel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0 md:col-span-2">
                <Label htmlFor="occasion_id">Okazja</Label>
                <Select
                  value={formData.occasion_id || undefined}
                  onValueChange={(val) => handleFieldChange("occasion_id", val)}
                  disabled={isPending}
                >
                  <SelectTrigger id="occasion_id" className="w-full" data-test-id="idea-occasion-select">
                    <SelectValue placeholder="Wybierz okazję" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((occ) => (
                      <SelectItem key={occ.id} value={occ.id.toString()}>
                        {occ.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="age">Wiek (lata)</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.age}
                  onChange={(e) => handleFieldChange("age", e.target.value)}
                  placeholder="np. 30"
                  disabled={isPending}
                  aria-invalid={!!errors.age}
                  aria-describedby={errors.age ? "age-error" : undefined}
                  className="w-full"
                  data-test-id="idea-age-input"
                />
                {errors.age && (
                  <p id="age-error" className="text-sm text-destructive">
                    {errors.age}
                  </p>
                )}
              </div>
            </div>

            {/* Zainteresowania i opis osoby */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interests">Zainteresowania osoby</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => handleFieldChange("interests", e.target.value)}
                  placeholder="np. Sport, muzyka, książki"
                  rows={2}
                  maxLength={1000}
                  disabled={isPending}
                  aria-invalid={!!errors.interests}
                  aria-describedby={errors.interests ? "interests-error" : undefined}
                  data-test-id="idea-interests-textarea"
                />
                {errors.interests && (
                  <p id="interests-error" className="text-sm text-destructive">
                    {errors.interests}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="person_description">Opis osoby</Label>
                <Textarea
                  id="person_description"
                  value={formData.person_description}
                  onChange={(e) => handleFieldChange("person_description", e.target.value)}
                  placeholder="Dodatkowe informacje o osobie obdarowywanej..."
                  rows={2}
                  maxLength={1000}
                  disabled={isPending}
                  aria-invalid={!!errors.person_description}
                  aria-describedby={errors.person_description ? "person_description-error" : undefined}
                  data-test-id="idea-person-description-textarea"
                />
                {errors.person_description && (
                  <p id="person_description-error" className="text-sm text-destructive">
                    {errors.person_description}
                  </p>
                )}
              </div>
            </div>

            {/* Treść pomysłu */}
            <div className="space-y-2">
              <Label htmlFor="content">
                Treść pomysłu <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleFieldChange("content", e.target.value)}
                placeholder="Opisz swój pomysł na prezent..."
                rows={5}
                maxLength={10000}
                disabled={isPending}
                aria-invalid={!!errors.content}
                aria-describedby={errors.content ? "content-error" : undefined}
                data-test-id="idea-content-textarea"
              />
              {errors.content && (
                <p id="content-error" className="text-sm text-destructive">
                  {errors.content}
                </p>
              )}
            </div>

            {/* Panel AI */}
            <div className="space-y-3 border-t pt-4" data-test-id="ai-suggestions-section">
              <div className="flex items-center justify-between">
                <Label>Sugestie AI</Label>
                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || isPending}
                  variant="outline"
                  size="sm"
                  data-test-id="generate-ai-ideas-button"
                >
                  {isGenerating ? "Generowanie..." : "Wygeneruj pomysły"}
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-2" data-test-id="ai-suggestions-list">
                  <p className="text-sm text-muted-foreground">Kliknij na pomysł, aby go użyć:</p>
                  {aiSuggestions.map((suggestion, idx) => (
                    <Card
                      key={idx}
                      className={`p-0 cursor-pointer hover:bg-accent/50 transition-all duration-300 ${
                        clickedCardIndex === idx ? "opacity-0 scale-95 translate-x-2" : "opacity-100 scale-100"
                      }`}
                      onClick={() => handleAcceptSuggestion(suggestion, idx)}
                      data-test-id={`ai-suggestion-card-${idx}`}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm">{suggestion}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer - always at bottom */}
        <DialogFooter className="flex-shrink-0 bg-background border-t px-6 py-4 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-test-id="idea-form-cancel-button"
          >
            Anuluj
          </Button>
          <Button type="submit" form="idea-form" disabled={isPending} data-test-id="idea-form-submit-button">
            {isPending ? "Zapisywanie..." : mode === "create" ? "Dodaj pomysł" : "Zapisz zmiany"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
