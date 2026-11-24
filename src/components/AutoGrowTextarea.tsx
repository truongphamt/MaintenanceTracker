import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Minimum number of rows shown when empty. */
  minRows?: number;
}

/**
 * A textarea that grows to fit its content instead of scrolling. It keeps a
 * floor of `minRows` lines and expands as the user types, then shrinks back
 * when text is removed. Used for the Notes fields across the app.
 */
export default function AutoGrowTextarea({ minRows = 3, value, style, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      style={{
        // py-2.5 (0.625rem top + bottom) + minRows lines + borders.
        minHeight: `calc(${minRows} * 1.25rem + 1.25rem + 2px)`,
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    />
  );
}
