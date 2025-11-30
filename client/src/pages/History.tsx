import { useMemo, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useActivities } from '@/hooks/useActivities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const { activities, courses, loading } = useActivities();
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Atividades concluídas
  const completedActivities = useMemo(() => {
    return activities.filter((a) => a.status === 'concluida' && a.completedAt);
  }, [activities]);

  // Aplicar filtros + busca
  const filteredActivities = useMemo(() => {
    let filtered = [...completedActivities];

    // Filtro por período
    if (filterPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (filterPeriod === 'this-month') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (filterPeriod === 'this-year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else if (filterPeriod.startsWith('month-')) {
        const monthsAgo = parseInt(filterPeriod.split('-')[1] || '0');
        const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
        startDate = startOfMonth(targetDate);
        endDate = endOfMonth(targetDate);
      } else {
        startDate = new Date(0);
        endDate = new Date();
      }

      filtered = filtered.filter((a) => {
        if (!a.completedAt) return false;
        const completedDate = new Date(a.completedAt);
        return completedDate >= startDate && completedDate <= endDate;
      });
    }

    // Filtro por disciplina (usando courseName / courseId, já que agora é texto livre)
    if (filterCourse !== 'all') {
      filtered = filtered.filter((a) => {
        const disciplineName = a.courseName || a.courseId || '';
        return disciplineName === filterCourse;
      });
    }

    // Filtro por busca no título
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((a) => a.title.toLowerCase().includes(term));
    }

    // Ordenar por data de conclusão (mais recente primeiro)
    filtered.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    return filtered;
  }, [completedActivities, filterPeriod, filterCourse, searchTerm]);

  // Estatísticas
  const statistics = useMemo(() => {
    const total = filteredActivities.length;
    const byCategory: Record<string, number> = {};
    const byCourse: Record<string, number> = {};

    filteredActivities.forEach((activity) => {
      // Por categoria
      byCategory[activity.category] = (byCategory[activity.category] || 0) + 1;

      // Por disciplina (agora usando courseName / courseId em vez de courses[])
      const disciplineName =
        activity.courseName || activity.courseId || 'Sem disciplina';
      byCourse[disciplineName] = (byCourse[disciplineName] || 0) + 1;
    });

    return { total, byCategory, byCourse };
  }, [filteredActivities]);

  // Opções de disciplinas (a partir das atividades concluídas)
  const disciplineOptions = useMemo(() => {
    const names = new Set<string>();
    completedActivities.forEach((a) => {
      const name = a.courseName || a.courseId;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [completedActivities]);

  // Texto do resumo do período
  const getPeriodSummary = () => {
    if (filterPeriod === 'all') {
      return 'no total';
    } else if (filterPeriod === 'this-month') {
      return 'neste mês';
    } else if (filterPeriod === 'this-year') {
      return 'neste ano';
    } else if (filterPeriod.startsWith('month-')) {
      const monthsAgo = parseInt(filterPeriod.split('-')[1] || '0');
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - monthsAgo);
      return `em ${format(targetDate, 'MMMM/yyyy', { locale: ptBR })}`;
    }
    return '';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Filtros + busca */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex justify-start items-end md:flex-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2 w-full">
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


              {/* Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                    <SelectItem value="this-month">Este mês</SelectItem>
                    <SelectItem value="month-1">Mês passado</SelectItem>
                    <SelectItem value="month-2">Há 2 meses</SelectItem>
                    <SelectItem value="month-3">Há 3 meses</SelectItem>
                    <SelectItem value="this-year">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Disciplina */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplina</label>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {disciplineOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Concluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Você concluiu {statistics.total}{' '}
                {statistics.total === 1 ? 'atividade' : 'atividades'}{' '}
                {getPeriodSummary()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Object.keys(statistics.byCategory).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tipos de atividades diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disciplinas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Object.keys(statistics.byCourse).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Disciplinas com atividades concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Atividades por categoria */}
        {Object.keys(statistics.byCategory).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Atividades por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statistics.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="text-sm">
                      {category.charAt(0).toUpperCase() + category.slice(1)}: {count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de concluídas */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Concluídas ({filteredActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma atividade concluída encontrada para os filtros selecionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data de Entrega</TableHead>
                      <TableHead>Data de Conclusão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const disciplineName =
                        activity.courseName || activity.courseId || 'Sem disciplina';

                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {activity.title}
                          </TableCell>
                          <TableCell>{disciplineName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {activity.category.charAt(0).toUpperCase() +
                                activity.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(activity.dueDate),
                              'dd/MM/yyyy'
                            )}
                          </TableCell>
                          <TableCell>
                            {activity.completedAt
                              ? format(
                                  new Date(activity.completedAt),
                                  "dd/MM/yyyy '-' HH:mm"
                                )
                              : '-'}
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
    </MainLayout>
  );
}
