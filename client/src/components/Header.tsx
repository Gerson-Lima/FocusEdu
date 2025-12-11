import { Bell, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface HeaderProps {
  className?: string;
}

// mapa de títulos por rota
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '',             
  '/activities': 'Minhas Atividades',
  '/kanban': 'Quadro Kanban',
  '/history': 'Histórico',
  '/security': 'Segurança',
  '/profile': 'Meu Perfil',
};

export default function Header({ className }: HeaderProps) {
  const { userData, logout } = useFirebaseAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      setLocation('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const firstName = userData?.name?.trim().split(' ')[0] || 'aluno(a)';
  const currentTitle = PAGE_TITLES[location] || '';

  return (
    <header className={className}>
      <div className="flex items-center justify-between gap-4">
        {/* ESQUERDA: boas-vindas no dashboard, título nas outras páginas */}
        <div className="flex-1">
          {location === '/dashboard' ? (
            <div className="flex flex-col">
            <p className="mt-1 text-2xl font-extrabold leading-tight md:text-2xl text-slate-900">
              Olá,{' '}
              {firstName
                ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
                : ''}
              !
            </p>


            </div>
          ) : (
            currentTitle && (
              <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-2xl text-slate-900">
                {currentTitle}
              </h1>
            )
          )}
        </div>

        {/* DIREITA: notificações + usuário */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={userData?.photoURL ?? undefined} alt={userData?.name} />
                  <AvatarFallback>
                    {userData?.name ? getInitials(userData.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel
              className="cursor-pointer"
              onClick={() => setLocation('/profile')}
              >
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage src={userData?.photoURL ?? undefined} alt={userData?.name} />
                      <AvatarFallback>
                      {userData?.name ? getInitials(userData.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p>Meu Perfil</p>
                      <p className="text-xs leading-none text-muted-foreground">
                      {userData?.email}
                      </p>
                    </div>
                    </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setLocation('/security')}
                className="cursor-pointer"
              >
              <Shield />
               Segurança
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="text-black" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
