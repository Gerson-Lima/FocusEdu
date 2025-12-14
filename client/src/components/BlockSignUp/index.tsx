// src/components/BlockSignUp/index.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { signUp } from "../../services/auth";

export default function BlockSignUp() {
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      setError("Informe seu nome");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userCredential = await signUp(email, password, name);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      setLocation("/dashboard");
    } catch (err: any) {
      console.error(err);

      switch (err.code) {
        case "auth/weak-password":
          setError("Senha precisa ter no mínimo 6 caracteres");
          break;

        case "auth/email-already-in-use":
          setError("Este e-mail já está em uso");
          break;

        case "auth/invalid-email":
          setError("E-mail inválido");
          break;

        default:
          setError("Erro ao criar conta");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 justify-center">
      <h1 className="text-[24px] text-[var(--primary)] font-bold">
        Criar conta
      </h1>

      {/* Campo Nome */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="signup-name"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          Nome
        </label>
        <input
          id="signup-name"
          placeholder="Ex.: João"
          value={name}
          onChange={e => setName(e.target.value)}
          className="
            w-full
            text-[16px]
            p-3
            rounded-lg
            bg-[#E5E5E5]
            focus:bg-white
            focus:outline-2
            focus:outline-[#0F172A]
            focus:outline-offset-2
          "
          disabled={loading}
        />
      </div>

      {/* Campo E-mail */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="signup-email"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          E-mail
        </label>
        <input
          id="signup-email"
          placeholder="exemplo@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="
            w-full
            text-[16px]
            p-3
            rounded-lg
            bg-[#E5E5E5]
            focus:bg-white
            focus:outline-2
            focus:outline-[#0F172A]
            focus:outline-offset-2
          "
          disabled={loading}
        />
      </div>

      {/* Campo Senha */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="signup-password"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          Senha
        </label>
        <input
          id="signup-password"
          placeholder="••••••••••••"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="
            w-full
            text-[16px]
            p-3
            rounded-lg
            bg-[#E5E5E5]
            focus:bg-white
            focus:outline-2
            focus:outline-[#0F172A]
            focus:outline-offset-2
          "
          disabled={loading}
        />
      </div>

      {/* Campo Confirmar Senha */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="signup-confirm-password"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          Confirmar senha
        </label>
        <input
          id="signup-confirm-password"
          placeholder="••••••••••••"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="
            w-full
            text-[16px]
            p-3
            rounded-lg
            bg-[#E5E5E5]
            focus:bg-white
            focus:outline-2
            focus:outline-[#0F172A]
            focus:outline-offset-2
          "
          disabled={loading}
        />
      </div>

      <button
        onClick={handleSignUp}
        disabled={loading}
        className="
          w-full
          p-3
          rounded-lg
          text-[18px]
          font-bold
          bg-[#0F172A]
          text-white
          cursor-pointer
          hover:opacity-90
          disabled:opacity-60
        "
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      {error && <p className="text-red-500 text-[14px]">{error}</p>}
    </div>
  );
}
