import { useEffect, useState } from "react";
import * as S from "./styled";
import BlockLogin from "../../components/BlockLogin";
import BlockSignUp from "../../components/BlockSignUp";
import { AnimatePresence, motion } from "framer-motion";


export default function Login() {

  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    localStorage.removeItem('token')
  },[])

  return (
    <S.ContentLogin>
      <S.Container>
        <S.Presentation>
          <div>
            <S.TitleLogin>AgendaAe</S.TitleLogin>
          </div>
          <S.AreaTextPresentation>
            {/* <S.TextPresentation>Relato de problemas</S.TextPresentation> */}
            <S.TextPresentation>Gerencie seu tempo</S.TextPresentation>
            <S.TextPresentation>Organize suas tarefas</S.TextPresentation>
            <S.TextPresentation>Simplifique seus prazos</S.TextPresentation>
          </S.AreaTextPresentation>
        </S.Presentation>

        <S.Content>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BlockLogin />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BlockSignUp />
              </motion.div>
            )}
          </AnimatePresence>

          <S.AreaText>
            <S.Text>
              {isLogin ? "Ainda não possui conta?" : "Já possui conta?"}
            </S.Text>
            <S.ToggleButton onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Cadastre-se" : "Entrar"}
            </S.ToggleButton>
          </S.AreaText>
        </S.Content>
      </S.Container>
    </S.ContentLogin>
  );
}
