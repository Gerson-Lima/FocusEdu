import { useState } from 'react'
import type { ButtonType } from '../../constants/buttons'
// Nota: 'Buttons' está sendo substituído por uma estrutura que inclui ícones
import { useNavigate } from 'react-router-dom' 
import ExitConfirm from '../ExitConfirm'
import { AnimatePresence, motion } from "framer-motion";

import Logo from '../../assets/logo.svg' // Logo (Ícone + Texto)
import Arrow from '../../assets/arrow.svg' // Seta de Recolhimento
import DashboardIcon from '../../assets/dashboard.svg' 
import ActivitiesIcon from '../../assets/minhasAtividades.svg' 
import KanbanIcon from '../../assets/kanban.svg' 
import HistoryIcon from '../../assets/historico.svg' 

// Você deve definir esta estrutura de forma permanente em 'constants/buttons.ts'
const menuItems = [
    { name: 'Dashboard' as ButtonType, icon: DashboardIcon },
    { name: 'Minhas Atividades' as ButtonType, icon: ActivitiesIcon }, // Use o ícone correto aqui
    { name: 'Quadro Kanban' as ButtonType, icon: KanbanIcon },    // Use o ícone correto aqui
    { name: 'Histórico' as ButtonType, icon: HistoryIcon },         // Usado para testar o item 'Histórico'
];


type MenuProps = {
  active: ButtonType;
  setActive: (active: ButtonType) => void;
}

export const Menu = ({ active, setActive }: MenuProps) => {
  // Removido const buttons: ButtonType[] = [...Buttons];
  const [exit, setExit] = useState(true)
  const navigate = useNavigate()

  function handleToLogin() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  function handleNavigation(button: ButtonType) {
      setActive(button);
      // Lógica de navegação:
      if (button === 'Histórico') navigate("/report");
      // Adicione outras navegações (ex: Dashboard, Minhas Atividades, etc.)
  }

  return (
    // 1. Container: Removido border-r, shadow-sm e rounded-r-2xl. Ajuste de cor e largura.
    <div className="bg-primary p-6 w-[250px] md:w-[300px] sm:w-[180px] h-full flex flex-col justify-between border-r shadow-sm rounded-r-2xl">

      {/* Título e Botões */}
      <div className='flex flex-col gap-6'>
        
        {/* 2. Logo Centralizada e Estilizada */}
          <div className='flex items-center justify-center mb-0 mt-4'> 
              <img 
                  src={Logo} 
                  alt="Logo FocusEdu" 
                  className="w-30 h-auto" 
              />
          </div>

        {/* Botões do Menu */}
        {/* 3. Ajuste de espaçamento e uso da lista com ícones (menuItems) */}
        <div className="flex flex-col gap-2 mt-6 items-start">
          {menuItems.map((item) => (
            <div
              key={item.name}
              // Toda a área é clicável
              onClick={() => handleNavigation(item.name)} 
              className={`
                flex items-center gap-4 w-full cursor-pointer transition-colors
                //Fundo cinza/escuro para o item ativo (simulando "bg-secondary-dark")
                ${active === item.name ? "bg-secondary-dark" : "hover:bg-white hover:bg-opacity-10"}
              `}
            >
              
              {/* Indicador Ativo (Barra Ciano) */}
              <div
                className={`
                w-1 h-6 bg-cyan rounded-r-2xl
                ${active === item.name ? "block" : "hidden"}
              `}
              />

              {/* 4. ÍCONE e TEXTO: Agrupados com padding vertical. */}
              <div className="flex items-center gap-3 py-3 flex-grow">
                <img 
                  src={item.icon} 
                  alt={`${item.name} icon`} 
                  className={`
                    w-5 h-5 
                    ${active === item.name ? 'text-white' : 'text-gray-400'}
                  `}
                />
                
                <button
                  // O botão aqui é apenas o texto, já que o clique está no <div> pai.
                  className={`
                    text-left bg-transparent text-base transition-colors flex-grow
                    ${active === item.name ? "font-bold text-white" : "text-gray-400"}
                  `}
                >
                  {item.name}
                </button>
              </div>
            </div>
          ))}

          {/* O bloco de "Histórico" original foi removido pois agora está incluído em menuItems. */}
          
        </div>
      </div>

      {/* Área de Sair/Recolher */}
      {/* 5. Alinhamento da Seta: justify-center mudado para justify-start. */}
      <div className="flex items-end py-10 w-full"> 
        <AnimatePresence mode="wait">
          {exit ? (
            <motion.div
              key="exitButton"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-start" // Alinha a seta à esquerda
            >
              <button
                onClick={() => setExit(false)} 
                className='p-3 cursor-pointer'
              >
                <img src={Arrow} alt="Seta de recolher" className="inline-block" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="confirmPopup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-start" // Alinha a popup à esquerda
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
