import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

// 🔥 Serviços
import {
  atualizarEmailUsuario,
  excluirContaUsuario,
} from "./useServices";

export default function User() {
  const [email, setEmail] = useState(""); // Email atual
  const [novoEmail, setNovoEmail] = useState(""); // Novo email
  const [password, setPassword] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acao, setAcao] = useState<"email" | "delete" | null>(null);

  const navigate = useNavigate();
  const auth = getAuth();

  // 🔄 Inicializa email atual do usuário
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) setEmail(user.email);
  }, []);

  // Abrir modal para senha
  const openPasswordModal = (acaoEscolhida: "email" | "delete") => {
    setAcao(acaoEscolhida);
    setShowPasswordModal(true);
  };

  // Reautenticar e executar ação
  const reauthenticateAndProceed = async () => {
    const user = auth.currentUser;
    if (!user || !password) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      setShowPasswordModal(false);

      // → Atualizar email
      if (acao === "email") {
        try {
          await atualizarEmailUsuario(novoEmail, password);
          alert("Email atualizado com sucesso! Confirme no seu Gmail e Faça login novamente.");
          navigate("../Login"); // redireciona para Login
        } catch (err: any) {
          alert(err.message);
        }
      }

      // → Excluir conta
      if (acao === "delete") {
        setShowConfirmModal(true);
      }
    } catch (err) {
      alert("Senha incorreta. Tente novamente.");
    }
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    try {
      await excluirContaUsuario(password);
      alert("Conta excluída com sucesso!");
      navigate("../Login");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <section className="h-[100vh] flex flex-col items-center justify-center">
      <Link
        className="absolute top-8 left-8 bg-gray-500 text-white p-3 rounded"
        to="/home"
      >
        Voltar
      </Link>

      <div className="flex flex-col items-center gap-4 mt-[-200px]">
        <div className="w-20 h-20 bg-gray-300 flex items-center justify-center rounded-full">
          img
        </div>

        <p>Email atual: {email}</p>

        <input
          type="email"
          placeholder="Novo email"
          className="border p-2 rounded w-64"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
          onClick={() => openPasswordModal("email")}
        >
          Atualizar Email
        </button>

        <button
          className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer"
          onClick={() => openPasswordModal("delete")}
        >
          Excluir conta
        </button>
      </div>

      {/* ===== MODAL DE SENHA ===== */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-80 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Digite sua senha</h2>

            <input
              type="password"
              placeholder="Senha"
              className="border p-2 rounded w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
              onClick={reauthenticateAndProceed}
            >
              Continuar
            </button>

            <button
              className="text-gray-600 underline cursor-pointer"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ===== MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded shadow-lg w-80 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-red-600">
              Tem certeza disso?
            </h2>
            <p>Esta ação excluirá sua conta permanentemente.</p>

            <button
              className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer"
              onClick={handleConfirmDelete}
            >
              Sim, excluir
            </button>

            <button
              className="text-gray-600 underline cursor-pointer"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
