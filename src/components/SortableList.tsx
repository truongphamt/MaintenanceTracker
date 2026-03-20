import { useState, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  isReorderMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableItem({ id, children, isReorderMode, isFirst, isLast, onMoveUp, onMoveDown }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : ''}>
      <div className="flex items-stretch gap-0">
        {isReorderMode && (
          <div className="flex flex-col items-center justify-center shrink-0">
            <button
              className="touch-none p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing hidden sm:flex items-center"
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
            >
              <GripVertical size={18} />
            </button>
            <div className="flex flex-col sm:hidden">
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className={`p-1.5 ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-primary-600 active:bg-primary-50'} rounded transition`}
                aria-label="Move up"
              >
                <ChevronUp size={16} />
              </button>
              <button
                className="touch-none p-1 text-gray-300 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical size={14} />
              </button>
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className={`p-1.5 ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-primary-600 active:bg-primary-50'} rounded transition`}
                aria-label="Move down"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function ReorderButton({ active, onToggle, itemCount }: { active: boolean; onToggle: () => void; itemCount: number }) {
  if (itemCount <= 1) return null;

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
        active
          ? 'bg-primary-100 text-primary-700 border border-primary-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
      }`}
    >
      <ArrowUpDown size={14} />
      {active ? 'Done' : 'Reorder'}
    </button>
  );
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (newIds: string[]) => void;
  renderItem: (item: T, isReorderMode: boolean) => ReactNode;
  className?: string;
  isReorderMode?: boolean;
  showButton?: boolean;
}

export default function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className = 'space-y-2',
  isReorderMode: externalReorderMode,
  showButton = true,
}: SortableListProps<T>) {
  const [internalReorderMode, setInternalReorderMode] = useState(false);
  const isReorderMode = externalReorderMode ?? internalReorderMode;
  const showInternalButton = showButton && externalReorderMode === undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = [...items];
      const [moved] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, moved);
      onReorder(newItems.map(i => i.id));
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, moved);
    onReorder(newItems.map(i => i.id));
  };

  if (items.length <= 1) {
    return <div className={className}>{items.map(item => renderItem(item, false))}</div>;
  }

  return (
    <div>
      {showInternalButton && (
        <div className="flex justify-end mb-2">
          <ReorderButton active={isReorderMode} onToggle={() => setInternalReorderMode(!internalReorderMode)} itemCount={items.length} />
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className={className}>
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                isReorderMode={isReorderMode}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                onMoveUp={() => moveItem(index, -1)}
                onMoveDown={() => moveItem(index, 1)}
              >
                {renderItem(item, isReorderMode)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
