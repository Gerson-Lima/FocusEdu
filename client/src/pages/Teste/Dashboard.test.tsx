import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// ✅ AJUSTE ESTE IMPORT CONFORME SEU CAMINHO REAL:
import Dashboard from "@/pages/Dashboard";

type Activity = {
  id: string;
  status: string;
  category?: string;
  courseId?: string;
  courseName?: string;
  completedAt?: number;
};

type Course = {
  id: string;
  name: string;
};

type UseActivitiesReturn = {
  loading: boolean;
  activities: Activity[];
  courses: Course[];
};

type UseActivitiesFn = () => UseActivitiesReturn;

// ---- Mocks ----
vi.mock("@/contexts/MockAuthContext", () => ({
  useFirebaseAuth: vi.fn(() => ({ userData: { name: "Teste" } })),
}));

const useActivitiesMock = vi.fn<UseActivitiesFn>();
vi.mock("@/hooks/useActivities", () => ({
  useActivities: () => useActivitiesMock(),
}));

vi.mock("@/components/MainLayout", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => (
    <section data-testid="card">{children}</section>
  ),
  CardHeader: ({ children }: { children?: React.ReactNode }) => (
    <header data-testid="card-header">{children}</header>
  ),
  CardTitle: ({ children }: { children?: React.ReactNode }) => <h3>{children}</h3>,
  CardContent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowUp: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="icon-arrow-up" {...props} />
  ),
  ArrowDown: (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="icon-arrow-down" {...props} />
  ),
}));

// Mock Recharts: expõe o data via <pre> para inspeção
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="rc">{children}</div>
  ),

  LineChart: ({
    data,
    children,
  }: {
    data?: unknown;
    children?: React.ReactNode;
  }) => (
    <div data-testid="linechart">
      <pre data-testid="linechart-data">{JSON.stringify(data ?? null)}</pre>
      {children}
    </div>
  ),

  BarChart: ({
    data,
    layout,
    children,
  }: {
    data?: unknown;
    layout?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid={`barchart-${layout || "horizontal"}`}>
      <pre data-testid={`barchart-data-${layout || "horizontal"}`}>
        {JSON.stringify(data ?? null)}
      </pre>
      {children}
    </div>
  ),

  PieChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="piechart">{children}</div>
  ),

  // ✅ CORRIGIDO: executa label() para cobrir a linha do Dashboard
  Pie: ({
    data,
    children,
    label,
  }: {
    data?: Array<{ name?: string; value?: number }>;
    children?: React.ReactNode;
    label?: ((args: { name?: string; percent?: number }) => React.ReactNode) | boolean;
  }) => {
    const arr = Array.isArray(data) ? data : [];
    const total = arr.reduce((sum, it) => sum + (it.value ?? 0), 0) || 1;

    return (
      <div data-testid="pie">
        {typeof label === "function" && arr.length > 0 && (
          <div data-testid="pie-labels">
            {arr.map((it, idx) => (
              <span key={idx} data-testid={`pie-label-${idx}`}>
                {label({
                  name: it.name,
                  percent: (it.value ?? 0) / total,
                })}
              </span>
            ))}
          </div>
        )}

        <pre data-testid="pie-data">{JSON.stringify(data ?? null)}</pre>
        {children}
      </div>
    );
  },

  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Line: () => null,
  Bar: () => null,
}));

beforeEach(() => {
  vi.useRealTimers();
  useActivitiesMock.mockReset();
});

function getCardByTitle(titleText: string): HTMLElement {
  const titleEl = screen.getByText(titleText);
  const card = titleEl.closest('[data-testid="card"]');
  if (!card) throw new Error(`Card não encontrado para o título: ${titleText}`);
  return card as HTMLElement;
}

describe("Dashboard", () => {
  it("DASH-001: deve exibir loading quando loading=true", () => {
    useActivitiesMock.mockReturnValue({
      loading: true,
      activities: [],
      courses: [],
    });

    render(<Dashboard />);
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("DASH-002/DASH-003: deve renderizar métricas zeradas sem NaN/Infinity quando activities=[]", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [],
      courses: [],
    });

    render(<Dashboard />);

    const cardConcluidos = getCardByTitle("Concluídos");
    expect(within(cardConcluidos).getByText("0")).toBeInTheDocument();
    expect(within(cardConcluidos).getByText(/0% do total/i)).toBeInTheDocument();

    const cardPendentes = getCardByTitle("Pendentes");
    expect(within(cardPendentes).getByText("0")).toBeInTheDocument();
    expect(within(cardPendentes).getByText(/0% do total/i)).toBeInTheDocument();

    const cardAtrasados = getCardByTitle("Atrasados");
    expect(within(cardAtrasados).getByText("0")).toBeInTheDocument();
    expect(within(cardAtrasados).getByText(/0% do total/i)).toBeInTheDocument();

    const cardTaxa = getCardByTitle("Taxa de Conclusão");
    expect(within(cardTaxa).getByText("0%")).toBeInTheDocument();
    expect(within(cardTaxa).getByText(/0 de 0 atividades/i)).toBeInTheDocument();
  });

  it("DASH-004: deve calcular métricas corretamente (4/3/3 => taxa 40%)", () => {
    const now = Date.now();
    const activities: Activity[] = [
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `c${i}`,
        status: "concluida",
        category: "estudo",
        courseId: "1",
        completedAt: now,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `p${i}`,
        status: "pendente",
        category: "trabalho",
        courseId: "1",
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `a${i}`,
        status: "atrasada",
        category: "estudo",
        courseId: "2",
      })),
    ];

    useActivitiesMock.mockReturnValue({
      loading: false,
      activities,
      courses: [
        { id: "1", name: "Matemática" },
        { id: "2", name: "História" },
      ],
    });

    render(<Dashboard />);

    expect(within(getCardByTitle("Concluídos")).getByText("4")).toBeInTheDocument();
    expect(within(getCardByTitle("Pendentes")).getByText("3")).toBeInTheDocument();
    expect(within(getCardByTitle("Atrasados")).getByText("3")).toBeInTheDocument();

    const cardTaxa = getCardByTitle("Taxa de Conclusão");
    expect(within(cardTaxa).getByText("40%")).toBeInTheDocument();
    expect(within(cardTaxa).getByText(/4 de 10 atividades/i)).toBeInTheDocument();
    expect(within(getCardByTitle("Concluídos")).getByText(/40% do total/i)).toBeInTheDocument();
  });

  it("DASH-006: deve mostrar ícone no card Atrasados quando overdue>0", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [{ id: "1", status: "atrasada", category: "estudo", courseId: "1" }],
      courses: [{ id: "1", name: "Matemática" }],
    });

    render(<Dashboard />);
    expect(within(getCardByTitle("Atrasados")).getByTestId("icon-arrow-up")).toBeInTheDocument();
  });

  it("DASH-007: não deve mostrar ícone no card Atrasados quando overdue=0", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [{ id: "1", status: "pendente", category: "estudo", courseId: "1" }],
      courses: [{ id: "1", name: "Matemática" }],
    });

    render(<Dashboard />);
    expect(within(getCardByTitle("Atrasados")).queryByTestId("icon-arrow-up")).not.toBeInTheDocument();
  });

  it("DASH-008: deve exibir fallback 'Nenhum dado disponível' no card Atividades Gerais quando statusData=[]", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [],
      courses: [],
    });

    render(<Dashboard />);
    expect(within(getCardByTitle("Atividades Gerais")).getByText("Nenhum dado disponível")).toBeInTheDocument();
  });

  it("DASH-011: deve agregar categorias e capitalizar (estudo->Estudo)", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [
        { id: "1", status: "pendente", category: "estudo", courseId: "1" },
        { id: "2", status: "concluida", category: "trabalho", courseId: "1", completedAt: Date.now() },
        { id: "3", status: "atrasada", category: "estudo", courseId: "1" },
      ],
      courses: [{ id: "1", name: "Matemática" }],
    });

    render(<Dashboard />);

    const raw = screen.getByTestId("barchart-data-horizontal").textContent ?? "[]";
    const data = JSON.parse(raw) as Array<{ category: string; count: number }>;

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Estudo", count: 2 }),
        expect.objectContaining({ category: "Trabalho", count: 1 }),
      ])
    );
  });

  it("DASH-016: deve ordenar disciplina desc e limitar top 5", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [
        { id: "m1", status: "pendente", category: "x", courseId: "1" },
        { id: "m2", status: "pendente", category: "x", courseId: "1" },
        { id: "m3", status: "pendente", category: "x", courseId: "1" },

        { id: "h1", status: "pendente", category: "x", courseId: "2" },
        { id: "h2", status: "pendente", category: "x", courseId: "2" },

        { id: "b1", status: "pendente", category: "x", courseId: "999", courseName: "Biologia" },
        { id: "s1", status: "pendente", category: "x" },

        { id: "g1", status: "pendente", category: "x", courseId: "3" },
        { id: "f1", status: "pendente", category: "x", courseId: "4" },
        { id: "q1", status: "pendente", category: "x", courseId: "5" },
      ],
      courses: [
        { id: "1", name: "Matemática" },
        { id: "2", name: "História" },
        { id: "3", name: "Geografia" },
        { id: "4", name: "Física" },
        { id: "5", name: "Química" },
      ],
    });

    render(<Dashboard />);

    const raw = screen.getByTestId("barchart-data-vertical").textContent ?? "[]";
    const data = JSON.parse(raw) as Array<{ course: string; count: number }>;

    expect(data).toHaveLength(5);
    expect(data[0]).toEqual(expect.objectContaining({ course: "Matemática", count: 3 }));
    expect(data[1]).toEqual(expect.objectContaining({ course: "História", count: 2 }));

    const coursesInData = data.map((d) => d.course);
    expect(coursesInData).toEqual(expect.arrayContaining(["Biologia", "Sem disciplina"]));
  });

  it("DASH-021: deve executar o label do gráfico de pizza (cobre a linha do callback label)", () => {
    useActivitiesMock.mockReturnValue({
      loading: false,
      activities: [
        {
          id: "1",
          status: "concluida",
          category: "x",
          courseId: "1",
          completedAt: Date.now(),
        },
        { id: "2", status: "pendente", category: "x", courseId: "1" },
      ],
      courses: [{ id: "1", name: "Matemática" }],
    });

    render(<Dashboard />);

    const card = getCardByTitle("Atividades Gerais");

    // ✅ Agora o mock renderiza os labels (garante execução do callback label)
    const labels = within(card).getByTestId("pie-labels");
    expect(labels).toHaveTextContent("Concluídas: 50%");
    expect(labels).toHaveTextContent("Pendentes: 50%");
  });

  it("DASH-022: deve exibir fallback do progresso mensal quando monthlyData estiver vazio (cobre a linha 212)", async () => {
    vi.resetModules();

    let useMemoCall = 0;

    vi.doMock("react", async () => {
        const actual = await vi.importActual<typeof import("react")>("react");
        const originalUseMemo = actual.useMemo;

        return {
        ...actual,
        useMemo: ((factory: any, deps?: any) => {
            useMemoCall += 1;

            // Ordem de useMemo no Dashboard:
            // 1) metrics
            // 2) monthlyData  <-- forçamos vazio para cair no fallback (linha 212)
            if (useMemoCall === 2) return [];

            return originalUseMemo(factory, deps);
        }) as typeof actual.useMemo,
        };
    });

    // Reimporta o Dashboard já com o mock de react aplicado
    const { default: DashboardIsolated } = await import("@/pages/Dashboard");

    useActivitiesMock.mockReturnValue({
        loading: false,
        activities: [
        {
            id: "1",
            status: "concluida",
            category: "x",
            courseId: "1",
            completedAt: Date.now(),
        },
        ],
        courses: [{ id: "1", name: "Matemática" }],
    });

    render(<DashboardIsolated />);

    const card = getCardByTitle("Progresso de Atividades Concluídas");
    expect(within(card).getByText("Nenhum dado disponível")).toBeInTheDocument();

    // Limpa o mock do react para não “vazar” para outros testes
    vi.doUnmock("react");
    });


});
