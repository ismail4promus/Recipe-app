import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  isPrimary?: boolean;
}

interface CardDivProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children, isPrimary, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl border border-app-border bg-app-card text-app-text shadow-card overflow-hidden',
        isPrimary && 'border-t-[3px] border-t-app-primary',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-0.5 px-3.5 py-2.5 border-b border-app-border', className)} {...props}>
    {children}
  </div>
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-sm font-bold tracking-tight text-app-text', className)} {...props}>
    {children}
  </h3>
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-app-muted', className)} {...props}>
    {children}
  </p>
);

const CardContent: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('p-3.5', className)} {...props}>
    {children}
  </div>
);

const CardFooter: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center px-3.5 py-2.5 border-t border-app-border bg-app-elevated', className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };