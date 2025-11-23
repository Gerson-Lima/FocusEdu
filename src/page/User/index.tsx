import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  atualizarEmailUsuario,
  excluirContaUsuario,
} from "./useServices";

export default function User() {
  const [email, setEmail] = useState("");
  const [novoEmail, setNovoEmail] = useState("");

  const [password, setPassword] = useState("");       // senha atual
  const [novaSenha, setNovaSenha] = useState("");     // nova senha

  const [modal, setModal] = useState<
    "senha" | "nova-senha" | "confirmar-delete" | null
  >(null);

  const [acao, setAcao] = useState<"email" | "delete" | "senha" | null>(null);

  const auth = getAuth();
  const navigate = useNavigate();

  /* 🔄 Obter email atual do usuário */
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.email) setEmail(user.email);
  }, []);

  /* 🔓 Abrir modal solicitando senha atual */
  const solicitarSenha = (tipo: "email" | "delete" | "senha") => {
    setAcao(tipo);
    setModal("senha");
  };

  /* 🔑 Reautenticar antes de qualquer ação */
  const executarAcao = async () => {
    const user = auth.currentUser;
    if (!user || !password) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      setModal(null);

      // Atualizar email
      if (acao === "email") {
        try {
          await atualizarEmailUsuario(novoEmail, password);
          alert("Email atualizado! Confira seu email.\nFaça login novamente.");
          navigate("../Login");
        } catch (err: any) {
          alert(err.message);
        }
      }

      // Alterar senha
      if (acao === "senha") {
        setModal("nova-senha");
      }

      // Abrir confirmação de exclusão
      if (acao === "delete") {
        setModal("confirmar-delete");
      }
    } catch {
      alert("Senha incorreta!");
    }
  };

  /* 🔐 Atualizar senha */
  const atualizarSenha = async () => {
    const user = auth.currentUser;
    if (!user || !novaSenha.trim())
      return alert("Digite uma nova senha válida.");

    try {
      await updatePassword(user, novaSenha);

      alert("Senha atualizada! Faça login novamente.");
      navigate("../Login");
    } catch (err: any) {
      alert(err.message);
    }
  };

  /* 🗑 Excluir conta */
  const excluirConta = async () => {
    try {
      await excluirContaUsuario(password);
      alert("Conta excluída!");
      navigate("../Login");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <section className="h-screen flex flex-col items-center justify-center">

      <Link
        to="/home"
        className="absolute top-8 left-8 bg-gray-600 text-white px-4 py-2 rounded"
      >
        Voltar
      </Link>

      <div className="flex flex-col items-center gap-6 w-full max-w-sm -mt-32">
        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
          IMG
        </div>

        <p>
          <strong>Email atual:</strong> {email}
        </p>

        <input
          type="email"
          placeholder="Novo email"
          className="border p-2 rounded w-full"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
        />

        {/* BOTÕES */}
        <button
          className="w-full bg-blue-600 text-white p-2 rounded cursor-pointer"
          onClick={() => solicitarSenha("email")}
        >
          Atualizar Email
        </button>

        <button
          className="w-full bg-yellow-600 text-white p-2 rounded cursor-pointer"
          onClick={() => solicitarSenha("senha")}
        >
          Alterar Senha
        </button>

        <button
          className="w-full bg-red-600 text-white p-2 rounded cursor-pointer"
          onClick={() => solicitarSenha("delete")}
        >
          Excluir Conta
        </button>
      </div>

      {/* ========= MODAL SENHA ATUAL ========= */}
      {modal === "senha" && (
        <Modal>
          <h2 className="text-lg font-semibold">Digite sua senha atual</h2>

          <input
            type="password"
            placeholder="Senha atual"
            className="border p-2 rounded w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="bg-blue-600 text-white p-2 rounded w-full cursor-pointer"
            onClick={executarAcao}
          >
            Continuar
          </button>

          <button
            className="text-gray-600 underline cursor-pointer"
            onClick={() => setModal(null)}
          >
            Cancelar
          </button>
        </Modal>
      )}

      {/* ========= MODAL NOVA SENHA ========= */}
      {modal === "nova-senha" && (
        <Modal>
          <h2 className="text-lg font-semibold">Digite a nova senha</h2>

          <input
            type="password"
            placeholder="Nova senha"
            className="border p-2 rounded w-full"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />

          <button
            className="bg-yellow-600 text-white p-2 rounded w-full"
            onClick={atualizarSenha}
          >
            Atualizar Senha
          </button>

          <button
            className="text-gray-600 underline"
            onClick={() => setModal(null)}
          >
            Cancelar
          </button>
        </Modal>
      )}

      {/* ========= MODAL DE CONFIRMAÇÃO ========= */}
      {modal === "confirmar-delete" && (
        <Modal>
          <h2 className="text-lg font-semibold text-red-600">
            Tem certeza disso?
          </h2>

          <p>Sua conta será removida permanentemente.</p>

          <button
            className="bg-red-600 text-white p-2 rounded w-full"
            onClick={excluirConta}
          >
            Excluir conta
          </button>

          <button
            className="text-gray-600 underline"
            onClick={() => setModal(null)}
          >
            Cancelar
          </button>
        </Modal>
      )}
    </section>
  );
}

/* 🔹 MODAL REUTILIZÁVEL */
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-80 p-6 rounded-lg shadow-xl flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
