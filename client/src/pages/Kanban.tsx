import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import MainLayout from "@/components/MainLayout";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { useActivities, useKanban, activitiesService } from "@/hooks/useActivities";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type {
  Activity,
  KanbanColumn,
  ActivityStatus,
  ActivityPriority,
  ActivityTag,
} from "@/types/firebase";
import { format } from "date-fns";

const DEFAULT_COLUMNS_TITLES = ["por fazer", "em andamento", "concluído", "em atraso"];

function isDefaultColumnTitle(title: string) {
  return DEFAULT_COLUMNS_TITLES.includes(title.toLowerCase());
}

const STATUS_MAP: Record<string, ActivityStatus> = {
  "Por fazer": "nao_iniciada",
  "Em andamento": "pendente",
  "Concluído": "concluida",
  "Em atraso": "atrasada",
};

const CATEGORIES = [
  "atividade",
  "prova",
  "tarefa",
  "mentoria",
  "leitura",
  "revisao",
  "projeto",
  "seminario",
  "orientacao",
] as const;

const PRIORITY_LABELS: Record<ActivityPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const PRIORITY_COLORS: Record<ActivityPriority, string> = {
  alta: "bg-red-100 text-red-800",
  media: "bg-yellow-100 text-yellow-800",
  baixa: "bg-green-100 text-green-800",
};

const NO_DISCIPLINE_KEY = "__sem_disciplina__";

function getDisciplineLabel(value?: string): string {
  if (!value) return "—";
  if (value === NO_DISCIPLINE_KEY) return "Sem disciplina";
  return value;
}

function buildLocalDateTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

interface KanbanCardProps {
  activity: Activity;
  courseName?: string;
  onClick: () => void;
  isOverlay?: boolean;
}

function KanbanCard({ activity, courseName, onClick, isOverlay = false }: KanbanCardProps) {
  const priority = (activity.priority ?? "media") as ActivityPriority;
  const tags = (activity.tags ?? []) as ActivityTag[];

  const content = (
    <>
      <h3 className="font-medium text-sm mb-2 line-clamp-2">{activity.title}</h3>

      {activity.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {activity.description}
        </p>
      )}

      <p className="text-[11px] text-slate-500 mb-2">
        Disciplina: {courseName || "Sem disciplina"}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border truncate max-w-[120px]"
              style={{
                borderColor: tag.color,
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
              title={tag.label}
            >
              {tag.label}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activity.category}
          </Badge>
          <Badge className={`${PRIORITY_COLORS[priority]} text-[10px]`}>
            {PRIORITY_LABELS[priority]}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(activity.dueDate), "dd/MM")}
        </span>
      </div>
    </>
  );

  if (isOverlay) {
    return (
      <div
        onClick={onClick}
        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grabbing"
      >
        {content}
      </div>
    );
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "pointer",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    >
      {content}
    </div>
  );
}

function KanbanColumnOverlay({
  column,
  activities,
}: {
  column: KanbanColumn;
  activities: Activity[];
}) {
  return (
    <div className="flex-1 min-w-[300px]">
      <Card className="cursor-grabbing">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{column.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activities.length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 min-h-[200px] opacity-70">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white p-3 rounded-lg border border-slate-200 text-xs line-clamp-1"
              >
                {activity.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  activities: Activity[];
  onAddCard: () => void;
  onDeleteColumn?: () => void;
  isDefault?: boolean;
  onCardClick: (activity: Activity) => void;
}

function KanbanColumnComponent({
  column,
  activities,
  onAddCard,
  onDeleteColumn,
  isDefault,
  onCardClick,
}: KanbanColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex-1 min-w-[300px]">
      <Card>
        <CardHeader
          className="pb-3 cursor-grab hover:cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{column.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activities.length}</Badge>

              {!isDefault && onDeleteColumn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteColumn();
                  }}
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
          <SortableContext items={activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 min-h-[200px]">
              {activities.map((activity) => (
                <KanbanCard
                  key={activity.id}
                  activity={activity}
                  courseName={activity.courseName}
                  onClick={() => onCardClick(activity)}
                />
              ))}
            </div>
          </SortableContext>

          <Button onClick={onAddCard} variant="outline" className="w-full mt-4" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar card
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

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("focusedu_last_kanban_discipline") || "";
    } catch {
      return "";
    }
  });

  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string>("");
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const [newCardData, setNewCardData] = useState({
    title: "",
    description: "",
    category: "atividade" as (typeof CATEGORIES)[number],
    dueDate: "",
    priority: "media" as ActivityPriority,
    tags: [] as ActivityTag[],
  });

  const [newTagInput, setNewTagInput] = useState({ label: "", color: "#3b82f6" });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    category: "atividade" as (typeof CATEGORIES)[number],
    dueDate: "",
    priority: "media" as ActivityPriority,
    tags: [] as ActivityTag[],
  });
  const [editTagInput, setEditTagInput] = useState({ label: "", color: "#3b82f6" });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("focusedu_hidden_kanban_columns");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isColumnOrderHydrated, setIsColumnOrderHydrated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("focusedu_kanban_column_order");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setColumnOrder(Array.from(new Set(parsed)));
          }
        } catch {

        }
      }
    } catch {}
    setIsColumnOrderHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (selectedDiscipline) {
      localStorage.setItem("focusedu_last_kanban_discipline", selectedDiscipline);
    } else {
      localStorage.removeItem("focusedu_last_kanban_discipline");
    }
  }, [selectedDiscipline]);

  const uniqueDisciplines = useMemo(() => {
    const keys = new Set<string>();

    activities.forEach((a) => {
      const disciplineKey =
        a.courseName || courses.find((c) => c.id === a.courseId)?.name || NO_DISCIPLINE_KEY;
      keys.add(disciplineKey);
    });

    return Array.from(keys).sort((a, b) => {
      if (a === NO_DISCIPLINE_KEY) return 1;
      if (b === NO_DISCIPLINE_KEY) return -1;
      return a.localeCompare(b);
    });
  }, [activities, courses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("focusedu_hidden_kanban_columns", JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  useEffect(() => {
    if (!isColumnOrderHydrated) return;

    const ids = kanbanColumns.map((c) => c.id);
    setColumnOrder((prev) => {
      const existing = Array.from(new Set(prev.filter((id) => ids.includes(id))));
      const missing = ids.filter((id) => !existing.includes(id));
      const merged = [...existing, ...missing];

      if (typeof window !== "undefined") {
        localStorage.setItem("focusedu_kanban_column_order", JSON.stringify(merged));
      }
      return merged;
    });
  }, [kanbanColumns, isColumnOrderHydrated]);

  const orderedColumns = useMemo(() => {
    const idToColumn = new Map(kanbanColumns.map((c) => [c.id, c] as const));
    const fromOrder = columnOrder
      .map((id) => idToColumn.get(id))
      .filter((c): c is KanbanColumn => !!c);
    const remaining = kanbanColumns.filter((c) => !columnOrder.includes(c.id));
    return [...fromOrder, ...remaining];
  }, [kanbanColumns, columnOrder]);

  const filteredActivities = useMemo(() => {
    if (!selectedDiscipline) return [];

    return activities.filter((a) => {
      const disciplineKey =
        a.courseName || courses.find((c) => c.id === a.courseId)?.name || NO_DISCIPLINE_KEY;
      return disciplineKey === selectedDiscipline;
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

  const processedActivitiesRef = useRef<Set<string>>(new Set());
  const isCreatingItemsRef = useRef(false);

  useEffect(() => {
    if (!currentUser || activities.length === 0 || kanbanColumns.length === 0) return;
    if (isCreatingItemsRef.current) return;

    const existingActivityIds = new Set(kanbanItems.map((item) => item.activityId));
    const newActivities = activities.filter(
      (a) => !existingActivityIds.has(a.id) && !processedActivitiesRef.current.has(a.id)
    );

    if (newActivities.length === 0) return;

    const firstColumn =
      kanbanColumns.find(
        (col) => col.title.toLowerCase().includes("por fazer") || col.title.toLowerCase().includes("fazer")
      ) || kanbanColumns[0];

    if (!firstColumn) return;

    isCreatingItemsRef.current = true;

    (async () => {
      try {
        newActivities.forEach((a) => processedActivitiesRef.current.add(a.id));

        for (let i = 0; i < newActivities.length; i++) {
          const activity = newActivities[i];

          if (existingActivityIds.has(activity.id)) {
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
          } catch (err) {
            processedActivitiesRef.current.delete(activity.id);
            console.error("Error creating kanban item:", activity.id, err);
          }
        }

        refreshKanban();
      } catch (err) {
        console.error("Error creating kanban items:", err);
      } finally {
        isCreatingItemsRef.current = false;
      }
    })();
  }, [activities.length, kanbanColumns.length, kanbanItems.length, currentUser?.uid]);

  useEffect(() => {
    processedActivitiesRef.current.clear();
    isCreatingItemsRef.current = false;
  }, [currentUser?.uid]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 1) drag de COLUNA (ordem visual / localStorage)
    const isColumnDrag = kanbanColumns.some((c) => c.id === activeId);
    if (isColumnDrag) {
      if (!kanbanColumns.some((c) => c.id === overId)) return;

      setColumnOrder((prev) => {
        const current = prev.length ? [...prev] : kanbanColumns.map((c) => c.id);
        const oldIndex = current.indexOf(activeId);
        const newIndex = current.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return current;

        const reordered = arrayMove(current, oldIndex, newIndex);

        if (typeof window !== "undefined") {
          localStorage.setItem("focusedu_kanban_column_order", JSON.stringify(reordered));
        }
        return reordered;
      });

      return;
    }

    if (!currentUser) return;

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
      if (!targetItem) return;
      targetColumnId = targetItem.columnId;
    }

    if (kanbanItem.columnId === targetColumnId) return;

    await activitiesService.updateKanbanItem(kanbanItem.id, { columnId: targetColumnId });

    const column = kanbanColumns.find((c) => c.id === targetColumnId);
    if (column && STATUS_MAP[column.title]) {
      const newStatus = STATUS_MAP[column.title];
      const updates: Partial<Activity> = { status: newStatus };

      if (newStatus === "concluida" && !draggedActivity.completedAt) {
        updates.completedAt = Date.now();
      }

      await activitiesService.updateActivity(draggedActivity.id, updates);
    }

    toast.success(`Atividade movida para "${column?.title ?? "coluna"}"`);

    refreshKanban();
    refreshActivities();
  };

  const handleAddColumn = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUser || !newColumnTitle.trim()) {
      toast.error("Digite o nome da coluna");
      return;
    }

    try {
      const maybeId = await (activitiesService as any).createKanbanColumn?.({
        userId: currentUser.uid,
        title: newColumnTitle,
        order: kanbanColumns.length,
      });

      if (typeof maybeId === "string" && maybeId) {
        setColumnOrder((prev) => {
          if (prev.includes(maybeId)) {
            return prev;
          }
          const updated = [...prev, maybeId];
          if (typeof window !== "undefined") {
            localStorage.setItem("focusedu_kanban_column_order", JSON.stringify(updated));
          }
          return updated;
        });
      }

      toast.success("Coluna criada com sucesso!");
      setNewColumnTitle("");
      setIsAddColumnDialogOpen(false);
      refreshKanban();
    } catch (error) {
      console.error("Erro ao criar coluna:", error);
      toast.error("Erro ao criar coluna");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = kanbanColumns.find((c) => c.id === columnId);
    if (!column) return;

    if (isDefaultColumnTitle(column.title)) {
      toast.error("Esta coluna padrão não pode ser apagada.");
      return;
    }

    if (!confirm(`Tem certeza que deseja apagar a coluna "${column.title}"?`)) return;

    try {
      // apaga itens da coluna
      const itemsInColumn = kanbanItems.filter((item) => item.columnId === columnId);
      for (const item of itemsInColumn) {
        await activitiesService.deleteKanbanItem(item.id);
      }

      // apaga coluna
      const { deleteKanbanColumn } = await import("@/lib/firebaseServices");
      await deleteKanbanColumn(columnId);

      // remove de ordem local
      setColumnOrder((prev) => {
        const next = prev.filter((id) => id !== columnId);
        if (typeof window !== "undefined") {
          localStorage.setItem("focusedu_kanban_column_order", JSON.stringify(next));
        }
        return next;
      });

      // (opcional) garante sumiço imediato
      setHiddenColumns((prev) => (prev.includes(columnId) ? prev : [...prev, columnId]));

      toast.success("Coluna apagada com sucesso!");
      refreshKanban();
    } catch (error) {
      console.error("Erro ao apagar coluna:", error);
      toast.error("Erro ao apagar coluna");
    }
  };

  /* ------------------------------------------------------------------- */
  /* CRUD: CARD / ACTIVITY                                                 */
  /* ------------------------------------------------------------------- */

  const handleAddCard = (columnId: string) => {
    setSelectedColumnForCard(columnId);
    setNewCardData({
      title: "",
      description: "",
      category: "atividade",
      dueDate: "",
      priority: "media",
      tags: [],
    });
    setNewTagInput({ label: "", color: "#3b82f6" });
    setIsAddCardDialogOpen(true);
  };

  const handleCreateCard = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUser || !selectedColumnForCard || !newCardData.title || !newCardData.dueDate || !selectedDiscipline) {
      toast.error("Preencha todos os campos obrigatórios e selecione uma disciplina");
      return;
    }

    try {
      const isNoDiscipline = selectedDiscipline === NO_DISCIPLINE_KEY;

      const activityData: Omit<Activity, "id"> = {
        userId: currentUser.uid,
        title: newCardData.title,
        description: newCardData.description,
        courseId: isNoDiscipline ? "" : selectedDiscipline,
        courseName: isNoDiscipline ? undefined : selectedDiscipline,
        category: newCardData.category,
        status: "nao_iniciada",
        dueDate: buildLocalDateTimestamp(newCardData.dueDate),
        createdAt: Date.now(),
        completedAt: undefined,
        priority: newCardData.priority,
        tags: newCardData.tags,
      };

      const activityId = await activitiesService.createActivity(activityData);

      await activitiesService.createKanbanItem({
        userId: currentUser.uid,
        columnId: selectedColumnForCard,
        activityId,
        order: kanbanItems.filter((i) => i.columnId === selectedColumnForCard).length,
      });

      toast.success("Card criado com sucesso!");
      setIsAddCardDialogOpen(false);
      refreshActivities();
      refreshKanban();
    } catch (error) {
      console.error("Erro ao criar card:", error);
      toast.error("Erro ao criar card");
    }
  };

  const handleOpenEditActivity = (activity: Activity) => {
    const courseName = activity.courseName || activity.courseId || "";

    setEditingActivity(activity);
    setEditFormData({
      title: activity.title,
      description: activity.description,
      courseId: courseName,
      category: activity.category,
      dueDate: format(new Date(activity.dueDate), "yyyy-MM-dd"),
      priority: (activity.priority ?? "media") as ActivityPriority,
      tags: (activity.tags ?? []) as ActivityTag[],
    });
    setEditTagInput({ label: "", color: "#3b82f6" });
    setIsEditDialogOpen(true);
  };

  const handleUpdateActivity = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingActivity) return;

    try {
      const dueTimestamp = buildLocalDateTimestamp(editFormData.dueDate);

      const courseId = editFormData.courseId.trim();
      const courseName = courseId || "";

      const updates: Partial<Activity> = {
        title: editFormData.title,
        description: editFormData.description,
        courseId,
        courseName,
        category: editFormData.category,
        dueDate: dueTimestamp,
        priority: editFormData.priority,
        tags: editFormData.tags,
      };

      await activitiesService.updateActivity(editingActivity.id, updates);

      toast.success("Atividade atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setEditingActivity(null);
      refreshActivities();
      refreshKanban();
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      toast.error("Erro ao atualizar atividade");
    }
  };

  const handleDeleteActivityFromModal = async () => {
    if (!editingActivity) return;
    if (!confirm("Tem certeza que deseja excluir esta atividade?")) return;

    try {
      // apaga itens kanban ligados
      const linkedItems = kanbanItems.filter((i) => i.activityId === editingActivity.id);
      for (const item of linkedItems) {
        await activitiesService.deleteKanbanItem(item.id);
      }

      // apaga atividade (via service se existir; senão via firebaseServices)
      const svc: any = activitiesService as any;
      if (typeof svc.deleteActivity === "function") {
        await svc.deleteActivity(editingActivity.id);
      } else {
        const { deleteActivity } = await import("@/lib/firebaseServices");
        await deleteActivity(editingActivity.id);
      }

      toast.success("Atividade excluída com sucesso!");
      setIsEditDialogOpen(false);
      setEditingActivity(null);
      refreshActivities();
      refreshKanban();
    } catch (error) {
      console.error("Erro ao excluir atividade:", error);
      toast.error("Erro ao excluir atividade");
    }
  };

  /* ------------------------------------------------------------------- */
  /* TAGS                                                                 */
  /* ------------------------------------------------------------------- */

  const handleAddNewCardTag = () => {
    const label = newTagInput.label.trim();
    if (!label) return;

    const newTag: ActivityTag = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      color: newTagInput.color || "#3b82f6",
    };

    setNewCardData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
    setNewTagInput((prev) => ({ ...prev, label: "" }));
  };

  const handleRemoveNewCardTag = (id: string) => {
    setNewCardData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t.id !== id) }));
  };

  const handleAddEditTag = () => {
    const label = editTagInput.label.trim();
    if (!label) return;

    const newTag: ActivityTag = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      color: editTagInput.color || "#3b82f6",
    };

    setEditFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
    setEditTagInput((prev) => ({ ...prev, label: "" }));
  };

  const handleRemoveEditTag = (id: string) => {
    setEditFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t.id !== id) }));
  };

  const activeActivity = activeId ? activities.find((a) => a.id === activeId) : null;
  const activeColumn = activeId && !activeActivity ? kanbanColumns.find((c) => c.id === activeId) : null;

  const canAddNewTag = !!newTagInput.label.trim();
  const canAddEditTag = !!editTagInput.label.trim();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando quadro...</p>
        </div>
      </MainLayout>
    );
  }

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
                      {getDisciplineLabel(discipline)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setIsAddColumnDialogOpen(true)} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nova coluna
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedDiscipline ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Selecione uma disciplina para visualizar o quadro Kanban.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={orderedColumns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {orderedColumns
                    .filter((column) => !hiddenColumns.includes(column.id))
                    .map((column) => (
                      <KanbanColumnComponent
                        key={column.id}
                        column={column}
                        activities={activitiesByColumn[column.id] || []}
                        onAddCard={() => handleAddCard(column.id)}
                        onDeleteColumn={
                          isDefaultColumnTitle(column.title) ? undefined : () => handleDeleteColumn(column.id)
                        }
                        isDefault={isDefaultColumnTitle(column.title)}
                        onCardClick={handleOpenEditActivity}
                      />
                    ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                {activeActivity && (
                  <div className="rotate-3">
                    <KanbanCard
                      activity={activeActivity}
                      courseName={activeActivity.courseName}
                      onClick={() => {}}
                      isOverlay
                    />
                  </div>
                )}
                {!activeActivity && activeColumn && (
                  <div className="rotate-3">
                    <KanbanColumnOverlay
                      column={activeColumn}
                      activities={activitiesByColumn[activeColumn.id] || []}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>

            {filteredActivities.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>
                    Nenhuma atividade cadastrada para a disciplina "
                    {getDisciplineLabel(selectedDiscipline)}".
                  </p>
                  <p className="mt-2">
                    Crie atividades na página "Minhas Atividades" ou use o botão "Adicionar card" nas colunas.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* MODAL: NOVO CARD */}
      <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo card</DialogTitle>
            <DialogDescription>
              Crie um novo card para a disciplina "{getDisciplineLabel(selectedDiscipline)}"
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newCardData.title}
                onChange={(e) => setNewCardData({ ...newCardData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newCardData.description}
                onChange={(e) => setNewCardData({ ...newCardData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  placeholder="Nome da tag"
                  value={newTagInput.label}
                  onChange={(e) => setNewTagInput((prev) => ({ ...prev, label: e.target.value }))}
                  className="flex-1 min-w-[140px]"
                />
                <input
                  type="color"
                  value={newTagInput.color}
                  onChange={(e) => setNewTagInput((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-9 w-9 p-0 border rounded cursor-pointer bg-transparent"
                />
                <Button
                  type="button"
                  variant={canAddNewTag ? "default" : "outline"}
                  onClick={handleAddNewCardTag}
                  disabled={!canAddNewTag}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar tag
                </Button>
              </div>

              {newCardData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {newCardData.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border"
                      style={{
                        borderColor: tag.color,
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewCardTag(tag.id)}
                        className="text-[12px] leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                <Label htmlFor="priority">Prioridade *</Label>
                <Select
                  value={newCardData.priority}
                  onValueChange={(value) =>
                    setNewCardData({
                      ...newCardData,
                      priority: value as ActivityPriority,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de entrega *</Label>
              <Input
                id="dueDate"
                type="date"
                value={newCardData.dueDate}
                onChange={(e) => setNewCardData({ ...newCardData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCardDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar card</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVA COLUNA */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova coluna</DialogTitle>
            <DialogDescription>Crie uma nova coluna para organizar suas atividades</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddColumn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="columnTitle">Nome da coluna *</Label>
              <Input
                id="columnTitle"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Ex: Revisão, Entregue, etc."
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar coluna</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ATIVIDADE */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
            <DialogDescription>Atualize as informações da atividade selecionada</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateActivity} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course">Disciplina</Label>
              <Input
                id="edit-course"
                value={editFormData.courseId}
                onChange={(e) => setEditFormData({ ...editFormData, courseId: e.target.value })}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  placeholder="Nome da tag"
                  value={editTagInput.label}
                  onChange={(e) => setEditTagInput((prev) => ({ ...prev, label: e.target.value }))}
                  className="flex-1 min-w-[140px]"
                />
                <input
                  type="color"
                  value={editTagInput.color}
                  onChange={(e) => setEditTagInput((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-9 w-9 p-0 border rounded cursor-pointer bg-transparent"
                />
                <Button
                  type="button"
                  variant={canAddEditTag ? "default" : "outline"}
                  onClick={handleAddEditTag}
                  disabled={!canAddEditTag}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar tag
                </Button>
              </div>

              {editFormData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {editFormData.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border"
                      style={{
                        borderColor: tag.color,
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditTag(tag.id)}
                        className="text-[12px] leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria *</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) =>
                    setEditFormData({
                      ...editFormData,
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
                <Label htmlFor="edit-priority">Prioridade *</Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) =>
                    setEditFormData({
                      ...editFormData,
                      priority: value as ActivityPriority,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Data de entrega *</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={editFormData.dueDate}
                onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={handleDeleteActivityFromModal}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir atividade
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar alterações</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
