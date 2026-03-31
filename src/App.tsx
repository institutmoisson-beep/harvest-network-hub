import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import DashboardLayout from "./pages/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import DashboardProfile from "./pages/DashboardProfile.tsx";
import DashboardWallet from "./pages/DashboardWallet.tsx";
import DashboardNetwork from "./pages/DashboardNetwork.tsx";
import DashboardCommissions from "./pages/DashboardCommissions.tsx";
import Directory from "./pages/Directory.tsx";
import CompanyProfile from "./pages/CompanyProfile.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import MoissoneursPros from "./pages/MoissoneursPros.tsx";
import Packs from "./pages/Packs.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/company/:id" element={<CompanyProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/moissonneurs-pros" element={<MoissoneursPros />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<DashboardProfile />} />
            <Route path="wallet" element={<DashboardWallet />} />
            <Route path="network" element={<DashboardNetwork />} />
            <Route path="commissions" element={<DashboardCommissions />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
