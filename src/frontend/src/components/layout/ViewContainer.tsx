import { ReactNode } from 'react';

interface ViewContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ViewContainer({ children, className = '' }: ViewContainerProps) {
  return (
    <div className={`min-h-full bg-background text-foreground ${className}`}>
      {children}
    </div>
  );
}
