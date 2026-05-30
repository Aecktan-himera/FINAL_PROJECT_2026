import { type JSX } from 'react';
import { twMerge } from 'tailwind-merge';

/*const glassBase = `
  backdrop-blur-xl
  bg-white/30 dark:bg-white/5
  border border-white/20 dark:border-white/10
  shadow-xl
  rounded-2xl
`;*/

type LiquidGlassProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className,
  as: Tag = 'div',
}) => {
  return (
    <Tag
      className={twMerge(
        // стеклянная основа
        'backdrop-blur-xl bg-white/30 dark:bg-white/5',
        'border border-white/20 dark:border-white/10',
        'shadow-xl rounded-2xl',
        // жидкий градиентный слой (поверх фона)
        'relative overflow-visible',
        'before:absolute before:inset-0 before:z-[-1]',
        'before:bg-gradient-to-r before:from-cyan-400/40 before:via-purple-500/30 before:to-pink-400/40',
        'before:animate-gradient before:rounded-2xl',
        className
      )}
    >
      {children}
    </Tag>
  );
};