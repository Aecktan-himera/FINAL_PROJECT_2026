import { type JSX } from 'react';
import { twMerge } from 'tailwind-merge';

type LiquidGlassProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  /** Включить анимацию градиента (по умолчанию true) */
  animated?: boolean;
  /** Длительность анимации в секундах (по умолчанию 6) */
  animationDuration?: number;
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className,
  as: Tag = 'div',
  animated = true,
  animationDuration = 6000,
}) => {
  return (
    <Tag
      className={twMerge(
        'liquid-glass',
        'backdrop-blur-xl bg-white/30 dark:bg-white/5',
        'border border-white/20 dark:border-white/10',
        'shadow-xl rounded-2xl',
        'relative overflow-visible',
        className
      )}
    >
      <style>{`
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: linear-gradient(
            to right,
            var(--glass-from, rgba(34, 211, 238, 0.4)),
            var(--glass-via, rgba(168, 85, 247, 0.3)),
            var(--glass-to, rgba(244, 114, 182, 0.4))
          );
          border-radius: inherit;
          ${
            animated
              ? `animation: gradient ${animationDuration}s ease-in-out infinite; background-size: 200% 200%;`
              : ''
          }
        }
      `}</style>

      {children}
    </Tag>
  );
};