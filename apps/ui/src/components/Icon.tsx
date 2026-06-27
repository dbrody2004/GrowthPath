import type { CSSProperties } from 'react';

export type IconName =
  | 'dashboard'
  | 'list_alt'
  | 'add'
  | 'work'
  | 'settings'
  | 'logout'
  | 'account_circle'
  | 'chevron_left'
  | 'chevron_right'
  | 'insights'
  | 'print'
  | 'arrow_back';

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
  filled?: boolean;
  style?: CSSProperties;
};

export function Icon({ name, size = 20, className = '', title, filled, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined icon ${className}`.trim()}
      style={{
        fontSize: size,
        width: size,
        height: size,
        ...style,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
      }}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {name}
    </span>
  );
}
