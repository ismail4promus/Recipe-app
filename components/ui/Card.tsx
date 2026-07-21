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
        'rounded-xl border border-app-border bg-app-card text-app-text shadow-soft overflow-hidden',
        isPrimary && 'border-t-2 border-t-app-primary',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('flex flex-col space-y-1 p-5 md:px-6 md:py-4 border-b border-white/5', className)} {...props}>
    {children}
  </div>
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-base font-bold tracking-tight text-app-text', className)} {...props}>
    {children}
  </h3>
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-app-muted', className)} {...props}>
    {children}
  </p>
);

const CardContent: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('p-5 md:p-6', className)} {...props}>
    {children}
  </div>
);

const CardFooter: React.FC<CardDivProps> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center p-5 md:px-6 md:py-4 border-t border-white/5 bg-white/5', className)} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };