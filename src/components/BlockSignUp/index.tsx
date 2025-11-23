import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { signUp } from "../../services/login";
import Title from "../Title";

export default function BlockSignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    try {
      // Preferência: usar service signUp da main (centralizado)
      const userCredential = await signUp(email, password);

      console.log("Usuário cadastrado:", userCredential.user);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      {/* TÍTULO IGUAL AO LOGIN */}
      <h2 className="text-center text-sm font-bold text-[#1A1A1A] mb-4">
        CADASTRO
      </h2>

      {/* INPUTS IGUAIS AO LOGIN */}
      <input
        placeholder="Digite seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full h-10 bg-[#E5E5E5] px-3 rounded-md mb-3 text-sm"
      />

      <input
        placeholder="Crie uma senha"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full h-10 bg-[#E5E5E5] px-3 rounded-md mb-3 text-sm"
      />

      <input
        placeholder="Confirmar senha"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full h-10 bg-[#E5E5E5] px-3 rounded-md mb-5 text-sm"
      />

      {/* BOTÃO IGUAL AO LOGIN */}
      <button
        onClick={handleSignUp}
        className="w-full h-10 bg-[#0B1126] text-white rounded-md text-sm font-semibold hover:opacity-90 transition cursor-pointer"
      >
        CADASTRAR
      </button>

      {/* ERRO IGUAL ESTILO DO PROJETO */}
      {error && (
        <p className="text-red-600 text-[14px] mt-3 font-semibold text-center">
          Email e/ou senha inválidos
        </p>
      )}
    </div>
  );
}
