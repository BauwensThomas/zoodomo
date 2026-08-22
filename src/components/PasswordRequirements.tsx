import { Check, Circle } from "lucide-react";
import { hasDigit, hasMinLength, hasSpecialChar } from "@/lib/passwordStrength";

/** Rouge tant qu'un critère n'est pas rempli, vert avec une coche dès qu'il l'est. Affiché
 * dans un popup ancré au champ mot de passe (`/inscription` et `/reinitialiser-mot-de-passe`),
 * seulement pendant que le champ a le focus, demande utilisateur explicite. */
function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1 whitespace-nowrap ${met ? "text-emerald-600" : "text-red-600"}`}
    >
      {met ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {label}
    </li>
  );
}

export function PasswordRequirements({
  password,
  minLengthLabel,
  digitLabel,
  specialCharLabel,
}: {
  password: string;
  minLengthLabel: string;
  digitLabel: string;
  specialCharLabel: string;
}) {
  return (
    <ul className="space-y-1 text-xs">
      <Requirement met={hasMinLength(password)} label={minLengthLabel} />
      <Requirement met={hasDigit(password)} label={digitLabel} />
      <Requirement met={hasSpecialChar(password)} label={specialCharLabel} />
    </ul>
  );
}
