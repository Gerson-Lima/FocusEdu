import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProvider } from "@/lib/trpc";

import Login from "./pages/Login/index";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Kanban from "./pages/Kanban";
import History from "./pages/History";
import Security from "./pages/user/Security";
import Profile from "./pages/user/Profile";
import { useFirebaseAuth } from "@/contexts/MockAuthContext";

const AUTH_HOME = "/dashboard";
const LOGIN_PATH = "/";

function PublicOnly(Component: React.ComponentType<any>) {
  return function PublicOnlyWrapped(props: any) {
    const { currentUser, loading } = useFirebaseAuth() as any;
    const [location, setLocation] = useLocation();

    useEffect(() => {
      if (!loading && currentUser && location === LOGIN_PATH) {
        setLocation(AUTH_HOME, { replace: true });
      }
    }, [currentUser, loading, location, setLocation]);

    if (loading) return null;

    if (currentUser && location === LOGIN_PATH) return null;

    return <Component {...props} />;
  };
}

function Protected(Component: React.ComponentType<any>) {
  return function ProtectedWrapped(props: any) {
    const { currentUser, loading } = useFirebaseAuth() as any;
    const [location, setLocation] = useLocation();

    useEffect(() => {
      if (!loading && !currentUser && location !== LOGIN_PATH) {
        setLocation(LOGIN_PATH, { replace: true });
      }
    }, [currentUser, loading, location, setLocation]);

    if (loading) return null;

    if (!currentUser && location !== LOGIN_PATH) return null;

    return <Component {...props} />;
  };
}

function Router() {
  return (
    <Switch>
      <Route path={LOGIN_PATH} component={PublicOnly(Login)} />
      <Route path="/dashboard" component={Protected(Dashboard)} />
      <Route path="/activities" component={Protected(Activities)} />
      <Route path="/kanban" component={Protected(Kanban)} />
      <Route path="/history" component={Protected(History)} />
      <Route path="/security" component={Protected(Security)} />
      <Route path="/profile" component={Protected(Profile)} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TRPCProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </TRPCProvider>
    </ErrorBoundary>
  );
}

export default App;
