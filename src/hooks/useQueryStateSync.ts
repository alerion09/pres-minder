import { useCallback, useEffect, useRef, useState } from "react";
import { navigate } from "astro:transitions/client";
import type { FilterStateVM } from "@/lib/types/ideas-view.types";

/**
 * Custom hook for synchronizing state with URL query parameters
 * Uses Astro View Transitions for seamless navigation and SSR data reload
 */
export function useQueryStateSync(initialFilters: FilterStateVM) {
  const [filters, setFilters] = useState<FilterStateVM>(initialFilters);
  const [isUpdating, setIsUpdating] = useState(false);
  const isInitialMount = useRef(true);

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
   * Sync filters with URL query params using Astro View Transitions
   */
  useEffect(() => {
    // Skip navigation on initial mount - we already have the correct URL from SSR
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

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

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    // Only navigate if URL actually changed
    if (newUrl !== currentUrl) {
      setIsUpdating(true);

      // Use Astro's navigate for smooth transitions with SSR data reload
      navigate(newUrl).finally(() => {
        setIsUpdating(false);
      });
    }
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    isUpdating,
  };
}
