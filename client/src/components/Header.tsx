import { Bell, Shield, LogOut, Settings, X, Clock } from 'lucide-react';
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
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

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
  const { permission, isSupported, requestPermission, isLoading, notifications, removeNotification } = useNotifications();
  const testNotificationMutation = trpc.notifications.test.useMutation();

  // Verifica notificações automaticamente a cada 10 segundos
  useEffect(() => {
    if (permission === 'granted') {
      // Função para verificar notificações
      const checkNotifications = () => {
        testNotificationMutation.mutate(undefined, {
          onSuccess: (response) => {
            const result = response?.json || response;
            if (result?.success && result?.sent > 0) {
              console.log('[Header] Notificações verificadas automaticamente:', result);
            }
          },
          onError: (error) => {
            console.error('[Header] Erro ao verificar notificações automaticamente:', error);
          },
        });
      };

      // Executa imediatamente após um pequeno delay para garantir inicialização
      const initialTimer = setTimeout(() => {
        checkNotifications();
      }, 2000);

      // Configura intervalo para executar a cada 10 segundos
      const interval = setInterval(() => {
        checkNotifications();
      }, 10000); // 10 segundos

      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    }
  }, [permission]); // Executa sempre que a permissão mudar

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {permission === 'granted' && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-hidden flex flex-col">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {!isSupported ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  Seu navegador não suporta notificações push
                </div>
              ) : permission === 'granted' ? (
                <>
                  {/* Lista de Notificações */}
                  {notifications.length > 0 && (
                    <>
                      <div className="px-2 py-2 flex items-center justify-between border-b">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Notificações ({notifications.length})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            notifications.forEach((n) => removeNotification(n.id));
                          }}
                        >
                          Limpar todas
                        </Button>
                      </div>
                      <div className="overflow-y-auto max-h-[300px]">
                        <div className="space-y-1 px-2 py-2">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground mb-1">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                                    {notification.body}
                                  </p>
                                  {notification.data?.activityTitle && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <span className="font-medium">Atividade:</span> {notification.data.activityTitle}
                                    </div>
                                  )}
                                  {notification.data?.courseName && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <span className="font-medium">Disciplina:</span> {notification.data.courseName}
                                    </div>
                                  )}
                                  {notification.data?.dueDate && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      <span className="font-medium">Prazo:</span>{' '}
                                      {new Date(parseInt(notification.data.dueDate)).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(notification.timestamp), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => removeNotification(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativado
                      </Badge>
                    </div>
                    <p>Você receberá notificações sobre atividades próximas do prazo no <b>seu e-mail</b>.</p>
                    <p className="text-xs mt-2">As notificações são verificadas automaticamente a cada 10 segundos.</p>
                  </div>
                </>
              ) : permission === 'denied' ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  <p className="mb-2">Notificações bloqueadas pelo navegador.</p>
                  <p className="text-xs">Para ativar, acesse as configurações do navegador.</p>
                </div>
              ) : (
                <div className="px-2 py-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>Ative as notificações para receber avisos sobre atividades próximas do prazo.</p>
                  </div>
                  <Button
                    onClick={requestPermission}
                    disabled={isLoading}
                    className="w-full"
                    size="sm"
                  >
                    {isLoading ? 'Ativando...' : 'Ativar Notificações'}
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
            <DropdownMenuContent align="end" className="min-w-[280px] max-w-[360px]">
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
