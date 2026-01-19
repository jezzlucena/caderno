import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const variantClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 transition-colors',
    success:
      'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 transition-colors',
    warning:
      'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 transition-colors',
    error:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 transition-colors',
  };

  return (
    <div
      className={`rounded-md border p-4 ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
