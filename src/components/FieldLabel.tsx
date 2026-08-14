export function FieldLabel({
  htmlFor,
  label,
  required = false,
  optionalLabel,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  optionalLabel: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
      {label}
      {required ? (
        <span className="text-red-500"> *</span>
      ) : (
        <span className="ml-1 text-xs font-normal text-foreground">({optionalLabel})</span>
      )}
    </label>
  );
}
