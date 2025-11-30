import { useMemo } from "react";
import MainLayout from "@/components/MainLayout";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { useActivities } from "@/hooks/useActivities";
import { SeedDataButton } from "@/components/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = {
  concluida: "#10b981",
  pendente: "#f59e0b",
  atrasada: "#ef4444",
  nao_iniciada: "#6b7280",
};

export default function Dashboard() {
  const { userData } = useFirebaseAuth();
  const { activities, courses, loading } = useActivities();

  // Métricas principais
  const metrics = useMemo(() => {
    const completed = activities.filter((a) => a.status === "concluida").length;
    const pending = activities.filter((a) => a.status === "pendente").length;
    const overdue = activities.filter((a) => a.status === "atrasada").length;
    const total = activities.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, pending, overdue, completionRate, total };
  }, [activities]);

  // Progresso mensal (últimos 6 meses)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));

      const completedInMonth = activities.filter((a) => {
        if (!a.completedAt) return false;
        return (
          a.completedAt >= monthStart.getTime() &&
          a.completedAt < monthEnd.getTime()
        );
      }).length;

      months.push({
        month: format(monthStart, "MMM", { locale: ptBR }),
        completed: completedInMonth,
      });
    }
    return months;
  }, [activities]);

  // Atividades por status (pizza)
  const statusData = useMemo(() => {
    return [
      { name: "Concluídas", value: metrics.completed, color: COLORS.concluida },
      { name: "Pendentes", value: metrics.pending, color: COLORS.pendente },
      { name: "Atrasadas", value: metrics.overdue, color: COLORS.atrasada },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Atividades por categoria (barras)
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    activities.forEach((a) => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));
  }, [activities]);

  // Atividades por disciplina
  const courseData = useMemo(() => {
    const courseCounts: Record<string, number> = {};
    activities.forEach((a) => {
      const course = courses.find((c) => c.id === a.courseId);
      const courseName = course?.name || a.courseName || "Sem disciplina";
      courseCounts[courseName] = (courseCounts[courseName] || 0) + 1;
    });

    return Object.entries(courseCounts)
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activities, courses]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* ocupamos "quase" a tela toda, tirando header/toolbar do layout */}
      <div className="flex flex-col gap-4 lg:gap-5 lg:h-[calc(100vh-120px)] ">
        {/* TOPO: boas-vindas + métricas compactas */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {/* Card de boas-vindas - menor */}
          

          {/* Cards de métricas - mais baixos e lado a lado */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="h-full">
              <CardHeader className="pb-1 pt-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Concluídos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">{metrics.completed}</div>
                <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  {metrics.total > 0
                    ? Math.round((metrics.completed / metrics.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="pb-1 pt-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">{metrics.pending}</div>
                <p className="text-[11px] text-yellow-600 mt-1">
                  {metrics.total > 0
                    ? Math.round((metrics.pending / metrics.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="pb-1 pt-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Atrasados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">{metrics.overdue}</div>
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  {metrics.overdue > 0 && (
                    <ArrowUp className="h-3 w-3" />
                  )}
                  {metrics.total > 0
                    ? Math.round((metrics.overdue / metrics.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="pb-1 pt-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-2xl font-bold">
                  {metrics.completionRate}%
                </div>
                <p className="text-[11px] text-blue-600 mt-1">
                  {metrics.completed} de {metrics.total} atividades
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BAIXO: grade de gráficos ocupando o resto da tela */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Progresso mensal */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Progresso de Atividades Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0">
              {monthlyData.length > 0 ? (
                <div className="h-full min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Concluídas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades por categoria */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Atividades por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0">
              {categoryData.length > 0 ? (
                <div className="h-full min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades gerais (pizza) */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Atividades Gerais</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0">
              {statusData.length > 0 ? (
                <div className="h-full min-h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Produtividade por disciplina */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Produtividade por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0">
              {courseData.length > 0 ? (
                <div className="h-full min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={courseData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="course" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#10b981" name="Atividades" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
