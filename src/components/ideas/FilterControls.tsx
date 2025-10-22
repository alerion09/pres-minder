import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterStateVM, FilterOptionsVM, SelectOption } from "@/lib/types/ideas-view.types";

interface FilterControlsProps {
  value: FilterStateVM;
  options: FilterOptionsVM;
  onChange: (updates: Partial<FilterStateVM>) => void;
}

type FilterKey = "relationId" | "occasionId" | "source" | "sort" | "order";

interface FilterConfig<T = string | number> {
  key: FilterKey;
  label: string;
  id: string;
  ariaLabel: string;
  placeholder?: string;
  allOptionLabel?: string;
  optionsKey: keyof FilterOptionsVM;
  hasAllOption: boolean;
  getValue: (value: FilterStateVM) => string;
  parseValue: (val: string) => Partial<FilterStateVM>;
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "relationId",
    label: "Relacja",
    id: "relation-filter",
    ariaLabel: "Filtruj według relacji",
    placeholder: "Wszystkie relacje",
    allOptionLabel: "Wszystkie relacje",
    optionsKey: "relations",
    hasAllOption: true,
    getValue: (value) => value.relationId?.toString() || "all",
    parseValue: (val) => ({
      relationId: val === "all" ? undefined : parseInt(val, 10),
    }),
  },
  {
    key: "occasionId",
    label: "Okazja",
    id: "occasion-filter",
    ariaLabel: "Filtruj według okazji",
    placeholder: "Wszystkie okazje",
    allOptionLabel: "Wszystkie okazje",
    optionsKey: "occasions",
    hasAllOption: true,
    getValue: (value) => value.occasionId?.toString() || "all",
    parseValue: (val) => ({
      occasionId: val === "all" ? undefined : parseInt(val, 10),
    }),
  },
  {
    key: "source",
    label: "Źródło",
    id: "source-filter",
    ariaLabel: "Filtruj według źródła",
    placeholder: "Wszystkie źródła",
    allOptionLabel: "Wszystkie źródła",
    optionsKey: "sources",
    hasAllOption: true,
    getValue: (value) => value.source || "all",
    parseValue: (val) => ({
      source: val === "all" ? undefined : (val as FilterStateVM["source"]),
    }),
  },
  {
    key: "sort",
    label: "Sortuj według",
    id: "sort-filter",
    ariaLabel: "Sortuj według",
    optionsKey: "sorts",
    hasAllOption: false,
    getValue: (value) => value.sort,
    parseValue: (val) => ({ sort: val as FilterStateVM["sort"] }),
  },
  {
    key: "order",
    label: "Kolejność",
    id: "order-filter",
    ariaLabel: "Kolejność sortowania",
    optionsKey: "orders",
    hasAllOption: false,
    getValue: (value) => value.order,
    parseValue: (val) => ({ order: val as FilterStateVM["order"] }),
  },
];

export function FilterControls({ value, options, onChange }: FilterControlsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {FILTER_CONFIGS.map((config) => {
        const filterOptions = options[config.optionsKey] as SelectOption<string | number>[];

        return (
          <div key={config.key} className="space-y-2">
            <Label htmlFor={config.id} className="text-sm font-medium">
              {config.label}
            </Label>
            <Select
              value={config.getValue(value)}
              onValueChange={(val) => {
                onChange(config.parseValue(val));
              }}
            >
              <SelectTrigger id={config.id} className="w-full" aria-controls="ideas-list" aria-label={config.ariaLabel}>
                <SelectValue placeholder={config.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {config.hasAllOption && config.allOptionLabel && (
                  <SelectItem value="all">{config.allOptionLabel}</SelectItem>
                )}
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
