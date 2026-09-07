import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-destructive px-4 text-sm font-semibold text-white shadow-xs outline-none transition-[color,background-color,box-shadow,transform] hover:bg-destructive/90 focus-visible:ring-3 focus-visible:ring-destructive/25 active:translate-y-px ${
                    disabled && 'pointer-events-none opacity-50'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
