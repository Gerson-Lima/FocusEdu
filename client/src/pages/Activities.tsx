import { useState, useMemo } from "react";
import MainLayout from "@/components/MainLayout";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { useActivities } from "@/hooks/useActivities";

import {
  createActivity as fbCreateActivity,
  updateActivity as fbUpdateActivity,
  deleteActivity as fbDeleteActivity,
  createKanbanItem as fbCreateKanbanItem,
  updateKanbanItem as fbUpdateKanbanItem,
  kanbanColumnsCollection,
  kanbanItemsCollection,
} from "@/lib/firebaseServices";

import { query, where, getDocs } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import type {
  Activity,
  ActivityStatus,
  ActivityCategory,
  ActivityPriority,
  ActivityTag,
} from "@/types/firebase";

import { format } from "date-fns";

/* --------------------------------------------------------------------- */
/* CONSTS                                                                */
/* --------------------------------------------------------------------- */

const STATUS_LABELS: Record<ActivityStatus, string> = {
  concluida: "Concluída",
  pendente: "Pendente",
  atrasada: "Atrasada",
  nao_iniciada: "Não Iniciada",
};

const STATUS_COLORS: Record<ActivityStatus, string> = {
  concluida: "bg-green-100 text-green-800",
  pendente: "bg-yellow-100 text-yellow-800",
  atrasada: "bg-red-100 text-red-800",
  nao_iniciada: "bg-gray-100 text-gray-800",
};

const CATEGORIES: ActivityCategory[] = [
  "atividade",
  "prova",
  "tarefa",
  "mentoria",
  "leitura",
  "revisao",
  "projeto",
  "seminario",
  "orientacao",
];

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  atividade: "Atividade",
  prova: "Prova",
  tarefa: "Tarefa",
  mentoria: "Mentoria",
  leitura: "Leitura",
  revisao: "Revisão",
  projeto: "Projeto",
  seminario: "Seminário",
  orientacao: "Orientação",
};

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

/* --------------------------------------------------------------------- */
/* HELPERS                                                               */
/* --------------------------------------------------------------------- */

function getTodayMidnight(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function normalizeStatusByDueDate(
  status: ActivityStatus,
  dueDate: number
): ActivityStatus {
  if (status === "concluida") return "concluida";

  const today = getTodayMidnight();

  if (dueDate < today) return "atrasada";
  if (status === "atrasada" && dueDate >= today) return "pendente";

  return status;
}

// evita shift de timezone no input date (salva no meio-dia)
function buildLocalDateTimestamp(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

/**
 * Sincroniza o Kanban com o status atual:
 * - encontra a coluna alvo baseada no status
 * - se existir item para a activity, move
 * - se não existir, cria no final da coluna
 */
async function syncKanbanWithStatus(
  userId: string,
  activityId: string,
  status: ActivityStatus
) {
  try {
    const colsSnap = await getDocs(
      query(kanbanColumnsCollection, where("userId", "==", userId))
    );

    let targetColumnId: string | undefined;

    colsSnap.forEach((d) => {
      const title = (d.data() as any).title?.toString?.() ?? "";
      const t = title.trim().toLowerCase();

      const isPorFazer = t === "por fazer" && status === "nao_iniciada";
      const isEmAndamento =
        (t === "em andamento" || t === "pendente") && status === "pendente";
      const isEmAtraso =
        (t === "em atraso" || t === "atraso" || t === "atrasada") &&
        status === "atrasada";
      const isConcluido =
        (t === "concluído" || t === "concluido") && status === "concluida";

      if (isPorFazer || isEmAndamento || isEmAtraso || isConcluido) {
        targetColumnId = d.id;
      }
    });

    if (!targetColumnId) return;

    const itemsSnap = await getDocs(
      query(
        kanbanItemsCollection,
        where("userId", "==", userId),
        where("activityId", "==", activityId)
      )
    );

    if (!itemsSnap.empty) {
      const docId = itemsSnap.docs[0].id;
      await fbUpdateKanbanItem(docId, { columnId: targetColumnId });
      return;
    }

    const columnItemsSnap = await getDocs(
      query(
        kanbanItemsCollection,
        where("userId", "==", userId),
        where("columnId", "==", targetColumnId)
      )
    );

    const order = columnItemsSnap.size;

    await fbCreateKanbanItem({
      userId,
      columnId: targetColumnId,
      activityId,
      order,
    });
  } catch (err) {
    console.warn("syncKanbanWithStatus failed", err);
  }
}

/* --------------------------------------------------------------------- */
/* PAGE                                                                  */
/* --------------------------------------------------------------------- */

export default function Activities() {
  const { currentUser } = useFirebaseAuth();
  const { activities, loading, refreshData } = useActivities();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    category: "atividade" as ActivityCategory,
    status: "nao_iniciada" as ActivityStatus,
    dueDate: "",
    priority: "media" as ActivityPriority,
    tags: [] as ActivityTag[],
  });

  const [tagInput, setTagInput] = useState({
    label: "",
    color: "#3b82f6",
  });

  const disciplineTemplates = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      const name = a.courseName || a.courseId;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = activity.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || activity.status === filterStatus;
      const matchesCourse = filterCourse === "all" || activity.courseId === filterCourse;
      const matchesCategory = filterCategory === "all" || activity.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCourse && matchesCategory;
    });
  }, [activities, searchTerm, filterStatus, filterCourse, filterCategory]);

  const handleOpenDialog = (activity?: Activity) => {
    if (isSaving) return;

    if (activity) {
      setEditingActivity(activity);
      setFormData({
        title: activity.title,
        description: activity.description,
        courseId: activity.courseName || activity.courseId || "",
        category: activity.category,
        status: activity.status,
        dueDate: format(new Date(activity.dueDate), "yyyy-MM-dd"),
        priority: (activity.priority ?? "media") as ActivityPriority,
        tags: (activity.tags ?? []) as ActivityTag[],
      });
    } else {
      setEditingActivity(null);
      setFormData({
        title: "",
        description: "",
        courseId: "",
        category: "atividade",
        status: "nao_iniciada",
        dueDate: "",
        priority: "media",
        tags: [],
      });
    }

    setTagInput({ label: "", color: "#3b82f6" });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSaving) return;
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleAddTag = () => {
    if (isSaving) return;

    const label = tagInput.label.trim();
    if (!label) return;

    const newTag: ActivityTag = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      label,
      color: tagInput.color || "#3b82f6",
    };

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
    setTagInput((prev) => ({ ...prev, label: "" }));
  };

  const handleRemoveTag = (id: string) => {
    if (isSaving) return;
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t.id !== id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      // validação mínima
      if (!formData.title || !formData.title.trim()) {
        toast.error("Título é obrigatório");
        return;
      }
      if (!formData.dueDate) {
        toast.error("Data de entrega é obrigatória");
        return;
      }

      const dueTimestamp = buildLocalDateTimestamp(formData.dueDate);
      const finalStatus = normalizeStatusByDueDate(formData.status, dueTimestamp);

      const courseId = formData.courseId.trim();
      const courseName = courseId || "";

      const activityData: any = {
        userId: currentUser.uid,
        title: formData.title,
        description: formData.description,
        courseId,
        courseName,
        category: formData.category,
        status: finalStatus,
        dueDate: dueTimestamp,
        completedAt: finalStatus === "concluida" ? Date.now() : undefined,
        priority: formData.priority,
        tags: formData.tags,
      };

      if (editingActivity) {
        await fbUpdateActivity(editingActivity.id, activityData);
        await syncKanbanWithStatus(currentUser.uid, editingActivity.id, finalStatus);
        toast.success("Atividade atualizada com sucesso!");
      } else {
        const newId = await fbCreateActivity({
          ...activityData,
          createdAt: Date.now(),
        });
        await syncKanbanWithStatus(currentUser.uid, newId, finalStatus);
        toast.success("Atividade criada com sucesso!");
      }

      refreshData();
      setIsDialogOpen(false);
      setEditingActivity(null);
    } catch (error: any) {
      console.error("Erro ao salvar atividade:", error);
      const errorMessage = error?.message || "Erro ao salvar atividade";
      toast.error(errorMessage, { duration: 6000 });
      if (errorMessage.includes("permissão") || errorMessage.includes("permission")) {
        toast.error("Configure as regras do Firestore. Veja FIRESTORE_SETUP.md", {
          duration: 8000,
        });
      }
      if (errorMessage.includes("ERR_BLOCKED_BY_CLIENT") || errorMessage.includes("conexão")) {
        toast.error("Verifique se há extensões bloqueando o Firebase ou problemas de conexão", {
          duration: 5000,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (isSaving) return;
    if (!confirm("Tem certeza que deseja excluir esta atividade?")) return;

    try {
      await fbDeleteActivity(activityId);
      refreshData();
      toast.success("Atividade excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir atividade:", error);
      toast.error("Erro ao excluir atividade");
    }
  };

  const handleStatusChange = async (activity: Activity, newStatus: ActivityStatus) => {
    if (!currentUser) return;
    if (isSaving) return;

    try {
      const finalStatus = normalizeStatusByDueDate(newStatus, activity.dueDate);

      const updates: Partial<Activity> = {
        status: finalStatus,
        completedAt: finalStatus === "concluida" ? Date.now() : undefined,
      };

      await fbUpdateActivity(activity.id, updates);
      await syncKanbanWithStatus(currentUser.uid, activity.id, finalStatus);

      refreshData();
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handlePriorityChange = async (activity: Activity, newPriority: ActivityPriority) => {
    if (!currentUser) return;
    if (isSaving) return;

    try {
      await fbUpdateActivity(activity.id, { priority: newPriority });
      refreshData();
      toast.success("Prioridade atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
      toast.error("Erro ao atualizar prioridade");
    }
  };

  const canAddTag = !!tagInput.label.trim();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filtros + botão Nova Atividade */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar atividades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="atrasada">Atrasada</SelectItem>
                      <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={filterCourse} onValueChange={setFilterCourse}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as disciplinas</SelectItem>
                      {Array.from(
                        new Set(
                          activities
                            .map((a) => a.courseName || a.courseId)
                            .filter((v): v is string => !!v)
                        )
                      ).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end md:justify-start">
                <Button onClick={() => handleOpenDialog()} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atividade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Atividades ({filteredActivities.length})</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando atividades...</div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma atividade encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Título</TableHead>
                      <TableHead className="w-[220px]">Disciplina</TableHead>
                      <TableHead className="w-[120px]">Categoria</TableHead>
                      <TableHead className="w-[120px]">Tags</TableHead>
                      <TableHead className="w-[140px]">Prioridade</TableHead>
                      <TableHead className="w-[160px]">Status</TableHead>
                      <TableHead className="w-[140px]">Data de Entrega</TableHead>
                      <TableHead className="w-[100px]">
                        <div className="flex justify-center pr-2">Ações</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const disciplineName =
                        activity.courseName || activity.courseId || "Sem disciplina";
                      const priority = (activity.priority ?? "media") as ActivityPriority;
                      const tags = (activity.tags ?? []) as ActivityTag[];

                      return (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="font-medium max-w-[220px] truncate">
                              {activity.title}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[220px] truncate">{disciplineName}</div>
                          </TableCell>

                          <TableCell className="w-[140px]">
                            <div className="truncate">
                              {CATEGORY_LABELS[activity.category]}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-block px-2 py-0.5 rounded-full text-[12px] font-medium border truncate max-w-[160px]"
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
                              {tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{tags.length - 2}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={priority}
                              onValueChange={(value) =>
                                handlePriorityChange(activity, value as ActivityPriority)
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger className="w-28">
                                <Badge className={PRIORITY_COLORS[priority]}>
                                  {PRIORITY_LABELS[priority]}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="media">Média</SelectItem>
                                <SelectItem value="baixa">Baixa</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <Select
                              value={activity.status}
                              onValueChange={(value) =>
                                handleStatusChange(activity, value as ActivityStatus)
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger className="min-w-[160px]">
                                <Badge className={STATUS_COLORS[activity.status]}>
                                  {STATUS_LABELS[activity.status]}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="concluida">Concluída</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="atrasada">Atrasada</SelectItem>
                                <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            {format(new Date(activity.dueDate), "dd/MM/yyyy")}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(activity)}
                                disabled={isSaving}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(activity.id)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog criar/editar */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (isSaving) return; // não deixa fechar por overlay/ESC enquanto salva
          setIsDialogOpen(open);
          if (!open) setEditingActivity(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
            <DialogDescription>Preencha os dados da atividade</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseId">Disciplina</Label>
              <Input
                id="courseId"
                placeholder="Digite o nome da disciplina (opcional)"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                disabled={isSaving}
              />

              {disciplineTemplates.length > 0 && (
                <div className="mt-1 space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    Sugestões de disciplinas já usadas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {disciplineTemplates
                      .filter((name) =>
                        formData.courseId
                          ? name.toLowerCase().includes(formData.courseId.toLowerCase())
                          : true
                      )
                      .slice(0, 8)
                      .map((name) => (
                        <button
                          key={name}
                          type="button"
                          disabled={isSaving}
                          onClick={() => setFormData({ ...formData, courseId: name })}
                          className="px-2 py-1 text-xs rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>

              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  placeholder="Nome da tag"
                  value={tagInput.label}
                  onChange={(e) =>
                    setTagInput((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className="flex-1 min-w-[140px]"
                  disabled={isSaving}
                />
                <input
                  type="color"
                  value={tagInput.color}
                  onChange={(e) =>
                    setTagInput((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-9 w-9 p-0 border rounded cursor-pointer bg-transparent disabled:opacity-50"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  variant={canAddTag ? "default" : "outline"}
                  onClick={handleAddTag}
                  disabled={!canAddTag || isSaving}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.tags.map((tag) => (
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
                        onClick={() => handleRemoveTag(tag.id)}
                        className="text-[12px] leading-none disabled:opacity-50"
                        disabled={isSaving}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as ActivityCategory })
                  }
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ActivityStatus })
                  }
                  disabled={isSaving}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasada">Atrasada</SelectItem>
                    <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as ActivityPriority })
                  }
                  disabled={isSaving}
                  required
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

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? editingActivity
                    ? "SALVANDO..."
                    : "CRIANDO..."
                  : editingActivity
                  ? "Salvar Alterações"
                  : "Criar Atividade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
