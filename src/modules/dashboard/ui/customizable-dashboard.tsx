import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, CardBody, Switch } from '@heroui/react';
import { Eye, EyeOff, Settings, RotateCcw } from 'lucide-react';
import { SectionHeader } from '@/shared/ui/components/section-header.tsx';

type DashboardWidget = {
  readonly id: string;
  readonly title: string;
  readonly component: React.ComponentType<any>;
  readonly props?: Record<string, any>;
  readonly isVisible: boolean;
  readonly gridCols?: number;
  readonly gridRows?: number;
};

type DashboardLayout = {
  readonly widgets: readonly DashboardWidget[];
  readonly columns: number;
};

type CustomizableDashboardProps = {
  readonly initialLayout: DashboardLayout;
  readonly onLayoutChange?: (layout: DashboardLayout) => void;
  readonly className?: string;
};

const STORAGE_KEY = 'dashboard-layout';
const FIXED_WIDGETS = ['advanced-filters']; // Widgets that cannot be moved

const SortableWidget = ({ 
  widget, 
  children, 
  isCustomizing,
  isFixed = false 
}: { 
  widget: DashboardWidget; 
  children: React.ReactNode;
  isCustomizing: boolean;
  isFixed?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: widget.id,
    disabled: isFixed || !isCustomizing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!widget.isVisible) {
    return null;
  }

  // Pass drag handle props to be used in SectionHeader
  const dragHandleProps = {
    ...attributes,
    ...listeners
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        widget.gridCols === 2 ? 'col-span-1 lg:col-span-2' : 'col-span-1'
      } ${
        widget.gridRows === 2 ? 'row-span-1 lg:row-span-2' : 'row-span-1'
      }`}
    >
      {/* Clone children and inject drag handle props if it's a widget with header */}
      {React.cloneElement(children as React.ReactElement, {
        isDraggable: !isFixed,
        isCustomizing,
        isFixed,
        dragHandleProps: !isFixed ? dragHandleProps : undefined
      })}
    </div>
  );
};

// Helper functions for localStorage
const saveLayoutToStorage = (layout: DashboardLayout) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      widgetOrder: layout.widgets.map(w => w.id),
      widgetVisibility: layout.widgets.reduce((acc, w) => ({ ...acc, [w.id]: w.isVisible }), {}),
      columns: layout.columns
    }));
  } catch (error) {
    console.warn('Failed to save dashboard layout to localStorage:', error);
  }
};

const loadLayoutFromStorage = (initialLayout: DashboardLayout): DashboardLayout => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialLayout;
    
    const { widgetOrder, widgetVisibility, columns } = JSON.parse(saved);
    
    // Reorder widgets based on saved order, preserving new widgets
    const orderedWidgets = [...initialLayout.widgets];
    if (widgetOrder && Array.isArray(widgetOrder)) {
      orderedWidgets.sort((a, b) => {
        const aIndex = widgetOrder.indexOf(a.id);
        const bIndex = widgetOrder.indexOf(b.id);
        
        // New widgets (not in saved order) go to the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    }
    
    // Apply saved visibility settings
    const finalWidgets = orderedWidgets.map(widget => ({
      ...widget,
      isVisible: widgetVisibility?.[widget.id] ?? widget.isVisible
    }));
    
    return {
      widgets: finalWidgets,
      columns: columns ?? initialLayout.columns
    };
  } catch (error) {
    console.warn('Failed to load dashboard layout from localStorage:', error);
    return initialLayout;
  }
};

export const CustomizableDashboard = ({ 
  initialLayout, 
  onLayoutChange, 
  className = "" 
}: CustomizableDashboardProps) => {
  const [layout, setLayout] = useState<DashboardLayout>(() => loadLayoutFromStorage(initialLayout));
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Update layout when initialLayout changes (new widgets added, etc.)
  useEffect(() => {
    const newLayout = loadLayoutFromStorage(initialLayout);
    setLayout(newLayout);
  }, [initialLayout]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Prevent moving fixed widgets
      if (FIXED_WIDGETS.includes(active.id as string)) {
        return;
      }
      
      const oldIndex = layout.widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = layout.widgets.findIndex((widget) => widget.id === over.id);
      
      // Prevent dropping on fixed widgets
      const targetWidget = layout.widgets[newIndex];
      if (targetWidget && FIXED_WIDGETS.includes(targetWidget.id)) {
        return;
      }

      const newWidgets = arrayMove([...layout.widgets], oldIndex, newIndex);
      const newLayout = { ...layout, widgets: newWidgets };
      
      setLayout(newLayout);
      saveLayoutToStorage(newLayout);
      onLayoutChange?.(newLayout);
    }
  }, [layout, onLayoutChange]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    const newWidgets = layout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, isVisible: !widget.isVisible } : widget
    );
    const newLayout = { ...layout, widgets: newWidgets };
    
    setLayout(newLayout);
    saveLayoutToStorage(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const resetLayout = useCallback(() => {
    // Clear saved layout and reset to initial
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear dashboard layout from localStorage:', error);
    }
    
    setLayout(initialLayout);
    onLayoutChange?.(initialLayout);
  }, [initialLayout, onLayoutChange]);

  const visibleWidgets = layout.widgets.filter(widget => widget.isVisible);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dashboard Controls */}
      <SectionHeader
        icon={() => <span className="text-2xl">📊</span>}
        title="Team Dashboard"
        subtitle="Overview of team performance and objectives"
        className="mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          startContent={<RotateCcw className="w-4 h-4" />}
          onPress={resetLayout}
          className="dark:text-gray-300 dark:hover:text-gray-100"
        >
          Reset Layout
        </Button>
        
        <Button
          variant={isCustomizing ? "solid" : "ghost"}
          color="primary"
          size="sm"
          startContent={<Settings className="w-4 h-4" />}
          onPress={() => setIsCustomizing(!isCustomizing)}
        >
          {isCustomizing ? 'Done' : 'Customize'}
        </Button>
      </SectionHeader>

      {/* Widget Visibility Controls */}
      {isCustomizing && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardBody className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Widget Visibility
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {layout.widgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {widget.isVisible ? (
                      <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {widget.title}
                      {FIXED_WIDGETS.includes(widget.id) && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Fixed)</span>
                      )}
                    </span>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={widget.isVisible}
                    onValueChange={() => toggleWidgetVisibility(widget.id)}
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={visibleWidgets.map(w => w.id)} 
          strategy={rectSortingStrategy}
        >
          <div className={`grid gap-4 md:gap-6 ${
            layout.columns === 1 ? 'grid-cols-1' :
            layout.columns === 2 ? 'grid-cols-1 lg:grid-cols-2' :
            layout.columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {visibleWidgets.map((widget) => {
              const WidgetComponent = widget.component;
              
              return (
                <SortableWidget 
                  key={widget.id} 
                  widget={widget}
                  isCustomizing={isCustomizing}
                  isFixed={FIXED_WIDGETS.includes(widget.id)}
                >
                  <WidgetComponent {...(widget.props || {})} />
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Customization Hint */}
      {isCustomizing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <span className="text-lg">💡</span>
            Drag widgets by their handle to reorder, or use the switches above to show/hide widgets
          </p>
        </div>
      )}
    </div>
  );
};