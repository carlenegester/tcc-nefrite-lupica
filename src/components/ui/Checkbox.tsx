import { type InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          {...props}
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Grupo de checkboxes para múltipla seleção
interface CheckboxGroupProps<T extends string> {
  label?: string;
  options: readonly { value: T; label: string }[];
  values: T[];
  onChange: (values: T[]) => void;
  error?: string;
}

export function CheckboxGroup<T extends string>({
  label,
  options,
  values,
  onChange,
  error,
}: CheckboxGroupProps<T>) {
  const handleChange = (value: T, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter((v) => v !== value));
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={values.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
          />
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
