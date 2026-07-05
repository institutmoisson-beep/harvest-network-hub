import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import VersionNotice from "@/components/VersionNotice";

const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout.tsx"));
const DashboardHome = lazy(() => import("./pages/DashboardHome.tsx"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile.tsx"));
const DashboardWallet = lazy(() => import("./pages/DashboardWallet.tsx"));
const DashboardNetwork = lazy(() => import("./pages/DashboardNetwork.tsx"));
const DashboardCommissions = lazy(() => import("./pages/DashboardCommissions.tsx"));
const DashboardPacks = lazy(() => import("./pages/DashboardPacks.tsx"));
const DashboardOrders = lazy(() => import("./pages/DashboardOrders.tsx"));
const Directory = lazy(() => import("./pages/Directory.tsx"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const MoissoneursPros = lazy(() => import("./pages/MoissoneursPros.tsx"));
const Packs = lazy(() => import("./pages/Packs.tsx"));
const StaffPackManager = lazy(() => import("./pages/StaffPackManager.tsx"));
const StaffFinancier = lazy(() => import("./pages/StaffFinancier.tsx"));
const StaffPartnerManager = lazy(() => import("./pages/StaffPartnerManager.tsx"));
const StaffCommunication = lazy(() => import("./pages/StaffCommunication.tsx"));
const StaffCommerceManager = lazy(() => import("./pages/StaffCommerceManager.tsx"));
const CommerceProducts = lazy(() => import("./pages/CommerceProducts.tsx"));
const CommunityFund = lazy(() => import("./pages/CommunityFund.tsx"));
const Emergencies = lazy(() => import("./pages/Emergencies.tsx"));
const AdminEmergencies = lazy(() => import("./pages/AdminEmergencies.tsx"));
const AdminRoles = lazy(() => import("./pages/AdminRoles.tsx"));
const AdminRelays = lazy(() => import("./pages/AdminRelays.tsx"));
const StaffHR = lazy(() => import("./pages/StaffHR.tsx"));
const StaffDelivery = lazy(() => import("./pages/StaffDelivery.tsx"));
const StaffCountry = lazy(() => import("./pages/StaffCountry.tsx"));
const StaffCity = lazy(() => import("./pages/StaffCity.tsx"));
const StaffZone = lazy(() => import("./pages/StaffZone.tsx"));
const DashboardChannel = lazy(() => import("./pages/DashboardChannel.tsx"));
const AdminBroadcasts = lazy(() => import("./pages/AdminBroadcasts.tsx"));
const AdminCareer = lazy(() => import("./pages/AdminCareer.tsx"));
const StaffCareer = lazy(() => import("./pages/StaffCareer.tsx"));
const AdminGrenier = lazy(() => import("./pages/AdminGrenier.tsx"));
const DashboardGrenier = lazy(() => import("./pages/DashboardGrenier.tsx"));
const DashboardGrenierDetail = lazy(() => import("./pages/DashboardGrenierDetail.tsx"));
const DashboardInvestments = lazy(() => import("./pages/DashboardInvestments.tsx"));
const AdminVerifyInvestment = lazy(() => import("./pages/AdminVerifyInvestment.tsx"));
const AdminIdentityVerification = lazy(() => import("./pages/AdminIdentityVerification.tsx"));
const DashboardCustomOrders = lazy(() => import("./pages/DashboardCustomOrders.tsx"));
const AdminCustomOrders = lazy(() => import("./pages/AdminCustomOrders.tsx"));
const DashboardCard = lazy(() => import("./pages/DashboardCard.tsx"));
const DashboardScanner = lazy(() => import("./pages/DashboardScanner.tsx"));
const VerifyMember = lazy(() => import("./pages/VerifyMember.tsx"));
const InstallApp = lazy(() => import("./pages/InstallApp.tsx"));
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
        <PwaInstallBanner />
        <VersionNotice />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/telecharger-app" element={<InstallApp />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/company/:id" element={<CompanyProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/staff/packs" element={<StaffPackManager />} />
            <Route path="/staff/finance" element={<StaffFinancier />} />
            <Route path="/staff/partners" element={<StaffPartnerManager />} />
            <Route path="/staff/communication" element={<StaffCommunication />} />
            <Route path="/staff/commerce" element={<StaffCommerceManager />} />
            <Route path="/admin/urgences" element={<AdminEmergencies />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/relays" element={<AdminRelays />} />
            <Route path="/staff/hr" element={<StaffHR />} />
            <Route path="/staff/delivery" element={<StaffDelivery />} />
            <Route path="/staff/country" element={<StaffCountry />} />
            <Route path="/staff/city" element={<StaffCity />} />
            <Route path="/staff/zone" element={<StaffZone />} />
            <Route path="/staff/emergency" element={<AdminEmergencies />} />
            <Route path="/admin/broadcasts" element={<AdminBroadcasts />} />
            <Route path="/admin/career" element={<AdminCareer />} />
            <Route path="/staff/career" element={<StaffCareer />} />
            <Route path="/admin/grenier" element={<AdminGrenier />} />
            <Route path="/admin/verify-invest" element={<AdminVerifyInvestment />} />
            <Route path="/admin/identities" element={<AdminIdentityVerification />} />
            <Route path="/admin/custom-orders" element={<AdminCustomOrders />} />
            <Route path="/moissonneurs-pros" element={<MoissoneursPros />} />
            <Route path="/packs" element={<Packs />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="profile" element={<DashboardProfile />} />
              <Route path="wallet" element={<DashboardWallet />} />
              <Route path="network" element={<DashboardNetwork />} />
              <Route path="commissions" element={<DashboardCommissions />} />
              <Route path="packs" element={<DashboardPacks />} />
              <Route path="orders" element={<DashboardOrders />} />
              <Route path="custom-orders" element={<DashboardCustomOrders />} />
              <Route path="wholesale" element={<CommerceProducts kind="wholesale" />} />
              <Route path="distribution" element={<CommerceProducts kind="distribution" />} />
              <Route path="fonds" element={<CommunityFund />} />
              <Route path="urgences" element={<Emergencies />} />
              <Route path="canal" element={<DashboardChannel />} />
              <Route path="grenier" element={<DashboardGrenier />} />
              <Route path="grenier/:id" element={<DashboardGrenierDetail />} />
              <Route path="investments" element={<DashboardInvestments />} />
              <Route path="carte" element={<DashboardCard />} />
              <Route path="scanner" element={<DashboardScanner />} />
              <Route path="verify" element={<VerifyMember />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
