// Legal documents for Institut Moisson — auto-filled with member info

const baseStyle = `
  @page { margin: 2cm; }
  body { font-family: 'Georgia', serif; color: #1a1a2e; line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #6b21a8; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #6b21a8; font-size: 20px; margin: 0; letter-spacing: 2px; }
  .header p { color: #9333ea; font-size: 11px; letter-spacing: 3px; margin: 5px 0 0; }
  .badge { display: inline-block; background: linear-gradient(135deg, #6b21a8, #9333ea); color: white; padding: 4px 16px; border-radius: 20px; font-size: 10px; letter-spacing: 2px; margin-top: 10px; }
  h2 { color: #6b21a8; font-size: 15px; margin-top: 22px; border-left: 4px solid #d4a843; padding-left: 12px; }
  h3 { color: #4a1a7a; font-size: 13px; margin-top: 16px; }
  p, li { font-size: 12.5px; }
  ul { padding-left: 20px; }
  .info-box { background: #f8f6ff; border: 1px solid #e0d4f5; border-radius: 8px; padding: 15px; margin: 20px 0; }
  .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e0d4f5; font-size: 12.5px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-weight: bold; color: #6b21a8; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(107, 33, 168, 0.04); font-weight: bold; letter-spacing: 10px; pointer-events: none; z-index: -1; }
  .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e0d4f5; font-size: 10px; color: #999; }
  .sig-row { display: flex; justify-content: space-between; gap: 40px; margin-top: 40px; }
  .sig-col { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1px solid #333; margin-top: 50px; margin-bottom: 5px; }
  .sig-name { font-size: 11px; color: #666; }
  .seal { display: inline-block; padding: 10px 20px; border: 2px dashed #6b21a8; border-radius: 50px; color: #6b21a8; font-weight: bold; font-size: 11px; margin-top: 10px; }
  @media print { body { padding: 0; } .watermark { position: fixed; } }
`;

export type MemberInfo = {
  fullName: string;
  userId: string;
  email: string;
  packName: string;
  registrationDate: string;
  referralCode: string;
};

const openPrint = (html: string) => {
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
};

const memberHeader = (m: MemberInfo) => `
  <div class="info-box">
    <div class="info-row"><span class="info-label">Nom complet</span><span>${m.fullName}</span></div>
    <div class="info-row"><span class="info-label">Code Moissonneur</span><span>${m.referralCode}</span></div>
    <div class="info-row"><span class="info-label">Identifiant Unique</span><span style="font-family:monospace;font-size:10px">${m.userId}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span>${m.email}</span></div>
    <div class="info-row"><span class="info-label">Pack Initial Souscrit</span><span>${m.packName}</span></div>
    <div class="info-row"><span class="info-label">Date d'Adhésion</span><span>${m.registrationDate}</span></div>
  </div>
`;

export const downloadAdhesionContract = (m: MemberInfo) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrat d'Adhésion — ${m.fullName}</title><style>${baseStyle}</style></head><body>
  <div class="watermark">INSTITUT MOISSON</div>
  <div class="header">
    <h1>CONTRAT D'ADHÉSION COMMUNAUTAIRE</h1>
    <p>D'ASSOCIATION INTERNATIONALE &amp; GIE</p>
    <p style="margin-top:4px">ÉCOSYSTÈME PARTICIPATIF GLOBAL — INSTITUT MOISSON (ONG INTERNATIONALE)</p>
    <div class="badge">DOCUMENT OFFICIEL</div>
  </div>

  <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
  <p>L'<strong>INSTITUT MOISSON</strong>, Organisation Non Gouvernementale (ONG) Internationale à gouvernance participative et Groupement d'Intérêt Communautaire, dont le siège mondial est établi à Abidjan, Côte d'Ivoire, représenté par son Président de Conseil d'Éthique, ci-après dénommé « <em>L'Institut</em> » ou « <em>La Communauté</em> », d'une part ;</p>
  <p><strong>ET L'ADHÉRENT NUMÉRIQUE</strong>, utilisateur inscrit via l'application officielle de l'Institut Moisson, dont les informations d'identité électronique sont :</p>
  ${memberHeader(m)}
  <p>Ci-après dénommé(e) « <em>L'Adhérent</em> », « <em>Le Membre Distributeur</em> » ou « <em>Le Moissonneur</em> », d'autre part.</p>

  <h2>PRÉAMBULE</h2>
  <p>L'Institut Moisson constitue une communauté internationale unie par des principes de solidarité, de mutualisation des ressources et d'élévation professionnelle, formant une véritable famille collective. Le présent accord scelle l'intégration de l'Adhérent au sein de ce modèle d'actionnariat participatif global. Ce contrat de groupement fusionne la formation d'élite, le financement de projets, le commerce en gros et le marketing relationnel de réseau, le tout opéré de manière transparente à travers l'écosystème numérique et le portefeuille intégré de l'application.</p>

  <h2>ARTICLE 1 : STATUT DU MEMBRE, FORMATIONS ET MULTI-PACKS</h2>
  <p>En validant son adhésion, l'Adhérent acquiert le statut de Membre de la communauté internationale de l'Institut Moisson. L'Adhérent a le droit et l'opportunité de souscrire à un ou plusieurs autres packs de formation et d'activité (Pôles Security Vanguard, Cyber-Vanguard, Juristes, formation, ou autres packs sectoriels) directement depuis son interface. L'achat de chaque pack débloque l'accès aux cycles de formation d'excellence correspondants, co-dispensés et légitimés conjointement par des structures privées agréées et des institutions étatiques nationaux et internationaux partenaires de l'Institut.</p>

  <h2>ARTICLE 2 : ÉCOSYSTÈME MLM ET COMMISSIONS RELATIONNELLES</h2>
  <p>L'Institut Moisson structure son expansion internationale sur un modèle de marketing relationnel (MLM / Marketing Multi-Niveaux). L'Adhérent est libre de développer son propre réseau de recommandation. À ce titre, il perçoit des commissions algorithmiques directes et indirectes basées sur les taux contractuels affectés à chaque pack lors de l'inscription de nouveaux membres au sein de son réseau de parrainage. Le calcul et la distribution de ces commissions de réseau sont entièrement automatisés par les scripts informatiques sécurisés du système.</p>

  <h2>ARTICLE 3 : LE PORTEFEUILLE INTÉGRÉ (WALLET MSN)</h2>
  <p>L'application fournit à l'Adhérent un portefeuille électronique sécurisé intégré (Wallet MSN). Ce portefeuille enregistre en temps réel :</p>
  <ul>
    <li>Les contributions financières participatives de l'Adhérent pour l'acquisition de nouveaux packs ou produits.</li>
    <li>Les commissions de marketing de réseau (MLM) acquises par l'Adhérent.</li>
    <li>Les revenus générés par ses ventes en gros.</li>
  </ul>
  <p>L'Adhérent peut utiliser le solde disponible dans son portefeuille pour réinvestir dans l'écosystème ou en demander le retrait selon les conditions financières définies par la communauté.</p>

  <h2>ARTICLE 4 : COMMERCE DE GROS, DISTRIBUTION ET RÉMUNÉRATION</h2>
  <p>L'Institut Moisson met à disposition de sa communauté une centrale d'achat et un catalogue de produits de grande consommation (produits alimentaires de base, cosmétiques, savons, équipements spécialisés). L'Adhérent bénéficie du statut de Membre Distributeur Agréé :</p>
  <ul>
    <li>Il est habilité à acheter ces denrées et articles en gros à des prix communautaires préférentiels.</li>
    <li>Il génère des marges commerciales directes lors de la revente de ces produits sur le marché.</li>
    <li>Le volume d'achat de produits de sa lignée (downline) génère des points valeurs (PV) convertibles en bonus financiers mensuels crédités sur son portefeuille intégré.</li>
  </ul>

  <h2>ARTICLE 5 : LE FONDS COMMUNAUTAIRE DE SOLIDARITÉ ET DE FINANCEMENT</h2>
  <p>Chaque acquisition de pack, chaque transaction commerciale et chaque mouvement réseau au sein de l'application alimente à hauteur d'un pourcentage défini le Fonds Communautaire de Solidarité de l'Institut Moisson. Ce fonds d'actionnariat participatif est exclusivement destiné à :</p>
  <ul>
    <li>Accorder des bourses d'études et soutenir les membres de la famille Moissonneur en situation de vulnérabilité.</li>
    <li>Financer de manière participative des projets entrepreneuriaux et d'ingénierie soumis par les jeunes diplômés et membres de la communauté, après validation par le comité de pilotage.</li>
  </ul>

  <h2>ARTICLE 6 : CODE D'HONNEUR, ÉTHIQUE ET VALIDATION ÉLECTRONIQUE</h2>
  <p>Le Membre s'engage à respecter le Code d'Honneur de l'organisation, basé sur la loyauté, la droiture et la maîtrise de soi apprise lors du tronc commun. Les uniformes d'apparat (la veste varoise d'honneur rose clair kaki) et insignes officiels sont protégés auprès de l'OAPI. Ce contrat est réputé signé et exécutoire dès la validation de l'inscription de l'utilisateur sur l'application. La génération automatique du présent PDF, comprenant l'identifiant de sécurité unique et l'empreinte de la transaction, fait foi de consentement mutuel parfait.</p>

  <div class="sig-row">
    <div class="sig-col">
      <p style="font-size:11px; font-weight:bold;">Pour l'Institut Moisson</p>
      <div class="seal">✓ SIGNÉ ÉLECTRONIQUEMENT</div>
      <p class="sig-name" style="margin-top:8px">Le Secrétariat Général<br/>Haut Conseil d'Éthique<br/>Bendèkouassikro / Bouaké</p>
    </div>
    <div class="sig-col">
      <p style="font-size:11px; font-weight:bold;">Pour l'Adhérent / Le Distributeur</p>
      <div class="seal">✓ APPROUVÉ VIA L'APPLICATION</div>
      <p class="sig-name" style="margin-top:8px">${m.fullName}<br/>Code: ${m.referralCode}<br/>ID: ${m.userId.substring(0,13)}…</p>
    </div>
  </div>

  <div class="footer">
    <p><strong>Empreinte de transaction :</strong> IM-${m.userId.substring(0,8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}</p>
    <p>Ce document fait foi de contrat d'adhésion entre l'Institut Moisson et le membre signataire.</p>
    <p>Généré le ${new Date().toLocaleString("fr-FR")}</p>
  </div>
  </body></html>`;
  openPrint(html);
};

export const downloadStatutes = (m: MemberInfo) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Statuts — Institut Moisson</title><style>${baseStyle}</style></head><body>
  <div class="watermark">INSTITUT MOISSON</div>
  <div class="header">
    <h1>STATUTS DE L'ORGANISATION INTERNATIONALE</h1>
    <p>« INSTITUT MOISSON »</p>
    <div class="badge">DOCUMENT OFFICIEL</div>
  </div>
  ${memberHeader(m)}

  <h2>TITRE I : CONSTITUTION — DÉNOMINATION — SIÈGE — DURÉE</h2>
  <h3>ARTICLE 1 : CONSTITUTION ET FORME JURIDIQUE</h3>
  <p>Il est constitué entre les adhérents aux présents statuts et tous ceux qui y adhéreront ultérieurement, une Organisation Non Gouvernementale (ONG) Internationale à vocation de Fondation par Actions Participatives et Groupement d'Intérêt Communautaire, régie par les lois nationales en vigueur et les dispositions du droit international des associations.</p>
  <h3>ARTICLE 2 : DÉNOMINATION</h3>
  <p>L'organisation prend la dénomination officielle de : <strong>INSTITUT MOISSON</strong> (abrégé "IM" ou "La Communauté").</p>
  <h3>ARTICLE 3 : SIÈGE SOCIAL</h3>
  <p>Le siège international de l'Institut Moisson est établi à Bendèkouassikro/Bouaké, République de Côte d'Ivoire. Il peut être transféré dans toute autre ville ou pays par décision du Haut Conseil d'Éthique. Des antennes nationales (chapitres) peuvent être créées librement à l'étranger pour encadrer les membres locaux.</p>
  <h3>ARTICLE 4 : DURÉE</h3>
  <p>La durée de l'Institut Moisson est illimitée, sauf dissolution anticipée prononcée conformément aux présents statuts.</p>

  <h2>TITRE II : BUTS — OBJECTIFS — MOYENS D'ACTION</h2>
  <h3>ARTICLE 5 : BUT ET DOCTRINE</h3>
  <p>L'Institut Moisson est une communauté internationale bâtie sur les principes d'une famille solidaire, visant l'élévation morale, technique, financière et professionnelle de ses membres par la mutualisation des compétences et des ressources. Sa doctrine repose sur la droiture, la discipline collective et la maîtrise absolue de soi.</p>
  <h3>ARTICLE 6 : OBJECTIFS STRATÉGIQUES</h3>
  <ul>
    <li>La formation professionnelle d'élite dans les secteurs régaliens et technologiques (Sécurité opérationnelle, Cyber-sécurité, Droit, Ingénierie, spiritualité et formation technique).</li>
    <li>Le développement d'un écosystème commercial et financier participatif permettant l'autonomisation de ses membres.</li>
    <li>Le financement de projets entrepreneuriaux portés par ses jeunes diplômés afin de lutter contre le chômage.</li>
    <li>L'assistance sociale, l'entraide mutuelle et la protection financière de la famille communautaire.</li>
  </ul>
  <h3>ARTICLE 7 : MOYENS D'ACTION ET MODÈLE ÉCONOMIQUE HYBRIDE</h3>
  <ul>
    <li>Des cycles de formation d'excellence conçus par l'Institut et validés par conventionnement.</li>
    <li>Un réseau d'expansion basé sur le marketing relationnel (MLM / multi-niveaux) géré par algorithmes.</li>
    <li>Un réseau de distribution et de commerce de gros de produits de grande consommation.</li>
    <li>Un outil de gestion financière décentralisé matérialisé par un portefeuille électronique sécurisé (Wallet MSN).</li>
  </ul>

  <h2>TITRE III : COMPOSITION — ADHÉSION — RESSOURCES</h2>
  <h3>ARTICLE 8 : QUALITÉ DE MEMBRE ET CONTRAT D'ADHÉSION</h3>
  <p>Peut devenir membre de l'Institut Moisson toute personne physique ou morale partageant les valeurs de l'organisation. L'adhésion s'effectue obligatoirement par voie numérique via l'application officielle par la validation du Contrat d'Adhésion Communautaire. L'adhérent prend alors le titre de "Membre Moissonneur" ou "Membre Distributeur".</p>
  <h3>ARTICLE 9 : ACQUISITION DE MULTI-PACKS</h3>
  <p>Chaque membre a la faculté de souscrire à un ou plusieurs "Packs d'Activité et de Formation" au sein de l'application. La souscription de chaque pack donne droit aux formations rattachées et ouvre des droits de distribution commerciale spécifiques dans le réseau.</p>
  <h3>ARTICLE 10 : RESSOURCES DE L'ORGANISATION</h3>
  <ul>
    <li>Contributions participatives liées à la souscription des packs.</li>
    <li>Cotisations et fonds d'adhésion des membres.</li>
    <li>Marges générées par la centrale d'achat et le commerce de gros.</li>
    <li>Prélèvement algorithmique fixe alimentant le Fonds Communautaire de Solidarité.</li>
  </ul>

  <h2>TITRE IV : GOUVERNANCE ET ADMINISTRATION</h2>
  <h3>ARTICLE 11 : LE HAUT CONSEIL D'ÉTHIQUE</h3>
  <p>L'Institut Moisson est placé sous l'autorité suprême du Haut Conseil d'Éthique, garant de la doctrine, de la discipline, de la légalité républicaine et de l'éthique. Il détient le pouvoir de veto sur toutes les décisions financières, pédagogiques et administratives.</p>
  <h3>ARTICLE 12 : LE COMITÉ EXÉCUTIF ET DE PILOTAGE</h3>
  <p>Le Comité Exécutif assure la gestion quotidienne, supervise l'ingénierie technique de l'application, valide le catalogue des produits en gros et ordonnance les investissements validés par le Haut Conseil.</p>

  <h2>TITRE V : FONDS DE SOLIDARITÉ ET DISSOLUTION</h2>
  <h3>ARTICLE 13 : AFFECTATION DU FONDS DE SOLIDARITÉ</h3>
  <p>Le Fonds Communautaire de Solidarité ne peut être redistribué à des fins d'enrichissement personnel des dirigeants. Il est exclusivement mobilisé pour : financer à taux zéro ou sous forme de bourses les projets d'entreprise des jeunes diplômés méritants, et soutenir financièrement les familles des membres en cas de coup dur (maladie, décès, sinistres).</p>
  <h3>ARTICLE 14 : DISSOLUTION</h3>
  <p>En cas de dissolution, l'ensemble des actifs technologiques, financiers et physiques de l'Institut Moisson sera intégralement transféré à des œuvres caritatives ou à des fondations sœurs poursuivant des buts similaires, sous la supervision d'un liquidateur nommé par le Haut Conseil d'Éthique.</p>

  <div class="footer">
    <p>Statuts certifiés — Institut Moisson — Adhérent : ${m.fullName} (${m.referralCode})</p>
    <p>Généré le ${new Date().toLocaleString("fr-FR")}</p>
  </div>
  </body></html>`;
  openPrint(html);
};

export const downloadReglement = (m: MemberInfo) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Règlement Intérieur — Institut Moisson</title><style>${baseStyle}</style></head><body>
  <div class="watermark">INSTITUT MOISSON</div>
  <div class="header">
    <h1>RÈGLEMENT INTÉRIEUR</h1>
    <p>INSTITUT MOISSON</p>
    <div class="badge">DOCUMENT OFFICIEL</div>
  </div>
  ${memberHeader(m)}

  <h2>CHAPITRE I : DISCIPLINE, MAÎTRISE DE SOI ET CODE D'HONNEUR</h2>
  <h3>ARTICLE 1 : DISCIPLINE COMMUNAUTAIRE</h3>
  <p>L'Institut Moisson n'est pas qu'une plateforme d'apprentissage ou de commerce ; c'est une famille d'honneur. Chaque membre doit traiter ses pairs avec le respect, la loyauté et la bienveillance dus à un membre de sa propre famille. La calomnie, la trahison et la division au sein du réseau sont sévèrement sanctionnées.</p>
  <h3>ARTICLE 2 : MAÎTRISE DE SOI ET ORDRE PUBLIC</h3>
  <p>Les membres formés par l'Institut, notamment au sein du Pôle Security Vanguard (pôle d'élite, pôle de solidarité), doivent faire preuve d'une maîtrise de soi absolue. L'usage de la force, de la provocation, de l'intimidation ou l'implication dans des troubles à l'ordre public est strictement interdit. Le Moissonneur est un bâtisseur de paix et de sécurité au service de l'État et de la communauté.</p>

  <h2>CHAPITRE II : COMMERCE EN GROS ET RÉGULATION DES MARCHÉS</h2>
  <h3>ARTICLE 3 : STATUT DE MEMBRE DISTRIBUTEUR</h3>
  <p>Tout membre ayant validé son profil a accès au catalogue de gros de l'Institut. Il est autorisé à revendre les produits de consommation (agroalimentaire, cosmétiques, technologies) en appliquant des marges conformes aux grilles de prix indicatives fixées par l'application pour éviter toute concurrence déloyale entre Moissonneurs.</p>
  <h3>ARTICLE 4 : GESTION DES POINTS VALEURS (PV)</h3>
  <p>Les achats de produits de gros effectués par un membre ou par sa lignée descendante (downline) génèrent des Points Valeurs (PV). Ces PV sont accumulés mensuellement et convertis automatiquement en bonus financiers sur le portefeuille intégré de l'utilisateur. Toute manipulation frauduleuse du volume de PV ou fausse déclaration entraîne le blocage immédiat du compte.</p>

  <h2>CHAPITRE III : WALLET MSN ET MARKETING RELATIONNEL</h2>
  <h3>ARTICLE 5 : TRANSPARENCE DU RÉSEAU MLM</h3>
  <p>L'écosystème utilise le marketing de réseau pour propager son modèle. Le parrainage doit être basé sur l'explication honnête de la vision de l'Institut. Il est interdit de présenter l'application comme un système de placement d'argent passif (Ponzi). Les gains proviennent exclusivement du travail réel : vente de produits de gros et distribution de packs de formation.</p>
  <h3>ARTICLE 6 : RÈGLES DE RETRAIT ET DE SÉCURITÉ DU WALLET</h3>
  <p>Le Wallet MSN est strictement personnel. L'utilisateur est responsable de la confidentialité de ses codes d'accès. Les commissions MLM et marges de gros créditées sont retirables selon les paliers techniques configurés dans l'application, après déduction automatique de la quote-part obligatoire destinée au Fonds Communautaire de Solidarité.</p>

  <h2>CHAPITRE IV : DIPLÔMES ET INSIGNES OFFICIELS</h2>
  <h3>ARTICLE 7 : ACCOMPLISSEMENT DU CURSUS ACADÉMIQUE</h3>
  <p>L'acquisition d'un pack de formation ne vaut pas obtention du diplôme. Le membre doit obligatoirement suivre l'intégralité des modules en ligne et sur le terrain, et obtenir la moyenne requise aux examens supervisés par le consortium (Institut, Partenaires Privés et Autorités Étatiques).</p>
  <h3>ARTICLE 8 : PORT DE L'UNIFORME ET INSIGNES PROTÉGÉS</h3>
  <p>L'uniforme d'apparat officiel (la veste d'honneur varoise rose clair kaki) et l'Insigne officiel des Moissonneurs sont des marques déposées et protégées auprès de l'OAPI. Le port de l'uniforme complet est strictement réservé aux cérémonies officielles, sur autorisation écrite expresse du Haut Conseil d'Éthique. Tout usage abusif entraîne exclusion immédiate et poursuites pénales.</p>

  <h2>CHAPITRE V : SANCTIONS ET EXCLUSIONS</h2>
  <h3>ARTICLE 9 : ÉCHELLE DES SANCTIONS</h3>
  <ul>
    <li>Avertissement numérique avec notification dans l'application.</li>
    <li>Suspension temporaire du Wallet MSN et blocage des liens de parrainage.</li>
    <li>Révocation des droits de distribution de gros.</li>
    <li>Exclusion définitive de la Communauté avec suppression du compte et perte des droits sur le réseau constitué.</li>
  </ul>
  <h3>ARTICLE 10 : SIGNATURE ET ACCEPTATION REQUISES</h3>
  <p>L'acceptation du présent Règlement Intérieur est obligatoire lors de la première connexion à l'application. Elle est matérialisée par une case à cocher électronique qui lie juridiquement le membre à l'Institut Moisson, avec la même valeur qu'une signature manuscrite.</p>

  <div class="footer">
    <p>Règlement intérieur — Adhérent : ${m.fullName} (${m.referralCode})</p>
    <p>Empreinte: IM-RGI-${m.userId.substring(0,8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}</p>
    <p>Généré le ${new Date().toLocaleString("fr-FR")}</p>
  </div>
  </body></html>`;
  openPrint(html);
};