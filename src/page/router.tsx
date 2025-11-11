import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./Home";
import Login from "./Login";
import Report from "./Report";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token"); 
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route path="/report" element= {
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
