"use client";

import { Select } from "@/components/ui/field";
import { stateService } from "@/lib/market/country-service";

export function StateSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">—</option>
      {stateService.list().map((s) => (
        <option key={s.code} value={s.code}>
          {s.name}
        </option>
      ))}
    </Select>
  );
}
