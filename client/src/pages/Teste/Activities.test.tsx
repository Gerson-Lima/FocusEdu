/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";

// ✅ AJUSTE PARA O CAMINHO REAL DO COMPONENTE:
import Activities from "../Activities";

/* ------------------------------------------------------------------ */
/* HOISTED STATES (evita TDZ com vi.mock)                               */
/* ------------------------------------------------------------------ */

const authState = vi.hoisted(() => ({
  currentUser: { uid: "user-1" } as null | { uid: string },
}));

const activitiesState = vi.hoisted(() => ({
  activities: [] as any[],
  loading: false,
  refreshData: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const firebaseState = vi.hoisted(() => ({
  fbCreateActivity: vi.fn(),
  fbUpdateActivity: vi.fn(),
  fbDeleteActivity: vi.fn(),
  fbCreateKanbanItem: vi.fn(),
  fbUpdateKanbanItem: vi.fn(),
  kanbanColumnsCollection: { __type: "kanbanCols" },
  kanbanItemsCollection: { __type: "kanbanItems" },
}));

const firestoreState = vi.hoisted(() => ({
  getDocs: vi.fn(),
  query: vi.fn((...args: any[]) => ({ __q: args })),
  where: vi.fn((...args: any[]) => ({ __w: args })),
}));

/* ------------------------------------------------------------------ */
/* MODULE MOCKS                                                        */
/* ------------------------------------------------------------------ */

vi.mock("@/contexts/MockAuthContext", () => ({
  useFirebaseAuth: () => ({ currentUser: authState.currentUser }),
}));

vi.mock("@/hooks/useActivities", () => ({
  useActivities: () => ({
    activities: activitiesState.activities,
    loading: activitiesState.loading,
    refreshData: activitiesState.refreshData,
  }),
}));

vi.mock("@/components/MainLayout", () => ({
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

vi.mock("sonner", () => ({ toast: toastState.toast }));

vi.mock("lucide-react", () => ({
  Plus: () => null,
  Pencil: () => null,
  Trash2: () => null,
  Search: () => null,
}));

/* ------------------------------------------------------------------ */
/* SHADCN UI MOCKS (DOM simples, testável)                              */
/* ------------------------------------------------------------------ */

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <section>{children}</section>,
  CardHeader: ({ children }: any) => <header>{children}</header>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}));

/**
 * Select simplificado:
 * - Select => <select>, SelectItem => <option>
 */
vi.mock("@/components/ui/select", () => {
  const Select = ({ value, onValueChange, children, ...rest }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)} {...rest}>
      {children}
    </select>
  );
  const SelectContent = ({ children }: any) => <>{children}</>;
  const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
  const SelectTrigger = () => null;
  const SelectValue = () => null;
  return { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
});

vi.mock("@/components/ui/dialog", () => {
  const Dialog = ({ open, children }: any) => (open ? <div>{children}</div> : null);
  const DialogContent = ({ children }: any) => <div>{children}</div>;
  const DialogHeader = ({ children }: any) => <div>{children}</div>;
  const DialogTitle = ({ children }: any) => <h3>{children}</h3>;
  const DialogDescription = ({ children }: any) => <p>{children}</p>;
  const DialogFooter = ({ children }: any) => <div>{children}</div>;
  return { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
});

vi.mock("@/components/ui/alert-dialog", () => {
  const AlertDialog = ({ open, children }: any) => (open ? <div>{children}</div> : null);
  const AlertDialogContent = ({ children }: any) => <div>{children}</div>;
  const AlertDialogHeader = ({ children }: any) => <div>{children}</div>;
  const AlertDialogTitle = ({ children }: any) => <h3>{children}</h3>;
  const AlertDialogDescription = ({ children }: any) => <p>{children}</p>;
  const AlertDialogFooter = ({ children }: any) => <div>{children}</div>;
  const AlertDialogCancel = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  const AlertDialogAction = ({ children, ...props }: any) => <button {...props}>{children}</button>;
  return {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
  };
});

/* ------------------------------------------------------------------ */
/* FIREBASE SERVICES + FIRESTORE MOCKS                                  */
/* ------------------------------------------------------------------ */

vi.mock("@/lib/firebaseServices", () => ({
  createActivity: (...args: any[]) => firebaseState.fbCreateActivity(...args),
  updateActivity: (...args: any[]) => firebaseState.fbUpdateActivity(...args),
  deleteActivity: (...args: any[]) => firebaseState.fbDeleteActivity(...args),
  createKanbanItem: (...args: any[]) => firebaseState.fbCreateKanbanItem(...args),
  updateKanbanItem: (...args: any[]) => firebaseState.fbUpdateKanbanItem(...args),
  kanbanColumnsCollection: firebaseState.kanbanColumnsCollection,
  kanbanItemsCollection: firebaseState.kanbanItemsCollection,
}));

vi.mock("firebase/firestore", () => ({
  getDocs: (...args: any[]) => firestoreState.getDocs(...args),
  query: (...args: any[]) => firestoreState.query(...args),
  where: (...args: any[]) => firestoreState.where(...args),
}));

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function makeSnap({
  docs = [],
  empty = docs.length === 0,
  size = docs.length,
}: {
  docs?: any[];
  empty?: boolean;
  size?: number;
}) {
  return {
    docs,
    empty,
    size,
    forEach: (cb: (d: any) => void) => docs.forEach(cb),
  };
}

function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function openCreateDialog() {
  fireEvent.click(screen.getByRole("button", { name: /Nova Atividade/i }));
  expect(screen.getByRole("heading", { name: /^Nova Atividade$/i })).toBeInTheDocument();
}

function submitForm() {
  const form = screen.getByLabelText(/Título/i).closest("form");
  if (!form) throw new Error("Form não encontrado no Dialog");
  fireEvent.submit(form);
}

/* ------------------------------------------------------------------ */
/* RESET STATE                                                         */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  authState.currentUser = { uid: "user-1" };

  activitiesState.activities = [];
  activitiesState.loading = false;
  activitiesState.refreshData.mockClear();

  toastState.toast.success.mockClear();
  toastState.toast.error.mockClear();

  firebaseState.fbCreateActivity.mockReset();
  firebaseState.fbUpdateActivity.mockReset();
  firebaseState.fbDeleteActivity.mockReset();
  firebaseState.fbCreateKanbanItem.mockReset();
  firebaseState.fbUpdateKanbanItem.mockReset();

  firestoreState.getDocs.mockReset();
  firestoreState.query.mockClear();
  firestoreState.where.mockClear();

  firestoreState.getDocs.mockResolvedValue(makeSnap({ docs: [], empty: true, size: 0 }));
});

/* ------------------------------------------------------------------ */
/* TESTS                                                               */
/* ------------------------------------------------------------------ */

describe("Activities - base", () => {
  it("mostra estado de carregamento", () => {
    activitiesState.loading = true;
    render(<Activities />);
    expect(screen.getByText(/Carregando atividades/i)).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há atividades", () => {
    activitiesState.loading = false;
    activitiesState.activities = [];
    render(<Activities />);
    expect(screen.getByText(/Nenhuma atividade encontrada/i)).toBeInTheDocument();
  });

  it("filtra por busca (searchTerm)", () => {
    activitiesState.activities = [
      {
        id: "a1",
        userId: "user-1",
        title: "Prova de Biologia",
        description: "",
        courseId: "Biologia",
        courseName: "Biologia",
        category: "prova",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
      {
        id: "a2",
        userId: "user-1",
        title: "Leitura de artigo",
        description: "",
        courseId: "Português",
        courseName: "Português",
        category: "leitura",
        status: "nao_iniciada",
        dueDate: Date.now() + 100000,
        priority: "baixa",
        tags: [],
      },
    ];

    render(<Activities />);

    const search = screen.getByPlaceholderText(/Buscar atividades/i);
    fireEvent.change(search, { target: { value: "biologia" } });

    expect(screen.getByText("Prova de Biologia")).toBeInTheDocument();
    expect(screen.queryByText("Leitura de artigo")).not.toBeInTheDocument();
  });
});

describe("Activities - cobertura adicional (linhas vermelhas)", () => {
  it("validação: bloqueia submit sem título", async () => {
    render(<Activities />);
    openCreateDialog();

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(tomorrow) } });

    submitForm();

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Título é obrigatório");
    });
    expect(firebaseState.fbCreateActivity).not.toHaveBeenCalled();
  });

  it("validação: bloqueia submit sem data", async () => {
    render(<Activities />);
    openCreateDialog();

    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Teste sem data" } });
    submitForm();

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Data de entrega é obrigatória");
    });
    expect(firebaseState.fbCreateActivity).not.toHaveBeenCalled();
  });

  it("cria atividade e sincroniza Kanban: CRIA item quando não existe", async () => {
    render(<Activities />);

    firestoreState.getDocs
      .mockResolvedValueOnce(
        makeSnap({
          docs: [
            { id: "col-atraso", data: () => ({ title: "Em atraso" }) },
            { id: "col-por-fazer", data: () => ({ title: "Por Fazer" }) },
          ],
        })
      )
      .mockResolvedValueOnce(makeSnap({ docs: [], empty: true, size: 0 }))
      .mockResolvedValueOnce(makeSnap({ docs: [{ id: "k1" }, { id: "k2" }], empty: false, size: 2 }));

    firebaseState.fbCreateActivity.mockResolvedValueOnce("new-id");

    openCreateDialog();

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Criar com kanban" } });
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(yesterday) } });

    submitForm();

    await waitFor(() => expect(firebaseState.fbCreateActivity).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(firebaseState.fbCreateKanbanItem).toHaveBeenCalledWith({
        userId: "user-1",
        columnId: "col-atraso",
        activityId: "new-id",
        order: 2,
      });
    });

    expect(activitiesState.refreshData).toHaveBeenCalled();
    expect(toastState.toast.success).toHaveBeenCalledWith("Atividade criada com sucesso!");
  });

  it("syncKanban: MOVE item quando já existe (updateKanbanItem)", async () => {
    const due = new Date(Date.now() + 24 * 60 * 60 * 1000);

    activitiesState.activities = [
      {
        id: "a1",
        title: "Para editar",
        description: "desc",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: due.getTime(),
        priority: "media",
        tags: [],
      },
    ];

    render(<Activities />);

    const row = screen.getByText("Para editar").closest("tr")!;
    const btns = within(row).getAllByRole("button");
    fireEvent.click(btns[0]);

    firestoreState.getDocs
      .mockResolvedValueOnce(makeSnap({ docs: [{ id: "col-concluido", data: () => ({ title: "Concluído" }) }] }))
      .mockResolvedValueOnce(makeSnap({ docs: [{ id: "kanbanDocId" }], empty: false, size: 1 }));

    firebaseState.fbUpdateActivity.mockResolvedValueOnce(undefined);

    const form = screen.getByLabelText(/Título/i).closest("form")!;
    const selects = within(form).getAllByRole("combobox");
    const statusSelect = selects.find((s) =>
      Array.from((s as HTMLSelectElement).options).some((o) => o.value === "concluida")
    );
    if (!statusSelect) throw new Error("Select de status não encontrado no form");
    fireEvent.change(statusSelect, { target: { value: "concluida" } });

    fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(firebaseState.fbUpdateActivity).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({ status: "concluida" })
      );
    });

    await waitFor(() => {
      expect(firebaseState.fbUpdateKanbanItem).toHaveBeenCalledWith("kanbanDocId", {
        columnId: "col-concluido",
      });
    });
  });

  it("syncKanban: se NÃO achar coluna alvo, não cria/move item", async () => {
    render(<Activities />);

    firestoreState.getDocs.mockResolvedValueOnce(
      makeSnap({ docs: [{ id: "col-x", data: () => ({ title: "Qualquer coisa" }) }] })
    );

    firebaseState.fbCreateActivity.mockResolvedValueOnce("new-id");

    openCreateDialog();

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Sem coluna alvo" } });
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(tomorrow) } });

    submitForm();

    await waitFor(() => expect(firebaseState.fbCreateActivity).toHaveBeenCalledTimes(1));

    expect(firebaseState.fbCreateKanbanItem).not.toHaveBeenCalled();
    expect(firebaseState.fbUpdateKanbanItem).not.toHaveBeenCalled();
  });

  it("catch handleSubmit: erro com 'permissão' dispara toast extra", async () => {
    render(<Activities />);

    firebaseState.fbCreateActivity.mockRejectedValueOnce(new Error("Sem permissão no Firestore"));

    openCreateDialog();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Erro permissão" } });
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(tomorrow) } });
    submitForm();

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Sem permissão no Firestore", { duration: 6000 });
    });

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith(
        "Configure as regras do Firestore. Veja FIRESTORE_SETUP.md",
        { duration: 8000 }
      );
    });
  });

  it("catch handleSubmit: erro com ERR_BLOCKED_BY_CLIENT dispara toast extra", async () => {
    render(<Activities />);

    firebaseState.fbCreateActivity.mockRejectedValueOnce(new Error("ERR_BLOCKED_BY_CLIENT"));

    openCreateDialog();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Erro blocked" } });
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(tomorrow) } });
    submitForm();

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("ERR_BLOCKED_BY_CLIENT", { duration: 6000 });
    });

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith(
        "Verifique extensões bloqueando o Firebase ou problemas de conexão",
        { duration: 5000 }
      );
    });
  });

  it("abre edição e preenche o form com dados da activity (prefill)", () => {
    const due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    activitiesState.activities = [
      {
        id: "a1",
        title: "Atividade Editar",
        description: "Desc",
        courseId: "BIO",
        courseName: "Biologia",
        category: "atividade",
        status: "nao_iniciada",
        dueDate: new Date(due.getFullYear(), due.getMonth(), due.getDate(), 12, 0, 0).getTime(),
        priority: "media",
        tags: [],
      },
    ];

    render(<Activities />);

    const row = screen.getByText("Atividade Editar").closest("tr")!;
    const actionButtons = within(row).getAllByRole("button");
    fireEvent.click(actionButtons[0]);

    expect(screen.getByRole("heading", { name: /Editar Atividade/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/i)).toHaveValue("Atividade Editar");
    expect(screen.getByLabelText(/Descrição/i)).toHaveValue("Desc");
    expect(screen.getByLabelText(/Disciplina/i)).toHaveValue("Biologia");
    expect(screen.getByLabelText(/Data de Entrega/i)).toHaveValue(ymdLocal(due));
  });

  it("botão Cancelar fecha o dialog (handleCloseDialog)", async () => {
    render(<Activities />);

    openCreateDialog();
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /^Nova Atividade$/i })).not.toBeInTheDocument();
    });
  });

  it("mostra sugestões de disciplinas e permite clicar para preencher input (disciplineTemplates)", async () => {
    activitiesState.activities = [
      {
        id: "x1",
        title: "A",
        courseId: "Matemática",
        courseName: "Matemática",
        category: "atividade",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
      {
        id: "x2",
        title: "B",
        courseId: "Português",
        courseName: "Português",
        category: "atividade",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
    ];

    render(<Activities />);
    openCreateDialog();

    const chip = await screen.findByRole("button", { name: "Matemática" });
    fireEvent.click(chip);
    expect(screen.getByLabelText(/Disciplina/i)).toHaveValue("Matemática");
  });

  // ✅ CORRIGIDO: courseId precisa bater com o valor do filtro (que é "courseName || courseId")
  it("filtra por Disciplina e Categoria (filters em cima)", async () => {
    activitiesState.activities = [
      {
        id: "a1",
        title: "Item BIO",
        description: "",
        courseId: "Biologia",   // ✅ igual ao valor do select
        courseName: "Biologia", // ✅ igual ao valor do select
        category: "prova",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
      {
        id: "a2",
        title: "Item POR",
        description: "",
        courseId: "Português",   // ✅ igual ao valor do select
        courseName: "Português", // ✅ igual ao valor do select
        category: "leitura",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
    ];

    render(<Activities />);

    const selects = screen.getAllByRole("combobox");

    const disciplinaSelect = selects.find((s) =>
      within(s as HTMLElement).queryByText("Todas as disciplinas")
    ) as HTMLSelectElement | undefined;

    const categoriaSelect = selects.find((s) =>
      within(s as HTMLElement).queryByText("Todas as categorias")
    ) as HTMLSelectElement | undefined;

    expect(disciplinaSelect).toBeTruthy();
    expect(categoriaSelect).toBeTruthy();

    fireEvent.change(disciplinaSelect!, { target: { value: "Biologia" } });
    fireEvent.change(categoriaSelect!, { target: { value: "prova" } });

    await waitFor(() => {
      expect(screen.getByText("Item BIO")).toBeInTheDocument();
      expect(screen.queryByText("Item POR")).not.toBeInTheDocument();
    });
  });

  it("render de tags: mostra +N quando houver mais de 2 tags", () => {
    activitiesState.activities = [
      {
        id: "a1",
        title: "Tags 3",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [
          { id: "t1", label: "Tag1", color: "#000000" },
          { id: "t2", label: "Tag2", color: "#000000" },
          { id: "t3", label: "Tag3", color: "#000000" },
        ],
      },
    ];

    render(<Activities />);

    expect(screen.getByText("Tag1")).toBeInTheDocument();
    expect(screen.getByText("Tag2")).toBeInTheDocument();
    expect(screen.queryByText("Tag3")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("normalizeStatus: selecionar 'atrasada' com dueDate futuro salva como 'pendente'", async () => {
    const dueFuture = Date.now() + 7 * 24 * 60 * 60 * 1000;

    activitiesState.activities = [
      {
        id: "a1",
        title: "Norm future",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: dueFuture,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbUpdateActivity.mockResolvedValueOnce(undefined);

    render(<Activities />);

    const row = screen.getByText("Norm future").closest("tr")!;
    const selects = within(row).getAllByRole("combobox");
    const statusSelect = selects[1];

    fireEvent.change(statusSelect, { target: { value: "atrasada" } });

    await waitFor(() => {
      expect(firebaseState.fbUpdateActivity).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({ status: "pendente" })
      );
    });

    expect(toastState.toast.success).toHaveBeenCalledWith("Status atualizado!");
  });

  it("normalizeStatus: selecionar 'pendente' com dueDate passado salva como 'atrasada'", async () => {
    const duePast = Date.now() - 7 * 24 * 60 * 60 * 1000;

    activitiesState.activities = [
      {
        id: "a1",
        title: "Norm past",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "nao_iniciada",
        dueDate: duePast,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbUpdateActivity.mockResolvedValueOnce(undefined);

    render(<Activities />);

    const row = screen.getByText("Norm past").closest("tr")!;
    const selects = within(row).getAllByRole("combobox");
    const statusSelect = selects[1];

    fireEvent.change(statusSelect, { target: { value: "pendente" } });

    await waitFor(() => {
      expect(firebaseState.fbUpdateActivity).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({ status: "atrasada" })
      );
    });
  });

  it("ao marcar status como 'concluida', salva completedAt", async () => {
    const dueFuture = Date.now() + 2 * 24 * 60 * 60 * 1000;

    activitiesState.activities = [
      {
        id: "a1",
        title: "CompleteAt",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: dueFuture,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbUpdateActivity.mockResolvedValueOnce(undefined);

    render(<Activities />);

    const row = screen.getByText("CompleteAt").closest("tr")!;
    const selects = within(row).getAllByRole("combobox");
    const statusSelect = selects[1];

    fireEvent.change(statusSelect, { target: { value: "concluida" } });

    await waitFor(() => {
      expect(firebaseState.fbUpdateActivity).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({
          status: "concluida",
          completedAt: expect.any(Number),
        })
      );
    });
  });

  it("altera status na tabela: erro no update mostra toast de erro", async () => {
    const dueFuture = Date.now() + 24 * 60 * 60 * 1000;

    activitiesState.activities = [
      {
        id: "a1",
        title: "Status erro",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: dueFuture,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbUpdateActivity.mockRejectedValueOnce(new Error("fail"));

    render(<Activities />);

    const row = screen.getByText("Status erro").closest("tr")!;
    const selects = within(row).getAllByRole("combobox");
    const statusSelect = selects[1];

    fireEvent.change(statusSelect, { target: { value: "concluida" } });

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Erro ao atualizar status");
    });
  });

  it("altera prioridade na tabela: erro no update mostra toast de erro", async () => {
    const dueFuture = Date.now() + 24 * 60 * 60 * 1000;

    activitiesState.activities = [
      {
        id: "a1",
        title: "Priority erro",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: dueFuture,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbUpdateActivity.mockRejectedValueOnce(new Error("fail"));

    render(<Activities />);

    const row = screen.getByText("Priority erro").closest("tr")!;
    const selects = within(row).getAllByRole("combobox");
    const prioritySelect = selects[0];

    fireEvent.change(prioritySelect, { target: { value: "alta" } });

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Erro ao atualizar prioridade");
    });
  });

  it("delete: ao confirmar, fecha o modal imediatamente e executa delete", async () => {
    activitiesState.activities = [
      {
        id: "a1",
        title: "Del fast close",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbDeleteActivity.mockResolvedValueOnce(undefined);

    render(<Activities />);

    const row = screen.getByText("Del fast close").closest("tr")!;
    const btns = within(row).getAllByRole("button");
    fireEvent.click(btns[1]);

    expect(screen.getByText(/Excluir atividade/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Excluir$/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Excluir atividade/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(firebaseState.fbDeleteActivity).toHaveBeenCalledWith("a1");
    });
  });

  it("exclusão: erro no delete mostra toast de erro", async () => {
    activitiesState.activities = [
      {
        id: "a1",
        title: "Delete erro",
        description: "",
        courseId: "X",
        courseName: "X",
        category: "atividade",
        status: "pendente",
        dueDate: Date.now() + 100000,
        priority: "media",
        tags: [],
      },
    ];

    firebaseState.fbDeleteActivity.mockRejectedValueOnce(new Error("fail"));

    render(<Activities />);

    const row = screen.getByText("Delete erro").closest("tr")!;
    const btns = within(row).getAllByRole("button");
    fireEvent.click(btns[1]);

    fireEvent.click(screen.getByRole("button", { name: /^Excluir$/i }));

    await waitFor(() => {
      expect(toastState.toast.error).toHaveBeenCalledWith("Erro ao excluir atividade");
    });
  });

  it("tags: adiciona e remove tag (handleAddTag/handleRemoveTag)", async () => {
    render(<Activities />);
    openCreateDialog();

    const tagInput = screen.getByPlaceholderText(/Nome da tag/i);
    fireEvent.change(tagInput, { target: { value: "Urgente" } });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar tag/i }));
    expect(await screen.findByText("Urgente")).toBeInTheDocument();

    const tagChip = screen.getByText("Urgente").closest("span")!;
    const removeBtn = within(tagChip).getByRole("button", { name: "×" });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Urgente")).not.toBeInTheDocument();
    });
  });

  it("guard: se currentUser for null, submit não chama firebase (early return)", async () => {
    authState.currentUser = null;

    render(<Activities />);
    openCreateDialog();

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fireEvent.change(screen.getByLabelText(/Título/i), { target: { value: "Sem user" } });
    fireEvent.change(screen.getByLabelText(/Data de Entrega/i), { target: { value: ymdLocal(tomorrow) } });

    submitForm();

    await new Promise((r) => setTimeout(r, 0));

    expect(firebaseState.fbCreateActivity).not.toHaveBeenCalled();
    expect(firebaseState.fbUpdateActivity).not.toHaveBeenCalled();
  });
});
