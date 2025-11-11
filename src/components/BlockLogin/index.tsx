import * as S from "./style";
import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import Title from "../Title";


const BlockLogin = () => {
    const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [error, setError] = useState("");

      const navigate = useNavigate()

      const handleLogin = async () => {
          try {
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              console.log("Usuário logado:", userCredential.user);
              const token = await userCredential.user.getIdToken()
              localStorage.setItem('token', token)
              setError("");
              navigate("/home")
            } catch (err: any) {
              setError(err.message);
              console.log(err.mesage)
            }
      }

    return(
        <S.AreaLogin>
            <Title title="Login"/>
            <S.Credencial
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} />
            <S.Credencial
                placeholder="Senha" 
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}/>

            <S.Button onClick={() => handleLogin()}>
                Entrar
            </S.Button>
            {error && <S.ErrorMessage>Email ou senha incorreta</S.ErrorMessage>}
        </S.AreaLogin>
    )

}


export default BlockLogin