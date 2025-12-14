/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, beforeEach, expect, vi, type Mock } from "vitest";
import BlockSignUp from "./index";
import { signUp } from "../../services/auth";
import { useLocation } from "wouter";

// Mocks
vi.mock("../../services/auth", () => ({
  signUp: vi.fn()
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn()
}));

describe("BlockSignUp Component", () => {
  const mockSetLocation = vi.fn();

  beforeEach(() => {
    (useLocation as unknown as Mock).mockReturnValue(["", mockSetLocation]);
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("Deve exibir erro ao tentar cadastrar com nome vazio", async () => {
    render(<BlockSignUp />);

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(await screen.findByText("Informe seu nome"))
      .toBeInTheDocument();

    expect(signUp).not.toHaveBeenCalled();
  });

  test("Deve exibir erro para senhas diferentes", async () => {
    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "654321" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(await screen.findByText("As senhas não coincidem"))
      .toBeInTheDocument();

    expect(signUp).not.toHaveBeenCalled();
  });

  test("Cadastro válido deve redirecionar e salvar token", async () => {
    const fakeUser = {
      user: {
        getIdToken: vi.fn().mockResolvedValue("fake-token")
      }
    };

    (signUp as Mock).mockResolvedValue(fakeUser);

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "joao@email.com" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "123456" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    await waitFor(() => {
      expect(signUp).toHaveBeenCalled();
    });

    expect(localStorage.getItem("token")).toBe("fake-token");
    expect(mockSetLocation).toHaveBeenCalledWith("/dashboard");
  });

  test("Deve exibir erro genérico quando signUp falha", async () => {
    (signUp as Mock).mockRejectedValue(new Error("Erro"));

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "teste@email.com" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "123456" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(await screen.findByText("Erro ao criar conta"))
      .toBeInTheDocument();
  });

  // 🔽 NOVOS TESTES — cobertura das linhas 41–50 🔽

  test("Deve exibir erro para senha fraca (auth/weak-password)", async () => {
    (signUp as Mock).mockRejectedValue({ code: "auth/weak-password" });

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "teste@email.com" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123" } });
    fireEvent.change(pwdFields[1], { target: { value: "123" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(
      await screen.findByText("Senha precisa ter no mínimo 6 caracteres")
    ).toBeInTheDocument();
  });

  test("Deve exibir erro para e-mail já em uso (auth/email-already-in-use)", async () => {
    (signUp as Mock).mockRejectedValue({
      code: "auth/email-already-in-use"
    });

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "teste@email.com" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "123456" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(
      await screen.findByText("Este e-mail já está em uso")
    ).toBeInTheDocument();
  });

  test("Deve exibir erro para e-mail inválido (auth/invalid-email)", async () => {
    (signUp as Mock).mockRejectedValue({
      code: "auth/invalid-email"
    });

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "email-invalido" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "123456" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(
      await screen.findByText("E-mail inválido")
    ).toBeInTheDocument();
  });

  test("Deve cair no default para erro desconhecido", async () => {
    (signUp as Mock).mockRejectedValue({
      code: "auth/unknown-error"
    });

    render(<BlockSignUp />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: João"), {
      target: { value: "João" }
    });

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), {
      target: { value: "teste@email.com" }
    });

    const pwdFields = screen.getAllByPlaceholderText("••••••••••••");
    fireEvent.change(pwdFields[0], { target: { value: "123456" } });
    fireEvent.change(pwdFields[1], { target: { value: "123456" } });

    fireEvent.click(
      screen.getByRole("button", { name: /criar conta/i })
    );

    expect(
      await screen.findByText("Erro ao criar conta")
    ).toBeInTheDocument();
  });
});
