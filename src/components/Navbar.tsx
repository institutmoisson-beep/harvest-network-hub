import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Institut Moisson" className="h-10 w-10" />
          <span className="font-display text-lg font-bold text-gradient-purple hidden sm:inline">
            Institut Moisson
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
            Accueil
          </Link>
          <Link to="/directory" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
            Annuaire
          </Link>
          <Link to="/login" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
            Connexion
          </Link>
          <Link to="/register">
            <Button className="bg-gradient-purple text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Devenir Moissonneur
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass-card border-t border-border/50 p-4 flex flex-col gap-3">
          <Link to="/" className="text-sm py-2" onClick={() => setOpen(false)}>Accueil</Link>
          <Link to="/directory" className="text-sm py-2" onClick={() => setOpen(false)}>Annuaire</Link>
          <Link to="/login" className="text-sm py-2" onClick={() => setOpen(false)}>Connexion</Link>
          <Link to="/register" onClick={() => setOpen(false)}>
            <Button className="w-full bg-gradient-purple text-primary-foreground font-semibold">
              Devenir Moissonneur
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
