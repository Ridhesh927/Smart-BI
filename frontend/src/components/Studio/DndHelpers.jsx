import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const DraggablePill = React.memo(({ pill, sourceShelf, children }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pill-${pill.pillId}`,
    data: { ...pill, sourceShelf, isPill: true }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`transition-opacity cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      {children}
    </div>
  );
});

export const DraggableField = React.memo(({ field }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${field.name}`,
    data: field
  });
  

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-800 cursor-grab group transition-colors shadow-sm ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="shrink-0">{field.icon}</div>
      <span className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">{field.name}</span>
    </div>
  );
});

export const DroppableShelf = React.memo(({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`relative rounded-md transition-all duration-200 ${className} ${isOver ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}
    >
      {children}
    </div>
  );
});
