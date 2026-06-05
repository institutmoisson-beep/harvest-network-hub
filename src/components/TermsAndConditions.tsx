import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";

export const CGU_TEXT = `CONDITIONS GÉNÉRALES D'UTILISATION (CGU)
APPLICATION DE L'INSTITUT MOISSON
Dernière mise à jour : Juin 2026

Bienvenue sur l'application officielle de l'Académie des Moissonneurs (Institut Moisson). En accédant à cette application et en utilisant ses services, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).

ARTICLE 1 : OBJET DE L'APPLICATION
L'application de l'Institut Moisson est une plateforme technologique à vocation communautaire et participative. Elle propose deux types de services distincts :
1. Le volet Éducatif et Social (ONG) : Services de formation, de développement de compétences et de mentorat professionnel.
2. Le volet Économique (GIE) : Un espace de financement participatif et d'investissement communautaire dénommé « Le Grenier des Moissonneurs », permettant aux membres d'acquérir des parts de projets porteurs (cinéma, agrobusiness, technologie).

ARTICLE 2 : CADRE JURIDIQUE DES INVESTISSEMENTS
- Nature des opérations : Toutes les opérations financières d'investissement, d'achat de parts et de redistribution de dividendes effectuées via « Le Grenier des Moissonneurs » sont exclusivement coordonnées et opérées sous l'égide du Groupement d'Intérêt Économique (GIE) de l'Institut Moisson.
- Indépendance de l'ONG : L'ONG gérant l'Académie des Moissonneurs ne peut en aucun cas être tenue responsable des gains ou des pertes financières découlant des investissements commerciaux.
- Contrat d'Adhésion : Chaque investissement donne lieu à la souscription d'un avenant ou d'un reçu d'adhésion au projet, adossé aux statuts juridiques de notre GIE.

ARTICLE 3 : INSCRIPTION ET SÉCURITÉ DES COMPTES
- Éligibilité : Réservée aux personnes physiques majeures et capables, ou aux personnes morales régulièrement constituées.
- Exactitude des données : L'utilisateur s'engage à fournir des informations exactes et sincères. Toute fausse déclaration pourra entraîner la suspension immédiate du compte.
- Confidentialité : Vos identifiants sont strictement personnels.

ARTICLE 4 : PORTEFEUILLE (WALLET) ET TRANSACTIONS
- Dépôts et retraits via Wave, Orange, MTN, Moov ou carte bancaire intégrée.
- L'administrateur valide les distributions de dividendes selon l'évolution réelle des projets.

ARTICLE 5 : PROFIL DE CARRIÈRE ET BONUS
L'échelle de progression communautaire (Semeur → Moissonneur Éternel) débloque automatiquement les bonus dès que les conditions (CA d'équipe, filleuls actifs, taille de réseau) sont remplies. L'administration peut annuler tout bonus obtenu par fraude.

ARTICLE 6 : AVERTISSEMENT SUR LES RISQUES
L'investissement dans des projets de développement, cinématographique ou agrobusiness comporte des risques. Les rendements affichés sont des estimations basées sur les business plans. Les performances passées ne garantissent pas les performances futures.

ARTICLE 7 : PROTECTION DES DONNÉES PERSONNELLES
L'Institut Moisson s'engage à ne jamais divulguer, vendre ou scanner publiquement les listes d'utilisateurs, leurs rôles ou leurs soldes à des tiers non autorisés.

ARTICLE 8 : DROIT APPLICABLE ET LITIGES
CGU régies par le droit en vigueur en République de Côte d'Ivoire et la réglementation UEMOA applicable aux GIE et au financement participatif. Juridictions compétentes : Abidjan.`;

interface Props {
  open: boolean;
  onAccepted: () => void;
  forceful?: boolean;
  embedded?: boolean;
}

const TermsAndConditions = ({ open, onAccepted, forceful, embedded }: Props) => {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const accept = async () => {
    if (!checked) return;
    setSubmitting(true);
    const { data, error } = await (supabase as any).rpc("accept_cgu");
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (data !== true) { toast.error("Acceptation non enregistrée. Réessayez."); return; }
    toast.success("CGU acceptées");
    setChecked(false);
    onAccepted();
  };

  const header = embedded ? (
    <div className="shrink-0">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold"><ScrollText size={20} className="text-primary" /> Conditions Générales d'Utilisation</h3>
    </div>
  ) : (
    <DialogHeader className="shrink-0">
      <DialogTitle className="flex items-center gap-2"><ScrollText size={20} className="text-primary" /> Conditions Générales d'Utilisation</DialogTitle>
    </DialogHeader>
  );

  const content = (
    <>
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed p-4 rounded-lg bg-muted/30 border border-border">
        {CGU_TEXT}
      </div>
      <label className="shrink-0 flex items-start gap-2 cursor-pointer p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} className="mt-1" />
        <span className="text-xs">
          J'ai lu et j'accepte les Conditions Générales d'Utilisation de l'application de l'Institut Moisson. Je reconnais que les activités d'investissement du Grenier sont juridiquement opérées par le GIE de l'organisation.
        </span>
      </label>
      <Button disabled={!checked || submitting} onClick={accept} className="shrink-0 w-full bg-gradient-purple text-primary-foreground font-display font-bold">
        {submitting ? "Validation…" : "Valider mon acceptation"}
      </Button>
    </>
  );

  if (embedded) {
    return <div className="flex max-h-[72vh] flex-col gap-4">{content}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!forceful && !v) onAccepted(); }}>
      <DialogContent
        className="glass-card border-border max-w-2xl max-h-[90vh] flex flex-col [&>button]:hidden"
        onInteractOutside={(e) => { if (forceful) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (forceful) e.preventDefault(); }}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditions;