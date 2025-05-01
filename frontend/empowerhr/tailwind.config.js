/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        // Safelist common utility classes to ensure they're included
        'flex', 'items-center', 'justify-center', 'justify-between', 'text-center',
        'bg-white', 'bg-primary', 'bg-secondary', 'text-white', 'text-primary',
        'text-sm', 'text-lg', 'font-medium', 'font-semibold',
        'h-5', 'w-5', 'h-6', 'w-6', 'h-10', 'w-10', 'h-12', 'w-12',
        'p-4', 'p-6', 'p-8', 'm-4', 'my-4', 'mx-auto',
        'rounded-md', 'rounded-lg', 'rounded-full',
        'shadow-sm', 'shadow-md', 'shadow-lg',
        'border', 'border-gray-200', 'hover:bg-gray-50',
        'grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3',
        'gap-4', 'gap-6', 'relative', 'absolute', 'transition',
        'btn', 'btn-primary', 'btn-secondary', 'btn-danger',
        'badge', 'badge-success', 'badge-warning', 'badge-error',
        'card', 'hover:shadow-lg', 'hover:-translate-y-1',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                    light: '#818cf8',
                },
                secondary: {
                    DEFAULT: '#10b981',
                    dark: '#0da271',
                    light: '#34d399',
                },
                accent: '#f59e0b',
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
                gray: {
                    darkest: '#111827',
                    dark: '#1f2937',
                    DEFAULT: '#6b7280',
                    light: '#e5e7eb',
                    lightest: '#f9fafb',
                },
            },
            boxShadow: {
                card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            borderRadius: {
                'card': '0.75rem',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
} 