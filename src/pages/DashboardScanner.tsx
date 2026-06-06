import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScannerCommunautaire from "@/components/ScannerCommunautaire";
import { ArrowLeft, ScanLine } from "lucide-react";

const DashboardScanner = () => (
  <div className="p-6 max-w-2xl mx-auto">
    <div className="flex items-center gap-3 mb-6">
      <Link to="/dashboard"><Button variant="outline" size="sm"><ArrowLeft size={14} /></Button></Link>
      <h1 className="font-display text-xl font-bold flex items-center gap-2"><ScanLine size={22} className="text-primary" /> Vérificateur de Communauté</h1>
    </div>
    <ScannerCommunautaire />
  </div>
);

export default DashboardScanner;