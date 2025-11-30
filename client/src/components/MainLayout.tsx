import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { userData, loading } = useFirebaseAuth(); 
  const [, setLocation] = useLocation();


  useEffect(() => {
    if (!loading && !userData) {
      setLocation('/');
    }
  }, [loading, userData, setLocation]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header className="bg-white border-b border-slate-200 px-6 py-4" />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
