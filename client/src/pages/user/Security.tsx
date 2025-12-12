import { useState } from "react";
import { useLocation } from "wouter";
import MainLayout from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { reauthenticateUser, changePassword , deleteAccount} from "./useUserServices";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Security() {
  const { signOut } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("Preencha todos os campos.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }
    if (newPassword.length < 8) {
      return toast.error("A senha deve ter ao menos 8 caracteres.");
    }

    try {
      // Reautenticação com a senha atual
      await reauthenticateUser(currentPassword);

      // Alterar senha
      await changePassword(newPassword);
      toast.success("Senha alterada com sucesso. Faça login novamente.");

      // Limpar campos e fazer logout
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await signOut();
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha.");
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      return toast.error("Digite sua senha para confirmar.");
    }
    try {
      // Reautenticação com a senha atual
      await reauthenticateUser(deletePassword);
      // Excluir conta
      await deleteAccount();
      toast.success("Conta excluída com sucesso.");
      await signOut();
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir conta.");
    }
  };

  const openDeleteFlow = () => {
    setIsDeleteConfirmOpen(true);
  };

  return (
    <MainLayout>
      <div className=" h-[90%] text-slate-900">
        <h1 className="text-2xl mb-4">Alterar senha</h1>
        <p>Senha atual</p>
        <Input
          placeholder="Sua senha atual"
          className="font-bold"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <p>Nova senha</p>
        <Input
          placeholder="Digite sua nova senha (no mínimo 8 caracteres, contendo letras e números)"
          className="font-bold"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p>Confirmar senha</p>
        <Input
          placeholder="Digite novamente a nova senha"
          className="font-bold"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button className="mt-4 w-30 mr-10 font-bold text-xs" onClick={handleSave}>
          SALVAR
        </Button>
        <Button className="bg-white text-slate-900 border border-gray w-30 hover:bg-gray-100 font-bold text-xs" onClick={() => setLocation("/dashboard")}>
          VOLTAR
        </Button>
      </div>
      <div className="w-full border-t">
        <Button className="bg-red-500 w-30 font-bold text-xs mt-4"
          variant={"destructive"}
          onClick={openDeleteFlow}>
          EXCLUIR CONTA
        </Button>
      </div>
        <div className="">
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-white text-center font-bold">Confirmar exclusão</DialogTitle>
              <DialogDescription className="text-white text-center">
                Tem certeza que deseja excluir sua conta?<br />
                Esta ação é irreversível.
              </DialogDescription>
            </DialogHeader>
            <div className="">
              <Input
                type="password"
                value={deletePassword}
                placeholder="Digite sua senha para confirmar"
                className="bg-white font-bold"
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <Button
                className="bg-white text-slate-900 border border-gray font-bold text-xs w-40"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                CANCELAR
              </Button>
              <Button
                variant="destructive"
                className="font-bold text-xs w-40"
                onClick={handleDeleteAccount}
              >
                EXCLUIR CONTA
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout> 
  );
}