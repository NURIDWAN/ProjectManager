import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs outline-none transition-[color,background-color,box-shadow,transform] hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px ${
                    disabled && 'pointer-events-none opacity-50'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
