import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProvider } from "@/lib/trpc";

// import Home from "./pages/Home";
import Login from "./pages/Login/index";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Kanban from "./pages/Kanban";
import History from "./pages/History";
import Security from "./pages/user/Security";
import Profile from "./pages/user/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />

      {/* <Route path="/home" component={Home} /> */}

      {/* <Route path="/register" component={Register} /> */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/activities" component={Activities} />
      <Route path="/kanban" component={Kanban} />
      <Route path="/history" component={History} />
      <Route path="/security" component={Security} />
      <Route path="/404" component={NotFound} />
      <Route path="/profile" component={Profile} />

      {/* catch-all: qualquer rota desconhecida vai pro 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TRPCProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
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
