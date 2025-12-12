import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

export default function BlockLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      setError("");
      navigate("/home");
    } catch (err) {
      setError("Email ou senha incorreta");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 justify-center">

      <h1 className="text-[24px] text-black font-bold">Login</h1>

      <input
        placeholder="Email"
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
      />

      <input
        placeholder="Senha"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
      />

      <button
        onClick={handleLogin}
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
        "
      >
        Entrar
      </button>

      {error && (
        <p className="text-red-500 text-[14px]">{error}</p>
      )}
    </div>
  );
}
