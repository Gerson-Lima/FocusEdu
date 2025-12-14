// client/src/pages/Teste/Security.test.tsx
import React, { type ReactNode } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Pelo seu log: client/src/pages/user/Security.tsx
import Security from "../user/Security";

/**
 * IMPORTANTE:
 * - vi.mock é HOISTED. Para evitar "Cannot access before initialization"
 *   e inconsistências em spies, usamos vi.hoisted().
 */
const mocks = vi.hoisted(() => {
  return {
    setLocation: vi.fn<(path: string) => void>(),
    signOut: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    toast: {
      success: vi.fn<(msg: string) => void>(),
      error: vi.fn<(msg: string) => void>(),
    },
    services: {
      reauthenticateUser: vi.fn<(password: string) => Promise<void>>(),
      changePassword: vi.fn<(newPassword: string) => Promise<void>>(),
      deleteAccount: vi.fn<() => Promise<void>>(),
    },
  };
});

// -------------------- Router --------------------
vi.mock("wouter", () => ({
  useLocation: () => ["/security", mocks.setLocation] as const,
}));

// -------------------- Auth --------------------
vi.mock("@/contexts/MockAuthContext", () => ({
  useFirebaseAuth: () => ({ signOut: mocks.signOut }),
}));

// -------------------- Toast --------------------
vi.mock("sonner", () => ({
  toast: mocks.toast,
}));

// -------------------- Services --------------------
// Security (pages/user/Security.tsx) importa "./useUserServices"
// Para o teste, o caminho resolvido equivale a "../user/useUserServices"
vi.mock("../user/useUserServices", () => ({
  reauthenticateUser: mocks.services.reauthenticateUser,
  changePassword: mocks.services.changePassword,
  deleteAccount: mocks.services.deleteAccount,
}));

// -------------------- UI Mocks --------------------
vi.mock("@/components/MainLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="layout">{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    ...props
  }: React.LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) => (
    <label {...props}>{children}</label>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

// -------------------- Helpers --------------------
async function fillPasswordChangeForm(params: { current: string; next: string; confirm: string }) {
  const { current, next, confirm } = params;

  // CORREÇÃO: regex EXATA para não conflitar com "Confirmar nova senha"
  await userEvent.type(screen.getByLabelText(/^Senha atual$/i), current);
  await userEvent.type(screen.getByLabelText(/^Nova senha$/i), next);
  await userEvent.type(screen.getByLabelText(/^Confirmar nova senha$/i), confirm);
}

describe("Security (FocusEdu)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.services.reauthenticateUser.mockResolvedValue(undefined);
    mocks.services.changePassword.mockResolvedValue(undefined);
    mocks.services.deleteAccount.mockResolvedValue(undefined);
  });

  it("SEC-SAVE-002: deve bloquear salvar se senhas não coincidirem", async () => {
    render(<Security />);

    await fillPasswordChangeForm({ current: "12345678", next: "Abcdef@1", confirm: "Abcdef@2" });
    await userEvent.click(screen.getByRole("button", { name: /SALVAR/i }));

    expect(mocks.toast.error).toHaveBeenCalledWith("As senhas não coincidem.");
    expect(mocks.services.reauthenticateUser).not.toHaveBeenCalled();
    expect(mocks.services.changePassword).not.toHaveBeenCalled();
  });

  it("SEC-SAVE-003: deve bloquear salvar se nova senha tiver menos de 8 caracteres", async () => {
    render(<Security />);

    await fillPasswordChangeForm({ current: "12345678", next: "Abc@1", confirm: "Abc@1" });
    await userEvent.click(screen.getByRole("button", { name: /SALVAR/i }));

    expect(mocks.toast.error).toHaveBeenCalledWith("A senha deve ter ao menos 8 caracteres.");
    expect(mocks.services.reauthenticateUser).not.toHaveBeenCalled();
    expect(mocks.services.changePassword).not.toHaveBeenCalled();
  });

  it("SEC-SAVE-004: fluxo feliz de alteração de senha deve signOut e redirecionar", async () => {
    render(<Security />);

    await fillPasswordChangeForm({
      current: "SenhaAtual@1",
      next: "NovaSenha@1",
      confirm: "NovaSenha@1",
    });

    await userEvent.click(screen.getByRole("button", { name: /SALVAR/i }));

    await waitFor(() => {
      expect(mocks.services.reauthenticateUser).toHaveBeenCalledWith("SenhaAtual@1");
      expect(mocks.services.changePassword).toHaveBeenCalledWith("NovaSenha@1");
      expect(mocks.toast.success).toHaveBeenCalledWith("Senha alterada com sucesso. Faça login novamente.");
    });

    expect(screen.getByLabelText(/^Senha atual$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^Nova senha$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^Confirmar nova senha$/i)).toHaveValue("");

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.setLocation).toHaveBeenCalledWith("/");
  });

  it("SEC-DEL-004: fluxo feliz de exclusão deve signOut e redirecionar", async () => {
    render(<Security />);

    // Abre o modal
    await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));

    const dialog = screen.getByTestId("dialog");
    await userEvent.type(within(dialog).getByLabelText(/^Senha$/i), "SenhaAtual@1");

    // CORREÇÃO: clicar no botão do MODAL (scoped)
    await userEvent.click(within(dialog).getByRole("button", { name: /^EXCLUIR CONTA$/i }));

    await waitFor(() => {
      expect(mocks.services.reauthenticateUser).toHaveBeenCalledWith("SenhaAtual@1");
      expect(mocks.services.deleteAccount).toHaveBeenCalledTimes(1);
      expect(mocks.toast.success).toHaveBeenCalledWith("Conta excluída com sucesso.");
    });

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.setLocation).toHaveBeenCalledWith("/");
  });

  it("SEC-UI-003: VOLTAR deve chamar setLocation('/dashboard')", async () => {
  render(<Security />);
  await userEvent.click(screen.getByRole("button", { name: /^VOLTAR$/i }));
  expect(mocks.setLocation).toHaveBeenCalledWith("/dashboard");
});

it("SEC-SAVE-007: deve cair no catch do handleSave e usar fallback quando err não tem message", async () => {
  mocks.services.reauthenticateUser.mockRejectedValueOnce({}); // sem .message
  render(<Security />);

  await fillPasswordChangeForm({
    current: "SenhaAtual@1",
    next: "NovaSenha@1",
    confirm: "NovaSenha@1",
  });

  await userEvent.click(screen.getByRole("button", { name: /^SALVAR$/i }));

  await waitFor(() => {
    expect(mocks.toast.error).toHaveBeenCalledWith("Erro ao alterar senha.");
  });
});

it("SEC-SAVE-008: deve cair no catch do handleSave e exibir err.message quando existir", async () => {
  mocks.services.changePassword.mockRejectedValueOnce(new Error("Falha ao trocar senha"));
  render(<Security />);

  await fillPasswordChangeForm({
    current: "SenhaAtual@1",
    next: "NovaSenha@1",
    confirm: "NovaSenha@1",
  });

  await userEvent.click(screen.getByRole("button", { name: /^SALVAR$/i }));

  await waitFor(() => {
    expect(mocks.toast.error).toHaveBeenCalledWith("Falha ao trocar senha");
  });
});

it("SEC-DEL-005: deve bloquear exclusão quando deletePassword estiver vazio", async () => {
  render(<Security />);

  // abre modal (botão da tela)
  await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));
  const dialog = screen.getByTestId("dialog");

  // clica EXCLUIR CONTA dentro do modal sem digitar senha
  await userEvent.click(within(dialog).getByRole("button", { name: /^EXCLUIR CONTA$/i }));

  expect(mocks.toast.error).toHaveBeenCalledWith("Digite sua senha para confirmar.");
  expect(mocks.services.reauthenticateUser).not.toHaveBeenCalled();
  expect(mocks.services.deleteAccount).not.toHaveBeenCalled();
});

it("SEC-DEL-006: CANCELAR deve fechar o modal e reabrir deve limpar deletePassword", async () => {
  render(<Security />);

  // abre modal
  await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));
  let dialog = screen.getByTestId("dialog");

  // digita algo e cancela
  await userEvent.type(within(dialog).getByLabelText(/^Senha$/i), "QualquerCoisa");
  await userEvent.click(within(dialog).getByRole("button", { name: /^CANCELAR$/i }));

  await waitFor(() => {
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  // reabre e garante que limpou (cobre setDeletePassword("") no onClick do botão principal)
  await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));
  dialog = screen.getByTestId("dialog");
  expect(within(dialog).getByLabelText(/^Senha$/i)).toHaveValue("");
});

it("SEC-DEL-007: deve cair no catch do handleDeleteAccount e usar fallback quando err não tem message", async () => {
  mocks.services.reauthenticateUser.mockRejectedValueOnce({}); // sem .message
  render(<Security />);

  await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));
  const dialog = screen.getByTestId("dialog");

  await userEvent.type(within(dialog).getByLabelText(/^Senha$/i), "SenhaAtual@1");
  await userEvent.click(within(dialog).getByRole("button", { name: /^EXCLUIR CONTA$/i }));

  await waitFor(() => {
    expect(mocks.toast.error).toHaveBeenCalledWith("Erro ao excluir conta.");
  });

  expect(mocks.services.deleteAccount).not.toHaveBeenCalled();
});

it("SEC-DEL-008: deve cair no catch do handleDeleteAccount e exibir err.message quando existir", async () => {
  mocks.services.deleteAccount.mockRejectedValueOnce(new Error("Falha ao excluir"));
  render(<Security />);

  await userEvent.click(screen.getByRole("button", { name: /^EXCLUIR CONTA$/i }));
  const dialog = screen.getByTestId("dialog");

  await userEvent.type(within(dialog).getByLabelText(/^Senha$/i), "SenhaAtual@1");
  await userEvent.click(within(dialog).getByRole("button", { name: /^EXCLUIR CONTA$/i }));

  await waitFor(() => {
    expect(mocks.toast.error).toHaveBeenCalledWith("Falha ao excluir");
  });
});

it("SEC-SAVE-001: deve exibir erro quando algum campo estiver vazio (cobre linha 32)", async () => {
  render(<Security />);

  // Preenche apenas 1 ou 2 campos e deixa o restante vazio
  await userEvent.type(screen.getByLabelText(/^Senha atual$/i), "12345678");
  // não preencher "Nova senha" e "Confirmar nova senha"

  await userEvent.click(screen.getByRole("button", { name: /^SALVAR$/i }));

  expect(mocks.toast.error).toHaveBeenCalledWith("Preencha todos os campos.");
  expect(mocks.services.reauthenticateUser).not.toHaveBeenCalled();
  expect(mocks.services.changePassword).not.toHaveBeenCalled();
});

});
