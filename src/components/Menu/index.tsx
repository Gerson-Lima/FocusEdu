import * as S from './style'
import { useState } from 'react' 
import type { ButtonType } from '../../constants/buttons'
import { Buttons } from '../../constants/buttons'
import { useNavigate } from 'react-router-dom'
import ExitConfirm from '../ExitConfirm'
import { AnimatePresence, motion } from "framer-motion";

type MenuProps = {
  active: ButtonType;
  setActive: (active: ButtonType) => void;
}

export const Menu = ({ active, setActive }: MenuProps) => {
  const buttons: ButtonType[] = [...Buttons];

  const [exit, setExit] = useState(true)

  const navigate = useNavigate()

  function handleToLogin(){
    localStorage.removeItem("token")
    navigate("/login")
  }
  function handleReport(){
    navigate("/report")
  }

  function handleToConfirm(){
    setExit(!exit)
  }
  return (
    <S.Container>
      <S.Content>
       <S.TitleMenu>AgendaAe</S.TitleMenu>
        <S.AreaButton>
          {buttons.map((button) => (
            <S.Text
              key={button}
              onClick={() => setActive(button)}
              style={{ fontWeight: active === button ? 'bold' : 'normal', color: active === button ? '#000' : '#b0b0b0' }}
            >
              {button}
            </S.Text>
          ))}
          <S.ButtonReport onClick={handleReport}>Histórico </S.ButtonReport>
        </S.AreaButton>
      </S.Content>
        <S.ExitArea>
             <AnimatePresence mode="wait">
            {exit ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                 <S.ButtonExit onClick={() => handleToConfirm()}>
            Sair
          </S.ButtonExit>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                 <ExitConfirm 
                 exit={() => handleToLogin()}
                 noExit={() => setExit(!exit)}/>
              </motion.div>
            )}
          </AnimatePresence>
         
        </S.ExitArea>
    </S.Container>
  );
}
