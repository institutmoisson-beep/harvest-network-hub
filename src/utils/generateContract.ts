export const generateContractHTML = (
  userName: string,
  productName: string,
  productPrice: number,
  companyName: string,
  date: string
) => {
  // Signature SVG - stylized "Oniel Celvus" signature
  const signatureSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="250" height="65">
    <defs>
      <linearGradient id="sigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6b21a8;stop-opacity:1"/>
        <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1"/>
      </linearGradient>
    </defs>
    <path d="M20,70 C30,25 45,20 55,35 C65,50 50,70 70,55 C85,42 90,30 100,25 C110,20 105,50 115,45 C125,40 130,30 140,35 C148,39 145,55 155,50" stroke="url(#sigGrad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M165,55 C170,25 185,20 190,40 C195,55 180,65 195,50 C210,35 200,25 215,30 C225,33 220,50 230,45 C240,38 235,30 245,28 C260,24 265,45 275,40 C282,37 285,30 295,35 C305,40 300,55 310,48 C318,42 325,30 340,35 C350,38 345,55 355,50 C362,46 365,38 375,42" stroke="url(#sigGrad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M50,78 L145,78" stroke="url(#sigGrad)" stroke-width="0.8" fill="none" opacity="0.5"/>
    <path d="M170,78 L370,78" stroke="url(#sigGrad)" stroke-width="0.8" fill="none" opacity="0.5"/>
    <text x="60" y="95" font-family="serif" font-size="10" fill="#6b21a8" font-style="italic" opacity="0.7">Oniel Celvus</text>
    <text x="200" y="95" font-family="serif" font-size="8" fill="#6b21a8" opacity="0.5">Directeur Général MSN Moisson</text>
  </svg>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Contrat de Garantie MSN Moisson</title>
<style>
  @page { margin: 2cm; }
  body { font-family: 'Georgia', serif; color: #1a1a2e; line-height: 1.7; max-width: 700px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #6b21a8; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #6b21a8; font-size: 22px; margin: 0; letter-spacing: 2px; }
  .header p { color: #9333ea; font-size: 11px; letter-spacing: 3px; margin: 5px 0 0; }
  .badge { display: inline-block; background: linear-gradient(135deg, #6b21a8, #9333ea); color: white; padding: 4px 16px; border-radius: 20px; font-size: 10px; letter-spacing: 2px; margin-top: 10px; }
  h2 { color: #6b21a8; font-size: 16px; margin-top: 25px; border-left: 4px solid #d4a843; padding-left: 12px; }
  h3 { color: #4a1a7a; font-size: 14px; margin-top: 18px; }
  .info-box { background: #f8f6ff; border: 1px solid #e0d4f5; border-radius: 8px; padding: 15px; margin: 20px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e0d4f5; font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-weight: bold; color: #6b21a8; }
  ul { padding-left: 20px; }
  li { margin: 6px 0; font-size: 13px; }
  .signature-block { margin-top: 40px; border-top: 2px solid #e0d4f5; padding-top: 20px; }
  .sig-row { display: flex; justify-content: space-between; gap: 40px; }
  .sig-col { flex: 1; }
  .sig-line { border-bottom: 1px solid #333; margin-top: 50px; margin-bottom: 5px; }
  .sig-name { font-size: 11px; color: #666; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(107, 33, 168, 0.03); font-weight: bold; letter-spacing: 10px; pointer-events: none; z-index: -1; }
  .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e0d4f5; font-size: 10px; color: #999; }
  .seal { text-align: center; margin: 20px 0; }
  @media print { body { padding: 0; } .watermark { position: fixed; } }
</style>
</head>
<body>
<div class="watermark">MSN MOISSON</div>

<div class="header">
  <h1>CONTRAT DE GARANTIE</h1>
  <p>MSN MOISSON</p>
  <div class="badge">DOCUMENT OFFICIEL</div>
</div>

<div class="info-box">
  <div class="info-row"><span class="info-label">Membre</span><span>${userName}</span></div>
  <div class="info-row"><span class="info-label">Pack acquis</span><span>${productName}</span></div>
  <div class="info-row"><span class="info-label">Montant</span><span>${productPrice.toLocaleString()} FCFA</span></div>
  <div class="info-row"><span class="info-label">Entreprise partenaire</span><span>${companyName}</span></div>
  <div class="info-row"><span class="info-label">Date</span><span>${date}</span></div>
  <div class="info-row"><span class="info-label">Réf. contrat</span><span>MSN-${Date.now().toString(36).toUpperCase()}</span></div>
</div>

<h2>1. OBJET DU CONTRAT</h2>
<p>Le présent contrat garantit au Membre l'acquisition d'un Pack Métier opérationnel, incluant le matériel, la formation et l'accompagnement nécessaire à son insertion économique.</p>

<h2>2. LES CINQ PILIERS DE LA GARANTIE MSN</h2>

<h3>A. Livraison Certifiée</h3>
<p>MSN s'engage à livrer l'intégralité du matériel constituant le pack dans un délai maximum de <strong>15 jours ouvrés</strong> après validation du paiement. Un procès-verbal de réception sera signé.</p>

<h3>B. Formation Certifiante</h3>
<p>Le Membre bénéficie d'une formation technique intensive de <strong>2 à 4 semaines</strong> dispensée par des experts métiers partenaires. Une certification <em>"Expert Moissonneur"</em> est délivrée en fin de cursus.</p>

<h3>C. Kit de Visibilité</h3>
<p>Pour lancer son activité, le membre reçoit :</p>
<ul>
  <li>1 Enseigne lumineuse ou Panneau publicitaire MSN</li>
  <li>100 Cartes de visite personnalisées</li>
  <li>Tenue de travail logotypée (T-shirt, Casquette, Gilet tactique selon le pack)</li>
</ul>

<h3>D. Insertion Réseau</h3>
<p>Le membre est prioritaire sur tous les appels d'offres internes de la plateforme MSN et est répertorié dans l'annuaire <strong>"Moissonneurs Pros"</strong> consulté par tous les membres du réseau.</p>

<h3>E. Suivi Business</h3>
<p>Pendant <strong>6 mois</strong>, un mentor dédié accompagne le membre sur :</p>
<ul>
  <li>La gestion financière</li>
  <li>La recherche de clients locaux</li>
  <li>L'entretien du matériel</li>
</ul>

<h2>3. ENGAGEMENT DU MEMBRE</h2>
<p>Le membre s'engage à suivre l'intégralité de la formation et à respecter la charte éthique MSN dans l'exercice de son métier.</p>

<div class="signature-block">
  <div class="sig-row">
    <div class="sig-col">
      <p style="font-size:12px; font-weight:bold; margin-bottom:5px;">Pour MSN Moisson :</p>
      ${signatureSVG}
      <p class="sig-name" style="margin-top:5px;">Oniel Celvus — Directeur Général</p>
    </div>
    <div class="sig-col">
      <p style="font-size:12px; font-weight:bold; margin-bottom:5px;">Le Membre :</p>
      <div class="sig-line"></div>
      <p class="sig-name">${userName}</p>
    </div>
  </div>
</div>

<div class="footer">
  <p><strong>Institut Moisson</strong> — Unis pour prospérer & protéger</p>
  <p>Ce document fait foi de contrat de garantie entre MSN Moisson et le membre signataire.</p>
  <p>Réf: MSN-${Date.now().toString(36).toUpperCase()} | Généré le ${date}</p>
</div>
</body>
</html>`;
};

export const downloadContract = (
  userName: string,
  productName: string,
  productPrice: number,
  companyName: string
) => {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const html = generateContractHTML(userName, productName, productPrice, companyName, date);

  // Open in new window for print/PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Auto-trigger print dialog (user can save as PDF)
    setTimeout(() => printWindow.print(), 500);
  }
};
