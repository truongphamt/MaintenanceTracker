import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onDelete: () => void;
}

const REVEAL = 88;

export default function SwipeRow({ children, onDelete }: Props) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const axis = useRef<'x' | 'y' | null>(null);

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
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture needs a real active pointer. The swipe still tracks moves on this row.
      }
    }
    if (axis.current !== 'x') return;
    const next = Math.min(0, Math.max(-REVEAL, startOffset.current + dx));
    setOffset(next);
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (axis.current === 'x') {
      setOffset(current => (current < -REVEAL / 2 ? -REVEAL : 0));
    }
    axis.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 w-[88px] bg-danger-600 text-white text-xs font-semibold"
      >
        Delete
      </button>
      <div
        style={{ transform: `translateX(${offset}px)` }}
        className="relative bg-white touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>
    </div>
  );
}
