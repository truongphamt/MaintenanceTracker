import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const REVEAL = 88;

export default function SwipeRow({ children, onDelete, onEdit, className }: Props) {
  const [offset, setOffset] = useState(0);
  const [sliding, setSliding] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const axis = useRef<'x' | 'y' | null>(null);
  const suppressClick = useRef(false);

  const min = onDelete ? -REVEAL : 0;
  const max = onEdit ? REVEAL : 0;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return;
    dragging.current = true;
    axis.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offset;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!axis.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      if (axis.current === 'y') {
        dragging.current = false;
        return;
      }
      setSliding(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture needs a real active pointer. The swipe still tracks moves on this row.
      }
    }
    if (axis.current !== 'x') return;
    setOffset(Math.min(max, Math.max(min, startOffset.current + dx)));
  };

  const endDrag = () => {
    if (!dragging.current) return;
    const wasHorizontal = axis.current === 'x';
    dragging.current = false;
    axis.current = null;
    setSliding(false);
    if (!wasHorizontal) return;
    suppressClick.current = true;
    setOffset(current => {
      if (onEdit && current > REVEAL / 2) return REVEAL;
      if (onDelete && current < -REVEAL / 2) return -REVEAL;
      return 0;
    });
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
      return;
    }
    if (offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setOffset(0);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute inset-y-0 left-0 w-[88px] bg-primary-600 text-white text-xs font-semibold"
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute inset-y-0 right-0 w-[88px] bg-danger-600 text-white text-xs font-semibold"
        >
          Delete
        </button>
      )}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: sliding ? 'none' : 'transform 150ms ease',
        }}
        className="relative bg-white touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
