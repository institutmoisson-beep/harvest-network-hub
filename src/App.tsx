import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout.tsx"));
const DashboardHome = lazy(() => import("./pages/DashboardHome.tsx"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile.tsx"));
const DashboardWallet = lazy(() => import("./pages/DashboardWallet.tsx"));
const DashboardNetwork = lazy(() => import("./pages/DashboardNetwork.tsx"));
const DashboardCommissions = lazy(() => import("./pages/DashboardCommissions.tsx"));
const Directory = lazy(() => import("./pages/Directory.tsx"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const MoissoneursPros = lazy(() => import("./pages/MoissoneursPros.tsx"));
const Packs = lazy(() => import("./pages/Packs.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground font-display">Chargement…</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/moissonneurs-pros" element={<MoissoneursPros />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="wallet" element={<DashboardWallet />} />
              <Route path="network" element={<DashboardNetwork />} />
              <Route path="commissions" element={<DashboardCommissions />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
