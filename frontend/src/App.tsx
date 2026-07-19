import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CreatePayment from "./pages/CreatePayment"
import PaymentDetail from "./pages/PaymentDetail";
import PayPage from "./pages/PayPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/new"
            element={
              <ProtectedRoute>
                <CreatePayment />
              </ProtectedRoute>
            }
          />
          <Route
  path="/payments/:id"
  element={
    <ProtectedRoute>
      <PaymentDetail />
    </ProtectedRoute>
  }
/>
<Route path="/pay/:id" element={<PayPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;