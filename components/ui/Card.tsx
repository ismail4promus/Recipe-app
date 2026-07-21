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
        'rounded-md border border-app-border bg-app-card/80 backdrop-blur-md text-app-text shadow-sm overflow-hidden',
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
  <h3 className={cn('text-[12px] font-black tracking-[0.3em] uppercase text-app-text', className)} {...props}>
    {children}
  </h3>
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-[10px] font-bold uppercase tracking-[0.4em] text-app-muted', className)} {...props}>
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