import * as S from "./style";
import { useState } from "react";
import { signUp } from "../../services/login";
import Title from "../Title";

const BlockSignUp = () => {
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
      const userCredential = await signUp(email, password);
      console.log("Usuário cadastrado:", userCredential.user);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <S.AreaLogin>
      <Title title="Cadastro" />

      <S.Credencial
        placeholder="Digite seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        
      />

      <S.Credencial
        placeholder="Crie uma senha"
        value={password}
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <S.Credencial
        placeholder="Confirmar senha"
        value={confirmPassword}
        type="password"
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <S.Button onClick={handleSignUp}>
        Cadastrar
      </S.Button>

      {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
    </S.AreaLogin>
  );
};

export default BlockSignUp;
