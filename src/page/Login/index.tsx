import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BlockLogin from "../../components/BlockLogin";
import BlockSignUp from "../../components/BlockSignUp";
import Logo from "../../assets/logo.svg";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  return (
    <div className="flex justify-between h-screen w-full overflow-hidden bg-[#0F172A]">

      {/* LEFT IMAGE */}
      <div className="relative w-[40%] h-full bg-[#0F172A]">
        <img
          src="/src/assets/login-bg.png"
          className="w-full h-full object-cover rounded-br-[200px]"
        />
      </div>

      {/* MIDDLE BLUE SECTION */}
      <div className="w-[30%] h-full bg-[#0F172A] relative flex flex-col justify-between px-10">

        <div className="flex flex-col items-end mt-10">
          <img src={Logo} className="h-24 mt-12" />
        </div>

        <div className="text-white text-lg font-semibold space-y-5 mb-16 text-right pr-6">
          <p>Gerencie seu tempo</p>
          <p>Organize suas tarefas</p>
          <p>Simplifique seus prazos</p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="w-[30%] h-full bg-[#EFEFEF] flex flex-col justify-center items-end px-28">

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* LOGIN REAL */}
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

        {/* TOGGLE */}
        <p className="mt-6 text-[11px] text-black font-semibold text-center">
          {isLogin ? "Ainda não possui uma conta?" : "Já possui uma conta?"}{" "}
          
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold underline underline-offset-2 decoration-black hover:opacity-80 cursor-pointer"
          >
            {isLogin ? "Cadastre-se" : "Fazer login"}
          </button>
        </p>

      </div>
    </div>
  );
}
