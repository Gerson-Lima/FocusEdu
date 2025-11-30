import { useState, useEffect, useMemo, useRef } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import { useActivities, useKanban, activitiesService } from '@/hooks/useActivities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Activity, KanbanColumn, ActivityStatus } from '@/types/firebase';
import { format } from 'date-fns';

// colunas padrão que NÃO podem ser apagadas
const DEFAULT_COLUMNS_TITLES = ['por fazer', 'em andamento', 'concluído', 'em atraso'];

function isDefaultColumnTitle(title: string) {
  return DEFAULT_COLUMNS_TITLES.includes(title.toLowerCase());
}

// mapeamento simples de título da coluna -> status da atividade
const STATUS_MAP: Record<string, ActivityStatus> = {
  'Por fazer': 'nao_iniciada',
  'Em andamento': 'pendente',
  'Concluído': 'concluida',
  'Em atraso': 'atrasada',
};

const CATEGORIES = [
  'atividade',
  'prova',
  'tarefa',
  'mentoria',
  'leitura',
  'revisao',
  'projeto',
  'seminario',
  'orientacao',
] as const;

interface KanbanCardProps {
  activity: Activity;
  courseName?: string;
}

function KanbanCard({ activity, courseName }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      <h3 className="font-medium text-sm mb-2">{activity.title}</h3>
      {activity.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {activity.description}
        </p>
      )}
      {courseName && (
        <p className="text-[11px] text-slate-500 mb-1">Disciplina: {courseName}</p>
      )}
      <div className="flex items-center justify-between gap-2 mt-3">
        <Badge variant="outline" className="text-xs">
          {activity.category}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(activity.dueDate), 'dd/MM')}
        </span>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  activities: Activity[];
  onAddCard: () => void;
  onDeleteColumn?: () => void;
  isDefault?: boolean;
}

function KanbanColumnComponent({
  column,
  activities,
  onAddCard,
  onDeleteColumn,
  isDefault,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px]">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{column.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activities.length}</Badge>

              {!isDefault && onDeleteColumn && (
                <button
                  type="button"
                  onClick={onDeleteColumn}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Apagar coluna"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SortableContext
            items={activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 min-h-[200px]">
              {activities.map((activity) => (
                <KanbanCard
                  key={activity.id}
                  activity={activity}
                  courseName={activity.courseName}
                />
              ))}
            </div>
          </SortableContext>
          <Button onClick={onAddCard} variant="outline" className="w-full mt-4" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Card
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Kanban() {
  const { currentUser } = useFirebaseAuth();
  const { activities, courses, loading, refreshData: refreshActivities } = useActivities();
  const { columns: kanbanColumns, items: kanbanItems, refreshData: refreshKanban } = useKanban();

  const [activeId, setActiveId] = useState<string | null>(null);

  // 🔹 inicializa com a última disciplina salva no localStorage
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('focusedu_last_kanban_discipline') || '';
    } catch {
      return '';
    }
  });

  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string>('');
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const [newCardData, setNewCardData] = useState({
    title: '',
    description: '',
    category: 'atividade' as (typeof CATEGORIES)[number],
    dueDate: '',
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('focusedu_hidden_kanban_columns');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 🔹 salva a última disciplina sempre que mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (selectedDiscipline) {
      localStorage.setItem('focusedu_last_kanban_discipline', selectedDiscipline);
    } else {
      localStorage.removeItem('focusedu_last_kanban_discipline');
    }
  }, [selectedDiscipline]);

  const uniqueDisciplines = useMemo(() => {
    const names = new Set<string>();
    activities.forEach((a) => {
      if (a.courseName) {
        names.add(a.courseName);
      } else if (a.courseId) {
        const course = courses.find((c) => c.id === a.courseId);
        if (course) names.add(course.name);
      }
    });
    return Array.from(names).sort();
  }, [activities, courses]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('focusedu_hidden_kanban_columns', JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  // Track which activities have been processed to avoid infinite loops
  const processedActivitiesRef = useRef<Set<string>>(new Set());
  const isCreatingItemsRef = useRef(false);

  // Create kanban items for new activities (only once per activity)
  useEffect(() => {
    if (!currentUser || activities.length === 0 || kanbanColumns.length === 0) return;
    
    // Prevent concurrent execution
    if (isCreatingItemsRef.current) return;

    const existingActivityIds = new Set(kanbanItems.map((item) => item.activityId));
    const newActivities = activities.filter(
      (a) => !existingActivityIds.has(a.id) && !processedActivitiesRef.current.has(a.id)
    );

    if (newActivities.length > 0) {
      const firstColumn = kanbanColumns.find((col) => 
        col.title.toLowerCase().includes('por fazer') || 
        col.title.toLowerCase().includes('fazer')
      ) || kanbanColumns[0];
      
      if (firstColumn) {
        isCreatingItemsRef.current = true;
        
        (async () => {
          try {
            // Mark activities as being processed
            newActivities.forEach((a) => processedActivitiesRef.current.add(a.id));

            for (let i = 0; i < newActivities.length; i++) {
              const activity = newActivities[i];
              
              // Double-check that item doesn't exist before creating
              // This check is already done above, but we verify again to be safe
              const itemExists = existingActivityIds.has(activity.id);
              if (itemExists) {
                processedActivitiesRef.current.delete(activity.id);
                continue;
              }
              
              try {
                await activitiesService.createKanbanItem({
                  userId: currentUser.uid,
                  columnId: firstColumn.id,
                  activityId: activity.id,
                  order: kanbanItems.length + i,
                });
              } catch (error) {
                // If creation fails, remove from processed set to allow retry
                processedActivitiesRef.current.delete(activity.id);
                console.error('Error creating kanban item for activity:', activity.id, error);
              }
            }

            refreshKanban();
          } catch (error) {
            console.error('Error creating kanban items:', error);
          } finally {
            isCreatingItemsRef.current = false;
          }
        })();
      }
    }
  }, [activities.length, kanbanColumns.length, kanbanItems.length, currentUser?.uid]);

  // Reset processed activities when user changes
  useEffect(() => {
    processedActivitiesRef.current.clear();
    isCreatingItemsRef.current = false;
  }, [currentUser?.uid]);

  const filteredActivities = useMemo(() => {
    if (!selectedDiscipline) return [];

    return activities.filter((a) => {
      const activityDiscipline =
        a.courseName || courses.find((c) => c.id === a.courseId)?.name || '';
      return activityDiscipline === selectedDiscipline;
    });
  }, [activities, selectedDiscipline, courses]);

  const activitiesByColumn = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};

    kanbanColumns.forEach((column) => {
      const itemsInColumn = kanbanItems
        .filter((item) => item.columnId === column.id)
        .sort((a, b) => a.order - b.order);

      grouped[column.id] = itemsInColumn
        .map((item) => filteredActivities.find((a) => a.id === item.activityId))
        .filter((a): a is Activity => a !== undefined);
    });

    return grouped;
  }, [kanbanColumns, kanbanItems, filteredActivities]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !currentUser) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedActivity = activities.find((a) => a.id === activeId);
    if (!draggedActivity) return;

    const kanbanItem = kanbanItems.find((item) => item.activityId === activeId);
    if (!kanbanItem) return;

    let targetColumnId: string;

    const targetColumn = kanbanColumns.find((col) => col.id === overId);
    if (targetColumn) {
      targetColumnId = targetColumn.id;
    } else {
      const targetItem = kanbanItems.find((item) => item.activityId === overId);
      if (targetItem) {
        targetColumnId = targetItem.columnId;
      } else {
        return;
      }
    }

    if (kanbanItem.columnId === targetColumnId) return;

    await activitiesService.updateKanbanItem(kanbanItem.id, { columnId: targetColumnId });

    const column = kanbanColumns.find((c) => c.id === targetColumnId);
    if (column && STATUS_MAP[column.title]) {
      const newStatus = STATUS_MAP[column.title];
      const updates: Partial<Activity> = { status: newStatus };

      if (newStatus === 'concluida' && !draggedActivity.completedAt) {
        updates.completedAt = Date.now();
      }

      await activitiesService.updateActivity(draggedActivity.id, updates);
    }

    toast.success(`Atividade movida para "${column?.title ?? 'coluna'}"`);

    refreshKanban();
    refreshActivities();
  };

  const handleAddCard = (columnId: string) => {
    setSelectedColumnForCard(columnId);
    setIsAddCardDialogOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !currentUser ||
      !selectedColumnForCard ||
      !newCardData.title ||
      !newCardData.dueDate ||
      !selectedDiscipline
    ) {
      toast.error('Preencha todos os campos obrigatórios e selecione uma disciplina');
      return;
    }

    try {
      const activityData: Omit<Activity, 'id'> = {
        userId: currentUser.uid,
        title: newCardData.title,
        description: newCardData.description,
        courseId: selectedDiscipline,
        courseName: selectedDiscipline,
        category: newCardData.category,
        status: 'nao_iniciada',
        dueDate: new Date(newCardData.dueDate).getTime(),
        createdAt: Date.now(),
      };


      const activityId = await activitiesService.createActivity(activityData);

      // também gravar um report no documento `data/{userId}` para visualizar em relatórios
      // createActivity already saves report-like fields into the activity document

      await activitiesService.createKanbanItem({
        userId: currentUser.uid,
        columnId: selectedColumnForCard,
        activityId,
        order: kanbanItems.filter((i) => i.columnId === selectedColumnForCard).length,
      });

      toast.success('Card criado com sucesso!');
      setNewCardData({
        title: '',
        description: '',
        category: 'atividade',
        dueDate: '',
      });
      setIsAddCardDialogOpen(false);
      refreshActivities();
      refreshKanban();
    } catch (error) {
      console.error('Erro ao criar card:', error);
      toast.error('Erro ao criar card');
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !newColumnTitle.trim()) {
      toast.error('Digite o nome da coluna');
      return;
    }

    try {
      await activitiesService.createKanbanColumn({
        userId: currentUser.uid,
        title: newColumnTitle,
        order: kanbanColumns.length,
      });

      toast.success('Coluna criada com sucesso!');
      setNewColumnTitle('');
      setIsAddColumnDialogOpen(false);
      refreshKanban();
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast.error('Erro ao criar coluna');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = kanbanColumns.find((c) => c.id === columnId);
    if (!column) return;

    if (isDefaultColumnTitle(column.title)) {
      toast.error('Esta coluna padrão não pode ser apagada.');
      return;
    }

    if (!confirm(`Tem certeza que deseja apagar a coluna "${column.title}"?`)) {
      return;
    }

    try {
      // Delete all kanban items in this column first
      const itemsInColumn = kanbanItems.filter((item) => item.columnId === columnId);
      for (const item of itemsInColumn) {
        await activitiesService.deleteKanbanItem(item.id);
      }

      // Delete the column from Firebase
      const { deleteKanbanColumn } = await import('@/lib/firebaseServices');
      await deleteKanbanColumn(columnId);

      toast.success('Coluna apagada com sucesso!');
      refreshKanban();
    } catch (error) {
      console.error('Erro ao apagar coluna:', error);
      toast.error('Erro ao apagar coluna');
    }
  };

  const activeActivity = activeId ? activities.find((a) => a.id === activeId) : null;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando quadro...</p>
        </div>
      </MainLayout>
    );
  }

  // Show message if no columns are available
  if (kanbanColumns.length === 0) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma coluna disponível. As colunas padrão serão criadas automaticamente.</p>
            <p className="mt-2">Aguarde alguns instantes ou recarregue a página.</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filtro de disciplina */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Disciplina:</label>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueDisciplines.map((discipline) => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setIsAddColumnDialogOpen(true)} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nova Coluna
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Se NÃO tiver disciplina selecionada */}
        {!selectedDiscipline ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Selecione uma disciplina para visualizar o quadro Kanban.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quadro Kanban */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 overflow-x-auto pb-4">
                {kanbanColumns
                  .filter((column) => !hiddenColumns.includes(column.id))
                  .map((column) => (
                    <KanbanColumnComponent
                      key={column.id}
                      column={column}
                      activities={activitiesByColumn[column.id] || []}
                      onAddCard={() => handleAddCard(column.id)}
                      onDeleteColumn={
                        isDefaultColumnTitle(column.title)
                          ? undefined
                          : () => handleDeleteColumn(column.id)
                      }
                      isDefault={isDefaultColumnTitle(column.title)}
                    />
                  ))}
              </div>

              <DragOverlay>
                {activeActivity && (
                  <div className="rotate-3">
                    <KanbanCard
                      activity={activeActivity}
                      courseName={activeActivity.courseName}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>

            {/* Sem atividades para a disciplina selecionada */}
            {filteredActivities.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>
                    Nenhuma atividade cadastrada para a disciplina &quot;
                    {selectedDiscipline}&quot;.
                  </p>
                  <p className="mt-2">
                    Crie atividades na página &quot;Minhas Atividades&quot; ou use o botão
                    &quot;Adicionar Card&quot; nas colunas.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal: novo card */}
      <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Card</DialogTitle>
            <DialogDescription>
              Crie um novo card para a disciplina &quot;{selectedDiscipline || '—'}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newCardData.title}
                onChange={(e) =>
                  setNewCardData({ ...newCardData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newCardData.description}
                onChange={(e) =>
                  setNewCardData({ ...newCardData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={newCardData.category}
                  onValueChange={(value) =>
                    setNewCardData({
                      ...newCardData,
                      category: value as (typeof CATEGORIES)[number],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newCardData.dueDate}
                  onChange={(e) =>
                    setNewCardData({ ...newCardData, dueDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCardDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Card</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: nova coluna */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
            <DialogDescription>
              Crie uma nova coluna para organizar suas atividades
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddColumn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="columnTitle">Nome da Coluna *</Label>
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Ex: Revisão, Entregue, etc."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddColumnDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Coluna</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
