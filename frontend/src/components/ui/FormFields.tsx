import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

/* ── Shared wrapper ── */
function FieldWrapper({ 
    label, 
    error, 
    children, 
    htmlFor, 
    maxLength, 
    currentLength 
}: { 
    label: string; 
    error?: string; 
    children: ReactNode; 
    htmlFor?: string;
    maxLength?: number;
    currentLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <label htmlFor={htmlFor} className="text-label text-text-secondary">{label}</label>
                {maxLength && (
                    <span className={`text-[10px] font-mono tracking-wider ${
                        currentLength && currentLength >= maxLength ? 'text-red-500 font-bold' : 'text-text-muted'
                    }`}>
                        {currentLength ?? 0}/{maxLength}
                    </span>
                )}
            </div>
            {children}
            {error && <p className="text-[11px] font-mono text-red-500">{error}</p>}
        </div>
    );
}

const baseInput = 'w-full px-3 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] font-sans placeholder:text-text-muted interactive focus:border-amber-500/50 focus:outline-none';

/* ── InputField ── */
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function InputField({ label, error, id, ...props }: InputFieldProps) {
    const currentLength = typeof props.value === 'string' ? props.value.length : 0;
    
    return (
        <FieldWrapper 
            label={label} 
            error={error} 
            htmlFor={id} 
            maxLength={props.maxLength}
            currentLength={currentLength}
        >
            <input id={id} className={`${baseInput} ${error ? 'border-red-500/50' : ''}`} {...props} />
        </FieldWrapper>
    );
}

/* ── TextAreaField ── */
interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

export function TextAreaField({ label, error, id, ...props }: TextAreaFieldProps) {
    const currentLength = typeof props.value === 'string' ? props.value.length : 0;

    return (
        <FieldWrapper 
            label={label} 
            error={error} 
            htmlFor={id}
            maxLength={props.maxLength}
            currentLength={currentLength}
        >
            <textarea id={id} className={`${baseInput} min-h-[80px] resize-y ${error ? 'border-red-500/50' : ''}`} {...props} />
        </FieldWrapper>
    );
}

/* ── SelectField ── */
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function SelectField({ label, error, id, options, placeholder, ...props }: SelectFieldProps) {
    return (
        <FieldWrapper label={label} error={error} htmlFor={id}>
            <div className="relative">
                <select id={id} className={`${baseInput} appearance-none cursor-pointer pr-8 ${error ? 'border-red-500/50' : ''}`} {...props}>
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
        </FieldWrapper>
    );
}

/* ── CheckboxField ── */
interface CheckboxFieldProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

export function CheckboxField({ label, checked, onChange, id }: CheckboxFieldProps) {
    return (
        <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer group">
            <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center interactive ${checked ? 'bg-amber-500 border-amber-500' : 'bg-bg-elevated border-border-default group-hover:border-border-strong'}`}>
                {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
            <span className="text-[13px] text-text-secondary font-sans">{label}</span>
        </label>
    );
}
