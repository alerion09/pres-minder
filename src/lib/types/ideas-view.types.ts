/**
 * ViewModel types for Ideas View
 * These types are used for client-side state management and UI components
 */

import type { IdeaSource, GetIdeasQueryParams } from "@/types";

/**
 * Filter state for ideas list - matches query params structure
 */
export interface FilterStateVM {
  page: number;
  limit: number;
  sort: "created_at" | "updated_at" | "name";
  order: "asc" | "desc";
  relationId?: number;
  occasionId?: number;
  source?: IdeaSource;
}

/**
 * Generic select option type
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
}

/**
 * Filter options for dropdowns/selects
 */
export interface FilterOptionsVM {
  relations: SelectOption<number>[];
  occasions: SelectOption<number>[];
  sources: SelectOption<IdeaSource>[];
  sorts: SelectOption<GetIdeasQueryParams["sort"]>[];
  orders: SelectOption<GetIdeasQueryParams["order"]>[];
}

/**
 * Idea card view model - extends IdeaDTO with UI-specific fields
 */
export interface IdeaCardVM {
  id: number;
  name: string;
  content: string;
  excerpt?: string;
  source: IdeaSource;
  relationName: string | null;
  occasionName: string | null;
  age?: number | null;
  interests?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt: string;
  updatedAt: string;
}
