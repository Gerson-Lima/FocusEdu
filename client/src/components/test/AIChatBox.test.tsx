/// <reference types="vitest" />

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { AIChatBox, Message } from "../AIChatBox";

// Mock simples do Streamdown (markdown não é foco do teste)
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("AIChatBox", () => {
  const baseMessages: Message[] = [];

  test("renderiza estado vazio", () => {
    render(
      <AIChatBox
        messages={baseMessages}
        onSendMessage={vi.fn()}
        emptyStateMessage="Mensagem inicial"
      />
    );

    expect(screen.getByText("Mensagem inicial")).toBeInTheDocument();
  });

  test("renderiza mensagens do usuário e do assistente", () => {
    const messages: Message[] = [
      { role: "user", content: "Oi" },
      { role: "assistant", content: "Olá!" },
    ];

    render(
      <AIChatBox
        messages={messages}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByText("Oi")).toBeInTheDocument();
    expect(screen.getByText("Olá!")).toBeInTheDocument();
  });

  test("envia mensagem ao clicar no botão", () => {
    const onSendMessage = vi.fn();

    render(
      <AIChatBox
        messages={[]}
        onSendMessage={onSendMessage}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Type your message..."), {
      target: { value: "Hello AI" },
    });

    fireEvent.click(screen.getByRole("button"));

    expect(onSendMessage).toHaveBeenCalledWith("Hello AI");
  });

  test("envia mensagem ao pressionar Enter", () => {
    const onSendMessage = vi.fn();

    render(
      <AIChatBox
        messages={[]}
        onSendMessage={onSendMessage}
      />
    );

    const input = screen.getByPlaceholderText("Type your message...");

    fireEvent.change(input, {
      target: { value: "Teste Enter" },
    });

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("Teste Enter");
  });

  test("não envia mensagem vazia", () => {
    const onSendMessage = vi.fn();

    render(
      <AIChatBox
        messages={[]}
        onSendMessage={onSendMessage}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test("exibe loader quando está loading", () => {
    render(
      <AIChatBox
        messages={[
          { role: "assistant", content: "Processando..." }
        ]}
        onSendMessage={vi.fn()}
        isLoading
      />
    );

    // Ícone de loading (SVG)
    expect(
      document.querySelector(".animate-spin")
    ).toBeInTheDocument();
  });

  test("botão fica desabilitado quando loading", () => {
    render(
      <AIChatBox
        messages={[]}
        onSendMessage={vi.fn()}
        isLoading
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  test("clique em suggested prompt dispara envio", () => {
    const onSendMessage = vi.fn();

    render(
      <AIChatBox
        messages={[]}
        onSendMessage={onSendMessage}
        suggestedPrompts={["Explique React"]}
      />
    );

    fireEvent.click(screen.getByText("Explique React"));

    expect(onSendMessage).toHaveBeenCalledWith("Explique React");
  });
});
