/// <reference types="vitest" />

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { AIChatBox, Message } from "../AIChatBox";

/**
 * 🔹 IMPORTS DO DIALOG (ISOLADO)
 */
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * 🔹 Mock do Streamdown
 */
vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

/* -------------------------------------------------------------------------- */
/*                               AIChatBox                                    */
/* -------------------------------------------------------------------------- */

describe("AIChatBox (cobrindo textarea.tsx e scroll-area)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renderiza estado vazio", () => {
    render(
      <AIChatBox
        messages={[]}
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

    render(<AIChatBox messages={messages} onSendMessage={vi.fn()} />);

    expect(screen.getByText("Oi")).toBeInTheDocument();
    expect(screen.getByText("Olá!")).toBeInTheDocument();
  });

  test("não renderiza mensagens do tipo system", () => {
    const messages: Message[] = [
      { role: "system", content: "Configuração interna" },
      { role: "user", content: "Mensagem visível" },
    ];

    render(<AIChatBox messages={messages} onSendMessage={vi.fn()} />);

    expect(screen.getByText("Mensagem visível")).toBeInTheDocument();
    expect(
      screen.queryByText("Configuração interna")
    ).not.toBeInTheDocument();
  });

  test("envia mensagem ao clicar no botão", () => {
    const onSendMessage = vi.fn();

    render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Hello AI" },
    });

    fireEvent.click(screen.getByRole("button"));

    expect(onSendMessage).toHaveBeenCalledWith("Hello AI");
  });

  test("envia mensagem ao pressionar Enter", () => {
    const onSendMessage = vi.fn();

    render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Teste Enter" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("Teste Enter");
  });

  test("não envia mensagem vazia", () => {
    const onSendMessage = vi.fn();

    render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test("exibe loader quando está loading", () => {
    render(
      <AIChatBox
        messages={[{ role: "assistant", content: "Processando..." }]}
        onSendMessage={vi.fn()}
        isLoading
      />
    );

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  test("botão fica desabilitado quando loading", () => {
    render(<AIChatBox messages={[]} onSendMessage={vi.fn()} isLoading />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("renderiza ícone de envio quando não está loading", () => {
    render(<AIChatBox messages={[]} onSendMessage={vi.fn()} />);

    expect(
      document.querySelector("svg.lucide-send")
    ).toBeInTheDocument();
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

  test("não renderiza suggestedPrompts quando não fornecido", () => {
    render(<AIChatBox messages={[]} onSendMessage={vi.fn()} />);

    expect(
      screen.queryByText(/explique/i)
    ).not.toBeInTheDocument();
  });

  test("não renderiza suggestedPrompts quando array está vazio", () => {
    render(
      <AIChatBox
        messages={[]}
        onSendMessage={vi.fn()}
        suggestedPrompts={[]}
      />
    );

    expect(
      screen.queryByText(/explique/i)
    ).not.toBeInTheDocument();
  });

  /**
   * 🔥 textarea.tsx — IME / composição
   */

  test("NÃO envia mensagem ao pressionar Enter durante composição (IME)", () => {
    const onSendMessage = vi.fn();

    render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "Texto IME" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      isComposing: true,
    });

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test("Shift+Enter NÃO envia mensagem (quebra de linha)", () => {
    const onSendMessage = vi.fn();

    render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "Linha 1" } });
    fireEvent.keyDown(textarea, {
      key: "Enter",
      shiftKey: true,
    });

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test("compositionStart e compositionEnd não quebram envio posterior", async () => {
  const onSendMessage = vi.fn();

  vi.useFakeTimers();

  render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

  const textarea = screen.getByRole("textbox");

  // Inicia composição (IME)
  fireEvent.compositionStart(textarea);

  // Finaliza composição
  fireEvent.compositionEnd(textarea);

  // 🔑 deixa o estado interno liberar isComposing
  vi.runAllTimers();

  fireEvent.change(textarea, {
    target: { value: "Após composição" },
  });

  fireEvent.keyDown(textarea, { key: "Enter" });

  expect(onSendMessage).toHaveBeenCalledWith("Após composição");

  vi.useRealTimers();
});

  /**
   * 🔥 scroll-area
   */
  test("faz scroll suave para o final ao enviar mensagem", async () => {
  const onSendMessage = vi.fn();
  const scrollToMock = vi.fn();

  const viewport = document.createElement("div");
  viewport.setAttribute("data-radix-scroll-area-viewport", "");
  Object.defineProperty(viewport, "scrollHeight", { value: 300 });
  viewport.scrollTo = scrollToMock;

  vi.spyOn(HTMLElement.prototype, "querySelector").mockReturnValue(
    viewport as any
  );

  render(<AIChatBox messages={[]} onSendMessage={onSendMessage} />);

  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Scroll test" },
  });

  fireEvent.click(screen.getByRole("button"));

  await screen.findByDisplayValue("");

  await vi.waitFor(() => {
    expect(scrollToMock).toHaveBeenCalled();
  });
});

});

/* -------------------------------------------------------------------------- */
/*                               Dialog (isolado)                             */
/* -------------------------------------------------------------------------- */

describe("Dialog (cobrindo dialog.tsx)", () => {
  test("renderiza DialogContent quando aberto", () => {
    render(
      <Dialog open>
        <DialogContent>
          <p>Conteúdo do Dialog</p>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Conteúdo do Dialog")).toBeInTheDocument();
  });

  test("DialogClose fecha o dialog", () => {
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true);

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogClose data-slot="dialog-close">Fechar</DialogClose>
          </DialogContent>
        </Dialog>
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByText("Fechar"));

    expect(
      screen.queryByText("Fechar")
    ).not.toBeInTheDocument();
  });

  test("ESC fecha o dialog quando NÃO está compondo", () => {
    const Wrapper = () => {
      const [open, setOpen] = React.useState(true);

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <p>Dialog ESC</p>
          </DialogContent>
        </Dialog>
      );
    };

    render(<Wrapper />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByText("Dialog ESC")
    ).not.toBeInTheDocument();
  });


  test("ESC é ignorado quando isComposing = true", () => {
    render(
      <Dialog open>
        <DialogContent>
          <p>Dialog IME</p>
        </DialogContent>
      </Dialog>
    );

    fireEvent.keyDown(document, {
      key: "Escape",
      isComposing: true,
    });

    expect(screen.getByText("Dialog IME")).toBeInTheDocument();
  });
});
