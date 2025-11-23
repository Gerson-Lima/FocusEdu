import { useState } from 'react'
import type { ButtonType } from '../../constants/buttons'
import { Buttons } from '../../constants/buttons'
import { useNavigate } from 'react-router-dom'
import ExitConfirm from '../ExitConfirm'
import { AnimatePresence, motion } from "framer-motion";

import Logo from '../../assets/logo.svg'
import Arrow from '../../assets/arrow.svg'

type MenuProps = {
  active: ButtonType;
  setActive: (active: ButtonType) => void;
}

export const Menu = ({ active, setActive }: MenuProps) => {
  const buttons: ButtonType[] = [...Buttons];
  const [exit, setExit] = useState(true)
  const navigate = useNavigate()

  function handleToLogin() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  function handleReport() {
    navigate("/report")
  }

  return (
    <div className="bg-primary p-6 w-[250px] md:w-[300px] sm:w-[180px] h-full flex flex-col justify-between border-r shadow-sm rounded-r-2xl">

      {/* Título */}
      <div className='flex flex-col gap-6'>
        <img src={Logo} alt="Logo" className="w-40 h-auto mx-auto mb-6 mt-2" />

        {/* Botões do Menu */}
        <div className="flex flex-col gap-12 mt-6 items-start">
          {buttons.map((button) => (
            <div
              key={button}
              className="flex items-center gap-2"
            >
              <div
                className={`
        w-1 h-5 bg-cyan rounded-r-2xl
        ${active === button ? "block" : "hidden"}
      `}
              />

              <button
                onClick={() => setActive(button)}
                className={`
        text-left bg-transparent text-base transition-colors cursor-pointer
        ${active === button ? "font-bold text-white" : "text-gray"}
      `}
              >
                {button}
              </button>
            </div>
          ))}


          <button
            onClick={handleReport}
            className="bg-transparent text-gray font-bold rounded-md text-base cursor-pointer items-start"
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Área de Sair */}
      <div className="flex items-center justify-center py-10 w-full">
        <AnimatePresence mode="wait">
          {exit ? (
            <motion.div
              key="exitButton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <button
                onClick={() => setExit(false)} className='p-3 cursor-pointer'
              >
                <img src={Arrow} alt="Seta de sair" className="inline-block mr-2 mb-1" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="confirmPopup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              <ExitConfirm
                exit={handleToLogin}
                noExit={() => setExit(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
