import { useState } from "react";
import { useLocation } from "wouter";
import MainLayout from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { reauthenticateUser, changePassword, deleteAccount } from "./useUserServices";
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
      await reauthenticateUser(currentPassword);
      await changePassword(newPassword);

      toast.success("Senha alterada com sucesso. Faça login novamente.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await signOut();
      setLocation("/");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar senha.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return toast.error("Digite sua senha para confirmar.");

    try {
      await reauthenticateUser(deletePassword);
      await deleteAccount();

      toast.success("Conta excluída com sucesso.");

      await signOut();
      setLocation("/");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir conta.");
    }
  };

  return (
    <MainLayout>
      <div className="w-full">
        <Card className="w-full border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Segurança</CardTitle>
            <p className="text-sm text-muted-foreground">
              Atualize sua senha. Para ações sensíveis, o Firebase exige reautenticação.
            </p>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite novamente a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Dica: use letras, números e um símbolo para aumentar a segurança.
                </p>
              </div>
            </div>

            {/* Zona perigosa (dentro do card, separada e elegante) */}
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium text-red-700">Excluir conta</p>
                  <p className="text-sm text-red-700/80">
                    Esta ação é irreversível. Você perderá acesso aos seus dados.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeletePassword("");
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  EXCLUIR CONTA
                </Button>
              </div>
            </div>
          </CardContent>

          {/* Footer com padding (igual padrão) */}
          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                VOLTAR
              </Button>
              <Button onClick={handleSave}>SALVAR</Button>
            </div>
          </div>
        </Card>

        {/* Dialog confirmar exclusão */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir sua conta? Esta ação é irreversível.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="deletePassword">Senha</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                placeholder="Digite sua senha para confirmar"
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                CANCELAR
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                EXCLUIR CONTA
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
