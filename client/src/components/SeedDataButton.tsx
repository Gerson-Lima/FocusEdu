import { useState } from 'react';
import { Button } from './ui/button';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import { activitiesService } from '@/hooks/useActivities';
import { toast } from 'sonner';
import { Loader2, Database } from 'lucide-react';

export function SeedDataButton() {
  const { userData } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    if (!userData) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!confirm('Isso criará dados de exemplo. Deseja continuar?')) {
      return;
    }

    setLoading(true);

    try {
      await activitiesService.generateSampleData(userData.uid);
      toast.success('Dados de exemplo criados com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar dados:', error);
      toast.error('Erro ao criar dados de exemplo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeedData}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Criando...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Gerar Dados de Exemplo
        </>
      )}
    </Button>
  );
}
