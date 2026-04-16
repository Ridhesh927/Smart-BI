import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export function DraggableField({ field }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.name}`,
    data: field
  });
  
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 999
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-800 cursor-grab group transition-colors shadow-sm ${isDragging ? 'opacity-50 ring-2 ring-blue-500 bg-slate-800' : ''}`}
    >
      <div className="shrink-0">{field.icon}</div>
      <span className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">{field.name}</span>
    </div>
  );
}

export function DroppableShelf({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`relative rounded-md transition-all duration-200 ${className} ${isOver ? 'ring-2 ring-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}`}
    >
      {children}
    </div>
  );
}
