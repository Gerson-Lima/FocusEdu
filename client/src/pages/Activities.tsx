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
} from '@/lib/firebaseServices';
import { query, where, getDocs } from 'firebase/firestore';
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
} from "@/types/firebase";
import { format } from "date-fns";

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

// -------- helpers de data x status --------

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

  if (dueDate < today) {
    return "atrasada";
  }

  if (status === "atrasada" && dueDate >= today) {
    return "pendente";
  }

  return status;
}

export default function Activities() {
  const { currentUser } = useFirebaseAuth();
  const { activities, loading, refreshData } = useActivities();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    category: "atividade" as ActivityCategory,
    status: "nao_iniciada" as ActivityStatus,
    dueDate: "",
  });

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = activity.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || activity.status === filterStatus;
      const matchesCourse =
        filterCourse === "all" || activity.courseId === filterCourse;
      const matchesCategory =
        filterCategory === "all" || activity.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCourse && matchesCategory;
    });
  }, [activities, searchTerm, filterStatus, filterCourse, filterCategory]);

  const handleOpenDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        title: activity.title,
        description: activity.description,
        courseId: activity.courseName || activity.courseId || "",
        category: activity.category,
        status: activity.status,
        dueDate: format(new Date(activity.dueDate), "yyyy-MM-dd"),
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
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const dueTimestamp = new Date(formData.dueDate).getTime();
      const finalStatus = normalizeStatusByDueDate(
        formData.status,
        dueTimestamp
      );

      // validação rápida no cliente para evitar enviar documentos com campos vazios
      if (!formData.title || formData.title.trim() === '') {
        toast.error('Título é obrigatório');
        return;
      }

      if (!formData.dueDate) {
        toast.error('Data de entrega é obrigatória');
        return;
      }

      const activityData = {
        userId: currentUser.uid,
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        courseName: formData.courseId,
        category: formData.category,
        status: finalStatus,
        dueDate: dueTimestamp,
        completedAt: finalStatus === "concluida" ? Date.now() : undefined,
      };

      if (editingActivity) {
        await fbUpdateActivity(editingActivity.id, activityData);
        // sync kanban: map status -> column and update/create kanban item
        (async () => {
          try {
            const colsSnap = await getDocs(query(kanbanColumnsCollection, where('userId', '==', currentUser.uid)));
            let targetColumnId: string | undefined;
            colsSnap.forEach((d) => {
              const title = (d.data() as any).title?.toString?.() ?? '';
              const t = title.trim().toLowerCase();
              if ((t === 'por fazer' && finalStatus === 'nao_iniciada') ||
                  (t === 'pendente' && finalStatus === 'pendente') ||
                  (t === 'em andamento' && finalStatus === 'pendente') ||
                  (t === 'em atraso' && finalStatus === 'atrasada') ||
                  ((t === 'concluído' || t === 'concluido') && finalStatus === 'concluida')) {
                targetColumnId = d.id;
              }
            });
            if (!targetColumnId) return;

            const itemsSnap = await getDocs(query(kanbanItemsCollection, where('userId', '==', currentUser.uid), where('activityId', '==', editingActivity.id)));
            if (!itemsSnap.empty) {
              const docId = itemsSnap.docs[0].id;
              await fbUpdateKanbanItem(docId, { columnId: targetColumnId });
            } else {
              const columnItemsSnap = await getDocs(query(kanbanItemsCollection, where('userId', '==', currentUser.uid), where('columnId', '==', targetColumnId)));
              const order = columnItemsSnap.size;
              await fbCreateKanbanItem({ userId: currentUser.uid, columnId: targetColumnId, activityId: editingActivity.id, order });
            }
          } catch (err) {
            console.warn('syncKanban failed', err);
          }
        })();
        // Updates are saved in the same activity document (createActivity/updateActivity
        // already map title/description/dueDate to name/topics/date respectively).
        toast.success("Atividade atualizada com sucesso!");
      } else {
        const newId = await fbCreateActivity({
          ...activityData,
          createdAt: Date.now(),
        });
        (async () => {
          try {
            const colsSnap = await getDocs(query(kanbanColumnsCollection, where('userId', '==', currentUser.uid)));
            const firstCol = colsSnap.docs[0];
            if (firstCol) {
              const order = (await getDocs(query(kanbanItemsCollection, where('userId', '==', currentUser.uid), where('columnId', '==', firstCol.id)))).size;
              await fbCreateKanbanItem({ userId: currentUser.uid, columnId: firstCol.id, activityId: newId, order });
            }
          } catch (err) {
            console.warn('failed to sync kanban for new activity', err);
          }
        })();
        toast.success("Atividade criada com sucesso!");
      }

      refreshData();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Erro ao salvar atividade:", error);
      const errorMessage = error?.message || "Erro ao salvar atividade";
      
      // Show error message
      toast.error(errorMessage, { duration: 6000 });
      
      // If it's a permission error, show additional help
      if (errorMessage.includes('permissão') || errorMessage.includes('permission')) {
        toast.error("Configure as regras do Firestore. Veja FIRESTORE_SETUP.md", { duration: 8000 });
      }
      
      // If it's a network/blocking error, show additional help
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage.includes('conexão')) {
        toast.error("Verifique se há extensões bloqueando o Firebase ou problemas de conexão", { duration: 5000 });
      }
    }
  };

  const handleDelete = async (activityId: string) => {
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

  const handleStatusChange = async (
    activity: Activity,
    newStatus: ActivityStatus
  ) => {
    if (!currentUser) return;

    try {
      const finalStatus = normalizeStatusByDueDate(newStatus, activity.dueDate);

      const updates: Partial<Activity> = { status: finalStatus };
      if (finalStatus === "concluida") {
        updates.completedAt = Date.now();
      }

      await fbUpdateActivity(activity.id, updates);
      (async () => {
        try {
          const colsSnap = await getDocs(query(kanbanColumnsCollection, where('userId', '==', currentUser.uid)));
          let targetColumnId: string | undefined;
          colsSnap.forEach((d) => {
            const title = (d.data() as any).title?.toString?.() ?? '';
            const t = title.trim().toLowerCase();
            if ((t === 'por fazer' && finalStatus === 'nao_iniciada') ||
                (t === 'pendente' && finalStatus === 'pendente') ||
                (t === 'em andamento' && finalStatus === 'pendente') ||
                (t === 'em atraso' && finalStatus === 'atrasada') ||
                ((t === 'concluído' || t === 'concluido') && finalStatus === 'concluida')) {
              targetColumnId = d.id;
            }
          });
          if (!targetColumnId) return;
          const itemsSnap = await getDocs(query(kanbanItemsCollection, where('userId', '==', currentUser.uid), where('activityId', '==', activity.id)));
          if (!itemsSnap.empty) {
            const docId = itemsSnap.docs[0].id;
            await fbUpdateKanbanItem(docId, { columnId: targetColumnId });
          } else {
            const columnItemsSnap = await getDocs(query(kanbanItemsCollection, where('userId', '==', currentUser.uid), where('columnId', '==', targetColumnId)));
            const order = columnItemsSnap.size;
            await fbCreateKanbanItem({ userId: currentUser.uid, columnId: targetColumnId, activityId: activity.id, order });
          }
        } catch (err) {
          console.warn('failed to sync kanban on status change', err);
        }
      })();

      refreshData();
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filtros + botão Nova Atividade */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              {/* BLOCO DE FILTROS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                {/* Buscar */}
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

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
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

                {/* Disciplina */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select
                    value={filterCourse}
                    onValueChange={setFilterCourse}
                  >
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

                {/* Categoria */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* BOTÃO NOVA ATIVIDADE */}
              <div className="flex justify-end md:justify-start">
                <Button onClick={() => handleOpenDialog()}>
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
            <CardTitle>
              Lista de Atividades ({filteredActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando atividades...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma atividade encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Entrega</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const disciplineName =
                        activity.courseName ||
                        activity.courseId ||
                        "Sem disciplina";
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {activity.title}
                          </TableCell>
                          <TableCell>{disciplineName}</TableCell>
                          <TableCell>
                            {activity.category.charAt(0).toUpperCase() +
                              activity.category.slice(1)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={activity.status}
                              onValueChange={(value) =>
                                handleStatusChange(
                                  activity,
                                  value as ActivityStatus
                                )
                              }
                            >
                              <SelectTrigger className="w-2/4">
                                <Badge
                                  className={STATUS_COLORS[activity.status]}
                                >
                                  {STATUS_LABELS[activity.status]}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="concluida">
                                  Concluída
                                </SelectItem>
                                <SelectItem value="pendente">
                                  Pendente
                                </SelectItem>
                                <SelectItem value="atrasada">
                                  Atrasada
                                </SelectItem>
                                <SelectItem value="nao_iniciada">
                                  Não Iniciada
                                </SelectItem>
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
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(activity.id)}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da atividade
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Disciplina</Label>
                <Input
                  id="courseId"
                  placeholder="Digite o nome da disciplina (opcional)"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData({ ...formData, courseId: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as ActivityCategory,
                    })
                  }
                  required
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as ActivityStatus,
                    })
                  }
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

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingActivity ? "Salvar Alterações" : "Criar Atividade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
