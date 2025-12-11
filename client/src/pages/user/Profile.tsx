import MainLayout from "@/components/MainLayout";
import { useState } from "react";
import { Pen, Camera } from "lucide-react"
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import { changeName, requestEmailUpdate, reauthenticateUser } from './useUserServices';

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase();
};
export default function Security() {
    const { userData, logout } = useFirebaseAuth();
    const [photo, setPhoto] = useState<string | null>(null);
    const [name, setName] = useState<string>(userData?.name || '');
    const [email, setEmail] = useState<string>(userData?.email || '');
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [password, setPassword] = useState<string>('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const handleSave = async () => {
      setError(null);
      setSuccess(null);
      setLoading(true);

      try {
        let emailChanged = false;

        // If email changed, require reauthentication
        if (email !== userData?.email) {
          if (!password) {
            setShowPasswordInput(true);
            setLoading(false);
            return;
          }

          // Reauthenticate user
          await reauthenticateUser(password);

          // Update email
          await requestEmailUpdate(email);
          emailChanged = true;
          setPassword('');
          setShowPasswordInput(false);
        }

        // If name changed
        if (name !== userData?.name) {
          await changeName(name);
        }

        if (emailChanged) {
          setSuccess(`Email de verificacao enviado para ${email}. Por favor, verifique sua caixa de entrada para confirmar a mudanca.`);
        } else {
          setLocation('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao salvar alteracoes');
      } finally {
        setLoading(false);
      }
    }
    return(
        <MainLayout>
            <div className="flex flex-col items-center justify-center h-full">
                <Avatar className="w-32 h-32 border">
                    <AvatarImage src={userData?.photoURL ?? undefined} alt={userData?.name} />
                    <AvatarFallback className="text-4xl">
                    {userData?.name ? getInitials(userData.name) : 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col w-full max-w-md mx-auto gap-4">
                    {error && (
                        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-2 bg-green-100 border border-green-400 text-green-700 rounded">
                            {success}
                        </div>
                    )}
                    <p>Nome</p>
                    <div className="relative">
                        <Input className="bg-gray-300 border border-gray-500" type="text" value={name} onChange={e => setName(e.target.value)} disabled={loading}/>
                        <Pen
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 "/>
                    </div>
                    <p>Email</p>
                    <div className="relative">
                        <Input className="bg-gray-300 border border-gray-500" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}/>
                        <Pen
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2"/>
                    </div>
                    {showPasswordInput && (
                        <div>
                            <p>Senha (obrigatoria para alterar email)</p>
                            <Input 
                                className="bg-gray-300 border border-gray-500" 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                disabled={loading}
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <Button className="w-30 mr-10 font-bold text-xs" onClick={handleSave} disabled={loading}>
                            {loading ? 'SALVANDO...' : 'SALVAR'}
                        </Button>
                        <Button className="bg-white text-slate-900 border border-gray w-30 hover:bg-gray-100 font-bold text-xs"
                        onClick={() => setLocation("/dashboard")}
                        disabled={loading}>
                            VOLTAR
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}