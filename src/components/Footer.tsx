import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Wheat } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 bg-muted/30 py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Institut Moisson" className="h-8 w-8" loading="lazy" />
            <span className="font-display text-sm font-bold text-gradient-purple">Institut Moisson</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            La communauté des Moissonneurs — Ensemble, récoltons le meilleur de demain.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xs uppercase tracking-wider text-primary mb-3">Navigation</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <Link to="/directory" className="hover:text-foreground transition-colors">Annuaire</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Devenir Moissonneur</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display text-xs uppercase tracking-wider text-primary mb-3">Communauté</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Wheat size={14} className="text-primary" /> Solidarité Universelle</span>
            <span className="flex items-center gap-2"><Wheat size={14} className="text-primary" /> Penseurs & Visionnaires</span>
            <span className="flex items-center gap-2"><Wheat size={14} className="text-primary" /> Tous unis, jamais seuls</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border/30 mt-8 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Institut Moisson. Tous droits réservés.
      </div>
    </div>
  </footer>
);

export default Footer;
