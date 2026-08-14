"use client";

import { ColorField } from "@/components/ColorField";

export function AccountColorsSection({
  defaultPrimary,
  defaultSecondary,
  primaryLabel,
  primaryHint,
  secondaryLabel,
  secondaryHint,
  onPrimaryChange,
  onSecondaryChange,
}: {
  defaultPrimary: string;
  defaultSecondary: string;
  primaryLabel: string;
  primaryHint: string;
  secondaryLabel: string;
  secondaryHint: string;
  onPrimaryChange?: (value: string) => void;
  onSecondaryChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-8">
      <div>
        <ColorField
          name="couleur_primaire"
          label={primaryLabel}
          defaultValue={defaultPrimary}
          onChange={onPrimaryChange}
        />
        <p className="mt-1.5 max-w-60 text-xs text-foreground">{primaryHint}</p>
      </div>
      <div>
        <ColorField
          name="couleur_secondaire"
          label={secondaryLabel}
          defaultValue={defaultSecondary}
          onChange={onSecondaryChange}
        />
        <p className="mt-1.5 max-w-60 text-xs text-foreground">{secondaryHint}</p>
      </div>
    </div>
  );
}
