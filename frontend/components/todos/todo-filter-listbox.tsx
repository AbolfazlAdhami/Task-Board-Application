"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

export type FilterOption = { value: string; label: string };

type TodoFilterListboxProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

export function TodoFilterListbox({
  label,
  value,
  options,
  onChange,
}: TodoFilterListboxProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label;

  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxLabel className="sr-only">{label}</ListboxLabel>
      <ListboxButton className="flex min-h-11 min-w-40 items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="shrink-0 text-muted"
        />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom end"
        className="z-30 mt-2 max-h-64 w-56 overflow-auto rounded-xl border border-border bg-surface p-1 shadow-xl focus:outline-none"
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground data-[focus]:bg-surface-raised data-[selected]:font-bold"
          >
            {({ selected }) => (
              <>
                <span>{option.label}</span>
                {selected && (
                  <Check
                    aria-hidden="true"
                    size={16}
                    className="text-primary"
                  />
                )}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
