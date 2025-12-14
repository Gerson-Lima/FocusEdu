import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// AJUSTE DO IMPORT: Subimos um nível com ".." para achar o componente
import Login from "../Login"; 
import { vi, describe, test, expect, beforeEach } from "vitest";

// --- MOCKS ---

// 1. Mock dos componentes filhos para isolar o teste
vi.mock("../../components/BlockLogin", () => ({
  default: () => <div data-testid="block-login-mock">Formulário de Login</div>,
}));

vi.mock("../../components/BlockSignUp", () => ({
  default: () => <div data-testid="block-signup-mock">Formulário de Cadastro</div>,
}));

// 2. Mock das imagens para não quebrar o teste
vi.mock("../../assets/logo.svg", () => ({ default: "logo.svg" }));
vi.mock("../../assets/login-bg.png", () => ({ default: "bg.png" }));

// 3. Mock do ResizeObserver (Essencial para testes com Framer Motion)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("Login Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("deve limpar o token do localStorage ao renderizar a página", () => {
    localStorage.setItem("token", "token-velho-123");
    render(<Login />);
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("deve renderizar o layout base (textos e imagem) corretamente", () => {
    render(<Login />);
    expect(screen.getByText("Gerencie seu tempo")).toBeInTheDocument();
    expect(screen.getByText("Organize suas tarefas")).toBeInTheDocument();
    expect(screen.getByText(/Ainda não possui uma conta?/i)).toBeInTheDocument();
  });

  test("deve iniciar exibindo o componente de Login (BlockLogin)", () => {
    render(<Login />);
    expect(screen.getByTestId("block-login-mock")).toBeInTheDocument();
    expect(screen.queryByTestId("block-signup-mock")).not.toBeInTheDocument();
  });

  test("deve alternar para o componente de Cadastro ao clicar em 'Cadastre-se'", async () => {
    render(<Login />);

    // 1. Clica no botão para alternar
    const toggleButton = screen.getByRole("button", { name: "Cadastre-se" });
    fireEvent.click(toggleButton);

    // 2. Verifica se o texto de rodapé mudou
    expect(screen.getByText(/Já possui uma conta?/i)).toBeInTheDocument();

    // 3. Espera a animação terminar e o Cadastro aparecer (findBy)
    const signUpForm = await screen.findByTestId("block-signup-mock");
    expect(signUpForm).toBeInTheDocument();

    // 4. Garante que o Login sumiu da tela
    await waitFor(() => {
      expect(screen.queryByTestId("block-login-mock")).not.toBeInTheDocument();
    });
  });

  test("deve voltar para o componente de Login ao clicar em 'Fazer login'", async () => {
    render(<Login />);

    // Passo 1: Ir para o cadastro primeiro
    fireEvent.click(screen.getByRole("button", { name: "Cadastre-se" }));
    
    // Espera o cadastro carregar
    await screen.findByTestId("block-signup-mock");

    // Passo 2: Clicar no botão de voltar (Fazer login)
    const backButton = screen.getByRole("button", { name: "Fazer login" });
    fireEvent.click(backButton);

    // Passo 3: Esperar o Login voltar (findBy)
    const loginForm = await screen.findByTestId("block-login-mock");
    expect(loginForm).toBeInTheDocument();

    // Passo 4: Garantir que o Cadastro sumiu
    await waitFor(() => {
      expect(screen.queryByTestId("block-signup-mock")).not.toBeInTheDocument();
    });
  });
});
