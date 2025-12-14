import MainLayout from "@/components/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Pen } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useFirebaseAuth } from "@/contexts/MockAuthContext";
import { changeName, requestEmailUpdate, reauthenticateUser } from "./useUserServices";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
};

export default function Security() {
  const { userData } = useFirebaseAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState<string>(userData?.name || "");
  const [email, setEmail] = useState<string>(userData?.email || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [password, setPassword] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    setName(userData?.name || "");
    setEmail(userData?.email || "");
  }, [userData?.name, userData?.email]);

  const initials = useMemo(() => {
    return userData?.name ? getInitials(userData.name) : "U";
  }, [userData?.name]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let emailChanged = false;

      // Email mudou => reauth obrigatório
      if (email !== userData?.email) {
        if (!password) {
          setShowPasswordInput(true);
          setLoading(false);
          return;
        }

        await reauthenticateUser(password);
        await requestEmailUpdate(email);

        emailChanged = true;
        setPassword("");
        setShowPasswordInput(false);
      }

      // Nome mudou
      if (name !== userData?.name) {
        await changeName(name);
      }

      if (emailChanged) {
        setSuccess(
          `Email de verificacao enviado para ${email}. Por favor, verifique sua caixa de entrada para confirmar a mudanca.`
        );
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar alteracoes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Card className="w-full border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Segurança</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize seu nome e solicite alteração de email (com reautenticação).
          </p>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="w-full">
            <div className="flex flex-col lg:flex-row items-center gap-10 w-full">
              {/* Avatar / resumo */}
              <div className="flex flex-col items-center gap-4 w-full lg:w-[150px] shrink-0">
                <Avatar className="h-24 w-24 border border-slate-200 bg-white">
                  <AvatarImage src={userData?.photoURL ?? undefined} alt={userData?.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>

                <div className="text-center">
                  <p className="font-medium leading-tight">{userData?.name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{userData?.email || "—"}</p>
                </div>
              </div>

              {/* Form ocupa TODO o resto */}
              <div className="flex-1 w-full min-w-0 space-y-6">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="pr-10 w-full"
                      />
                      <Pen
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao mudar o nome e salvar, você precisará relogar para alterá-lo.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="pr-10 w-full"
                      />
                      <Pen
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ao alterar o email, você precisará confirmar via link enviado para o novo endereço.
                    </p>
                  </div>
                </div>

                {/* Senha (condicional) */}
                {showPasswordInput && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha (obrigatória para alterar email)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        disabled={loading}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Isso é exigência do Firebase para reautenticar antes de mudar o email.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setLocation("/dashboard")} disabled={loading}>
              CANCELAR
            </Button>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? "SALVANDO..." : "SALVAR"}
            </Button>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
}
