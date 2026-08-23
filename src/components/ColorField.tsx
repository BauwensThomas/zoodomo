"use client";

import { useState } from "react";

export function ColorField({
  name,
  label,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  function update(next: string) {
    setValue(next);
    onChange?.(next);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => update(e.target.value)}
          aria-label={label}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-card p-1"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => update(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          className="w-28 rounded-lg border border-border px-3 py-2 text-sm uppercase text-foreground outline-none focus:border-foreground"
        />
      </div>
    </div>
  );
}
