import { useCallback, useEffect, useState } from "react";
import type { FilterStateVM } from "@/lib/types/ideas-view.types";

/**
 * Custom hook for synchronizing state with URL query parameters
 * Provides debounced updates to prevent excessive history entries
 */
export function useQueryStateSync(initialFilters: FilterStateVM) {
  const [filters, setFilters] = useState<FilterStateVM>(initialFilters);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Update filters and sync with URL
   */
  const updateFilters = useCallback((updates: Partial<FilterStateVM>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };

      // Reset to page 1 when filters change (except page itself)
      if (Object.keys(updates).some((key) => key !== "page")) {
        next.page = 1;
      }

      return next;
    });
  }, []);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: initialFilters.limit,
      sort: "created_at",
      order: "desc",
      relationId: undefined,
      occasionId: undefined,
      source: undefined,
    });
  }, [initialFilters.limit]);

  /**
   * Sync filters with URL query params
   */
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("page", filters.page.toString());
    params.set("limit", filters.limit.toString());
    params.set("sort", filters.sort);
    params.set("order", filters.order);

    if (filters.relationId) {
      params.set("relation_id", filters.relationId.toString());
    }

    if (filters.occasionId) {
      params.set("occasion_id", filters.occasionId.toString());
    }

    if (filters.source) {
      params.set("source", filters.source);
    }

    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Trigger page reload to fetch new data from server
    setIsUpdating(true);
    window.location.href = newUrl;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    isUpdating,
  };
}
