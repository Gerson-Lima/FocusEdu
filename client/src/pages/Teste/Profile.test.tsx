import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

type UserData = {
  name?: string;
  email?: string;
  photoURL?: string | null;
} | null;

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// ===== Mocks stateful =====
let mockUserData: UserData = {
  name: "Ana Maria",
  email: "ana@x.com",
  photoURL: null,
};

const mockSetLocation = vi.fn<(path: string) => void>();

const mockChangeName = vi.fn<(...args: unknown[]) => unknown>();
const mockRequestEmailUpdate = vi.fn<(...args: unknown[]) => unknown>();
const mockReauthenticateUser = vi.fn<(...args: unknown[]) => unknown>();

// ===== Mocks de módulos =====
vi.mock("wouter", () => ({
  useLocation: () => ["/security", mockSetLocation] as const,
}));

vi.mock("@/contexts/MockAuthContext", () => ({
  useFirebaseAuth: () => ({ userData: mockUserData }),
}));

// IMPORTANTÍSSIMO: mock pelo caminho REAL (pasta user)
vi.mock("../user/useUserServices", () => ({
  changeName: mockChangeName,
  requestEmailUpdate: mockRequestEmailUpdate,
  reauthenticateUser: mockReauthenticateUser,
}));

// UI mocks
vi.mock("@/components/MainLayout", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  Pen: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="pen-icon" {...props} />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="avatar" {...props}>
      {children}
    </div>
  ),
  AvatarImage: (props: React.ComponentProps<"img">) => <img data-testid="avatar-image" {...props} />,
  AvatarFallback: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="avatar-fallback" {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <section data-testid="card" {...props}>
      {children}
    </section>
  ),
  CardHeader: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <header {...props}>{children}</header>
  ),
  CardTitle: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) => (
    <h1 {...props}>{children}</h1>
  ),
  CardContent: ({
    children,
    ...props
  }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: React.ComponentProps<"label">) => (
    <label {...props}>{children}</label>
  ),
}));

async function loadComponent() {
  // Import dinâmico do componente REAL (pasta user)
  const mod = await import("../user/Profile");
  return mod.default;
}

describe("Profile/Security - FocusEdu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // garante que o import dinâmico recarregue com mocks aplicados

    mockUserData = {
      name: "Ana Maria",
      email: "ana@x.com",
      photoURL: null,
    };
  });

  it("CT-PRF-001: renderiza dados do usuário e iniciais", async () => {
    const Security = await loadComponent();
    render(<Security />);

    expect(screen.getByText("Segurança")).toBeInTheDocument();
    expect(screen.getByText("Ana Maria")).toBeInTheDocument();
    expect(screen.getByText("ana@x.com")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-fallback").textContent).toBe("AM");

    expect(screen.getByLabelText("Nome")).toHaveValue("Ana Maria");
    expect(screen.getByLabelText("Email")).toHaveValue("ana@x.com");
  });

  it("CT-PRF-002: fallback quando não há userData", async () => {
    mockUserData = null;

    const Security = await loadComponent();
    render(<Security />);

    expect(screen.getByText("Sem nome")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-fallback").textContent).toBe("U");
  });

  it("CT-PRF-003: botão CANCELAR navega para /dashboard", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));
    expect(mockSetLocation).toHaveBeenCalledWith("/dashboard");
  });

  it("CT-PRF-004: salvar sem alterações redireciona e não chama serviços", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    await waitFor(() => expect(mockSetLocation).toHaveBeenCalledWith("/dashboard"));
    expect(mockChangeName).not.toHaveBeenCalled();
    expect(mockReauthenticateUser).not.toHaveBeenCalled();
    expect(mockRequestEmailUpdate).not.toHaveBeenCalled();
  });

  it("CT-PRF-005: alterar apenas nome chama changeName e redireciona", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Souza" } });
    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    await waitFor(() => expect(mockChangeName).toHaveBeenCalledWith("Ana Souza"));
    await waitFor(() => expect(mockSetLocation).toHaveBeenCalledWith("/dashboard"));
  });

  it("CT-PRF-006: alterar email sem senha exibe campo de senha e não prossegue", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "novo@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    expect(
      await screen.findByLabelText("Senha (obrigatória para alterar email)")
    ).toBeInTheDocument();

    expect(mockReauthenticateUser).not.toHaveBeenCalled();
    expect(mockRequestEmailUpdate).not.toHaveBeenCalled();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it("CT-PRF-007: alterar email com senha reautentica, solicita update e exibe sucesso", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "novo@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    const passwordInput = await screen.findByLabelText("Senha (obrigatória para alterar email)");
    fireEvent.change(passwordInput, { target: { value: "123" } });

    mockReauthenticateUser.mockResolvedValueOnce(undefined);
    mockRequestEmailUpdate.mockResolvedValueOnce(undefined);

    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    await waitFor(() => expect(mockReauthenticateUser).toHaveBeenCalledWith("123"));
    await waitFor(() => expect(mockRequestEmailUpdate).toHaveBeenCalledWith("novo@x.com"));

    expect(
      await screen.findByText(/Email de verificacao enviado para novo@x\.com/i)
    ).toBeInTheDocument();

    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it("CT-PRF-009: falha na reautenticação exibe erro e encerra loading", async () => {
    const Security = await loadComponent();
    render(<Security />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "novo@x.com" } });
    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    const passwordInput = await screen.findByLabelText("Senha (obrigatória para alterar email)");
    fireEvent.change(passwordInput, { target: { value: "errada" } });

    mockReauthenticateUser.mockRejectedValueOnce(new Error("Senha inválida"));

    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    expect(await screen.findByText("Senha inválida")).toBeInTheDocument();
    expect(mockRequestEmailUpdate).not.toHaveBeenCalled();
    expect(mockSetLocation).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.getByRole("button", { name: "SALVAR" })).toBeInTheDocument());
  });

  it("CT-PRF-010: estado de loading mostra 'SALVANDO...' e desabilita controles", async () => {
    const Security = await loadComponent();
    const d = deferred<void>();

    mockChangeName.mockReturnValueOnce(d.promise);

    render(<Security />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Souza" } });
    fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

    expect(screen.getByRole("button", { name: "SALVANDO..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "CANCELAR" })).toBeDisabled();
    expect(screen.getByLabelText("Nome")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();

    d.resolve();
    await waitFor(() => expect(screen.getByRole("button", { name: "SALVAR" })).toBeInTheDocument());
  });

  it("CT-PRF-011: getInitials retorna 'U' quando nome tem apenas espaços (cobre linha 17)", async () => {
  mockUserData = {
    name: "   ",           // truthy, mas trim() => ""
    email: "ana@x.com",
    photoURL: null,
  };

  const Security = await loadComponent();
  render(<Security />);

  // Como name é "   ", o resumo de nome pode ficar visualmente vazio,
  // mas o que importa aqui é o fallback das iniciais.
  expect(screen.getByTestId("avatar-fallback").textContent).toBe("U");
});

it("CT-PRF-012: AvatarImage usa photoURL quando fornecido (cobre linha 84)", async () => {
  mockUserData = {
    name: "Ana Maria",
    email: "ana@x.com",
    photoURL: "https://example.com/avatar.png", // cobre o lado esquerdo do ??
  };

  const Security = await loadComponent();
  render(<Security />);

  const img = screen.getByTestId("avatar-image") as HTMLImageElement;
  expect(img.getAttribute("src")).toBe("https://example.com/avatar.png");
});

it("CT-PRF-013: exibe erro padrão quando falha sem mensagem (cobre linha 84)", async () => {
  const Security = await loadComponent();
  render(<Security />);

  // Força fluxo de alteração de email (para cair no try/catch)
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "novo@x.com" } });
  fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

  // Campo de senha aparece
  const passwordInput = await screen.findByLabelText("Senha (obrigatória para alterar email)");
  fireEvent.change(passwordInput, { target: { value: "123" } });

  // ERRO sem message -> ativa "Erro ao salvar alteracoes"
  mockReauthenticateUser.mockRejectedValueOnce({});

  fireEvent.click(screen.getByRole("button", { name: "SALVAR" }));

  expect(await screen.findByText("Erro ao salvar alteracoes")).toBeInTheDocument();
  expect(mockRequestEmailUpdate).not.toHaveBeenCalled();
  expect(mockSetLocation).not.toHaveBeenCalled();
});


});
