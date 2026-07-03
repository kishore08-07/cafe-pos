import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="mb-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-[14px] font-semibold text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface border border-border rounded-xl px-4 py-3 text-[18px] font-normal text-text outline-none focus:border-gold transition-colors placeholder:text-text-faint ${className}`}
          {...rest}
        />
        {hint && (
          <p className="mt-1 text-[15px] text-text-faint font-light">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const taId = id ?? generatedId;
    return (
      <div className="mb-1">
        {label && (
          <label
            htmlFor={taId}
            className="block mb-2 text-[14px] font-semibold text-text-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={`w-full bg-surface border border-border rounded-xl px-4 py-3 text-[18px] font-normal text-text outline-none focus:border-gold transition-colors placeholder:text-text-faint resize-none ${className}`}
          {...rest}
        />
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = '', id, children, ...rest }, ref) => {
    const generatedId = useId();
    const sId = id ?? generatedId;
    return (
      <div className="mb-1">
        {label && (
          <label
            htmlFor={sId}
            className="block mb-2 text-[14px] font-semibold text-text-muted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={sId}
          className={`w-full bg-surface border border-border rounded-xl px-4 py-3 text-[18px] font-normal text-text outline-none focus:border-gold transition-colors ${className}`}
          {...rest}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';
