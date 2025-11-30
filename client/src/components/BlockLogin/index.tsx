// src/components/BlockLogin/index.tsx
import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";

// ajusta os paths conforme onde você salvou os SVGs
import EyeShow from "@/assets/eye-password-show-svgrepo-com.svg";
import EyeHide from "@/assets/eye-password-hide-svgrepo-com.svg";

export default function BlockLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [, setLocation] = useLocation();
  const { signIn } = useFirebaseAuth();

  const handleLogin = async (event?: FormEvent) => {
    event?.preventDefault();

    try {
      setLoading(true);
      setError("");

      await signIn(email, password);
      setLocation("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Email ou senha incorreta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex w-full flex-col items-center gap-4 justify-center"
    >
      <h1 className="text-[24px] text-[var(--primary)] font-bold">Login</h1>

      {/* Campo Email */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          E-mail
        </label>
        <input
          id="email"
          placeholder="exemplo@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      {/* Campo Senha + botão de olho */}
      <div className="w-full flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-[14px] font-medium text-[var(--primary)]"
        >
          Senha
        </label>

        <div className="relative">
          <input
            id="password"
            placeholder="••••••••••••"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full
              text-[16px]
              p-3
              pr-11
              rounded-lg
              bg-[#E5E5E5]
              focus:bg-white
              focus:outline-2
              focus:outline-[#0F172A]
              focus:outline-offset-2
            "
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute
              inset-y-0
              right-3
              flex
              items-center
              justify-center
              text-[#6B7280]
              hover:text-[#111827]
              transition
            "
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            <img
              src={showPassword ? EyeHide : EyeShow}
              alt={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
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
        {loading ? "Entrando..." : "Entrar"}
      </button>

      {error && (
        <p className="text-red-500 text-[14px]">Email ou senha inadequados</p>
      )}
    </form>
  );
}
