// Utilitaires d'export CSV et de génération d'affiche partenaire.
// Utilisés par les tableaux de bord admin/gestionnaires pour télécharger
// les commandes, mises à disposition, commandes hors-catalogue par utilisateur,
// jour, semaine ou année.

export type PeriodFilter = "all" | "today" | "week" | "month" | "year";

/** Renvoie true si la date est dans la période demandée. */
export const inPeriod = (dateStr: string | Date, period: PeriodFilter): boolean => {
  if (period === "all") return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  if (period === "today") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }
  if (period === "week") {
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }
  if (period === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === "year") {
    return d.getFullYear() === now.getFullYear();
  }
  return true;
};

const escapeCell = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralise les injections de formule (Excel/CSV injection)
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

/**
 * Génère et télécharge un fichier CSV.
 * @param filename nom du fichier sans extension
 * @param headers  en-têtes (colonnes)
 * @param rows     tableau de tableaux
 */
export const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const bom = "\uFEFF"; // pour Excel
  const csv =
    bom +
    [headers.map(escapeCell).join(","), ...rows.map(r => r.map(escapeCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** Ouvre une nouvelle fenêtre imprimable contenant l'affiche de présentation d'un partenaire. */
export const openPartnerPoster = (c: {
  name: string;
  sector?: string;
  country?: string;
  countries?: string[] | null;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  image_url_2?: string | null;
  website_url?: string | null;
  contact_whatsapp?: string | null;
  contact_facebook?: string | null;
  contact_email?: string | null;
}) => {
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;
  const zones = (c.countries && c.countries.length) ? c.countries.join(" • ") : "Universel / International";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Affiche — ${c.name}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif}
      body{background:linear-gradient(135deg,#f5f0ff 0%,#fff 60%,#fef3c7 100%);padding:32px;color:#1a1033}
      .poster{max-width:820px;margin:auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(80,20,140,.18);border:2px solid #e2ceff}
      .banner{height:220px;background:linear-gradient(135deg,#6b21a8,#c084fc);display:flex;align-items:center;justify-content:center;color:white;font-size:64px}
      .banner img{width:100%;height:100%;object-fit:cover}
      .body{padding:32px}
      .header{display:flex;align-items:center;gap:20px;margin-bottom:20px}
      .logo{width:90px;height:90px;border-radius:20px;object-fit:cover;border:3px solid #ffd700;background:white}
      h1{font-size:32px;color:#4c1d95;font-weight:900;letter-spacing:-.5px}
      .badge{display:inline-block;padding:4px 12px;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px}
      .zone{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:linear-gradient(90deg,#fef3c7,#fde68a);color:#92400e;font-weight:700;font-size:13px;margin-top:8px}
      .desc{color:#3f2b5c;line-height:1.6;margin:16px 0;font-size:15px}
      .contacts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;padding-top:20px;border-top:2px dashed #e2ceff}
      .contact{padding:10px 14px;border-radius:12px;background:#faf6ff;font-size:13px;color:#4c1d95}
      .contact b{display:block;color:#6d28d9;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
      .gallery{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
      .gallery img{width:100%;height:180px;object-fit:cover;border-radius:12px;border:1px solid #eee}
      .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#888;font-size:11px}
      @media print{body{background:white;padding:0}.poster{box-shadow:none;border-radius:0;border:none}}
    </style></head><body>
    <div class="poster">
      <div class="banner">${c.banner_url ? `<img src="${c.banner_url}" alt="">` : "🏢"}</div>
      <div class="body">
        <div class="header">
          ${c.logo_url ? `<img class="logo" src="${c.logo_url}" alt="logo">` : ""}
          <div>
            <h1>${c.name}</h1>
            ${c.sector ? `<span class="badge">${c.sector}</span>` : ""}
            <div class="zone">📍 ${zones}</div>
          </div>
        </div>
        ${c.description ? `<p class="desc">${c.description}</p>` : ""}
        ${c.image_url_2 ? `<div class="gallery"><img src="${c.image_url_2}" alt=""></div>` : ""}
        <div class="contacts">
          ${c.website_url ? `<div class="contact"><b>Site Web</b>${c.website_url}</div>` : ""}
          ${c.contact_whatsapp ? `<div class="contact"><b>WhatsApp</b>${c.contact_whatsapp}</div>` : ""}
          ${c.contact_email ? `<div class="contact"><b>Email</b>${c.contact_email}</div>` : ""}
          ${c.contact_facebook ? `<div class="contact"><b>Facebook</b>${c.contact_facebook}</div>` : ""}
        </div>
        <div class="footer">Partenaire officiel Institut Moisson — ${new Date().toLocaleDateString("fr-FR")}</div>
      </div>
    </div>
    <script>setTimeout(()=>window.print(),600)</script>
    </body></html>`;
  win.document.write(html);
  win.document.close();
};

/** Petit composant utilitaire de filtre période à réutiliser. */
export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];