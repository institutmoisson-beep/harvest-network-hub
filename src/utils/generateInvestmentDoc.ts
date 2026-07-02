// Investment receipt + property title PDF generator (HTML → print/save)
// Uses the browser's print-to-PDF for high fidelity, no dependency needed.

export interface InvestmentDocData {
  operationId: string;
  investmentDate: string; // ISO
  userName: string;
  userReferralCode: string;
  userIdMoissonneur: string;
  userPhone?: string;
  userEmail?: string;
  projectTitle: string;
  projectCategory?: string;
  totalShares: number;
  availableBefore: number;
  sharesPurchased: number;
  totalAmount: number; // FCFA
  percentageAcquired: number; // %
  currency?: string; // display currency label, defaults FCFA
  displayAmount?: number; // pre-converted amount if currency != FCFA
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);

export const buildInvestmentDocHTML = (d: InvestmentDocData): string => {
  const date = new Date(d.investmentDate);
  const dateStr = date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  const currency = d.currency || "FCFA";
  const amountLabel = `${fmt(d.displayAmount ?? d.totalAmount)} ${currency}`;
  const pct = d.percentageAcquired.toFixed(4).replace(/\.?0+$/, "");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Reçu & Titre — ${d.operationId}</title>
<style>
  @page { margin: 1.5cm; }
  * { box-sizing: border-box; }
  body { font-family: 'Georgia','Times New Roman',serif; color:#111; background:#fff; margin:0; padding:24px; }
  .doc { max-width: 780px; margin: 0 auto; }
  .head { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111; padding-bottom:10px; margin-bottom:18px; }
  .brand { font-family: 'Georgia',serif; font-size:20px; font-weight:700; letter-spacing:1px; }
  .brand small { display:block; font-size:10px; letter-spacing:2px; color:#555; font-weight:400; }
  .opcode { text-align:right; font-family: 'Courier New', monospace; font-size:12px; }
  .opcode strong { display:block; font-size:16px; color:#111; margin-top:2px; }
  .section { border:1px solid #d5d5d5; border-radius:8px; padding:18px; margin-bottom:18px; background:#fff; }
  .section h2 { margin:0 0 12px; font-size:15px; letter-spacing:1px; color:#111; border-left:4px solid #b8860b; padding-left:10px; text-transform:uppercase; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; font-size:12px; }
  .row { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dotted #ddd; }
  .row span:first-child { color:#666; }
  .row span:last-child { font-weight:600; color:#111; text-align:right; }
  .full { grid-column: 1/-1; }
  .highlight { background:#fdf7e6; border:1px solid #e6d28a; border-radius:6px; padding:10px; font-size:13px; text-align:center; }
  .highlight strong { font-size:16px; color:#7a5a10; }
  .legal { font-size:12.5px; line-height:1.6; text-align:justify; }
  .legal p { margin: 6px 0; }
  .sigs { display:flex; gap:30px; margin-top:22px; }
  .sig { flex:1; text-align:center; font-size:11px; color:#555; }
  .sig .line { border-top:1px solid #333; margin-top:60px; padding-top:4px; }
  .seal { display:inline-block; border:2px solid #7a5a10; color:#7a5a10; padding:8px 14px; border-radius:50%; font-weight:700; font-size:10px; letter-spacing:2px; transform: rotate(-8deg); }
  .foot { text-align:center; font-size:10px; color:#888; margin-top:14px; }
  .qr { font-family:'Courier New',monospace; font-size:11px; color:#555; }
  @media print { body { padding:0; } .noprint { display:none; } }
  .noprint { text-align:center; margin: 10px 0 20px; }
  .btn { display:inline-block; background:#111; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; font-family:sans-serif; font-size:12px; cursor:pointer; border:0; }
</style></head><body>
<div class="doc">
  <div class="noprint">
    <button class="btn" onclick="window.print()">📄 Télécharger / Imprimer en PDF</button>
  </div>

  <div class="head">
    <div class="brand">GIE LE GRENIER DES MOISSONNEURS<small>INSTITUT MOISSON · République communautaire</small></div>
    <div class="opcode">Identifiant unique<strong>${d.operationId}</strong></div>
  </div>

  <!-- SECTION 1: REÇU -->
  <div class="section">
    <h2>Reçu de Paiement Automatique</h2>
    <div class="grid">
      <div class="row"><span>Date & heure</span><span>${dateStr}</span></div>
      <div class="row"><span>Mode de paiement</span><span>Portefeuille interne (Wallet)</span></div>
      <div class="row"><span>Membre</span><span>${d.userName}</span></div>
      <div class="row"><span>Code Moissonneur</span><span>${d.userReferralCode || "—"}</span></div>
      <div class="row"><span>N° Moissonneur</span><span>${d.userIdMoissonneur || "—"}</span></div>
      <div class="row"><span>Téléphone</span><span>${d.userPhone || "—"}</span></div>
      <div class="row full"><span>Projet</span><span>${d.projectTitle}${d.projectCategory ? ` (${d.projectCategory})` : ""}</span></div>
      <div class="row"><span>Parts totales du projet</span><span>${fmt(d.totalShares)}</span></div>
      <div class="row"><span>Parts disponibles avant achat</span><span>${fmt(d.availableBefore)}</span></div>
      <div class="row"><span>Parts acquises</span><span>${fmt(d.sharesPurchased)}</span></div>
      <div class="row"><span>Quote-part sur le projet</span><span>${pct} %</span></div>
    </div>
    <div class="highlight" style="margin-top:14px;">Montant total versé : <strong>${amountLabel}</strong></div>
  </div>

  <!-- SECTION 2: TITRE -->
  <div class="section">
    <h2>Titre d'Action de Propriété Communautaire</h2>
    <div class="legal">
      <p>Le présent titre certifie officiellement, au nom du Groupement d'Intérêt Économique <strong>« Le Grenier des Moissonneurs »</strong>, que le membre soussigné&nbsp;:</p>
      <p style="text-align:center; font-size:14px; margin: 10px 0;">
        <strong>${d.userName}</strong> — Code&nbsp;: <strong>${d.userReferralCode || "—"}</strong> — N°&nbsp;: <strong>${d.userIdMoissonneur || "—"}</strong>
      </p>
      <p>détient officiellement et de plein droit <strong>${fmt(d.sharesPurchased)} action${d.sharesPurchased > 1 ? "s" : ""}</strong>
      du projet communautaire <strong>« ${d.projectTitle} »</strong>, représentant une quote-part de <strong>${pct}&nbsp;%</strong> du capital projet, pour un investissement total de <strong>${amountLabel}</strong>.</p>
      <p>Cette acquisition ouvre droit, conformément aux statuts du GIE et au règlement intérieur de l'Institut Moisson, à la perception des dividendes proportionnels lors des distributions périodiques opérées par le Comité de Trésorerie.</p>
      <p>Le présent titre est nominatif, incessible sans validation du Bureau Exécutif, et opposable à tous les organes de l'Institut. Son authenticité peut être vérifiée à tout moment par l'Administration à partir de l'identifiant unique&nbsp;: <span class="qr">${d.operationId}</span>.</p>
    </div>

    <div class="sigs">
      <div class="sig">
        <div class="line">Signature du Membre</div>
        <div>${d.userName}</div>
      </div>
      <div class="sig">
        <span class="seal">SCEAU · GIE MOISSON</span>
        <div class="line">Administrateur Général du GIE</div>
        <div>Institut Moisson</div>
      </div>
    </div>
  </div>

  <div class="foot">Document généré automatiquement le ${new Date().toLocaleString("fr-FR")} — Identifiant unique de vérification&nbsp;: <strong>${d.operationId}</strong></div>
</div>
</body></html>`;
};

export const openInvestmentDoc = (d: InvestmentDocData) => {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildInvestmentDocHTML(d));
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 600);
};