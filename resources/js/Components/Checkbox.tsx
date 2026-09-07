import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'size-4 rounded border-input bg-background text-primary shadow-xs focus:ring-3 focus:ring-ring/30 ' +
                className
            }
        />
    );
}
