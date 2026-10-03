/**
 * Shared dashboard UI primitives (server components, no client code).
 * Dashboard-only; the public site never imports this directory.
 */

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
        {required ? <span aria-hidden="true" className="text-accent"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const inputClassName =
  "w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none disabled:opacity-60";

export function TextInput({ className, ...props }: InputProps) {
  return <input {...props} className={className ?? inputClassName} />;
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea {...props} className={className ?? `${inputClassName} min-h-24`} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select {...props} className={className ?? inputClassName}>
      {children}
    </select>
  );
}

interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}

export function Checkbox({ id, name, label, hint, defaultChecked }: CheckboxProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[#7c5c41]"
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
