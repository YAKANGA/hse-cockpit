export type PpeRecord = {
  reference: string;
  designation: string;
  categorie: string;
  norme: string;
  risqueCouvert: string;
  site: string;
  quantiteStock: number;
  quantiteAttribuee: number;
  quantiteDisponible: number;
  dateAchat: string;
  dateExpiration: string;
  controlePeriodique: string;
  fournisseur: string;
  coutUnitaire: number;
  observations: string;
};

export const ppeRecords: PpeRecord[] = [
  {
    reference: "EPI-005",
    designation: "Gants anti-coupure Niv. 5",
    categorie: "Protection mains",
    norme: "EN 388",
    risqueCouvert: "Coupure / abrasion",
    site: "Abidjan",
    quantiteStock: 100,
    quantiteAttribuee: 87,
    quantiteDisponible: 13,
    dateAchat: "2026-01-15",
    dateExpiration: "2026-07-15",
    controlePeriodique: "Selon usure",
    fournisseur: "Honeywell",
    coutUnitaire: 4500,
    observations: "Kevlar - remplacer si coupure",
  },
  {
    reference: "EPI-006",
    designation: "Masque FFP2 NR",
    categorie: "Protection voies respiratoires",
    norme: "EN 149",
    risqueCouvert: "Poussieres / aerosols",
    site: "Abidjan",
    quantiteStock: 200,
    quantiteAttribuee: 156,
    quantiteDisponible: 44,
    dateAchat: "2026-01-10",
    dateExpiration: "2026-12-31",
    controlePeriodique: "Usage unique",
    fournisseur: "3M CI",
    coutUnitaire: 850,
    observations: "Usage unique - 8h max",
  },
  {
    reference: "EPI-007",
    designation: "Gilet haute visibilite",
    categorie: "Visibilite",
    norme: "EN ISO 20471",
    risqueCouvert: "Heurt engins",
    site: "Bouake",
    quantiteStock: 70,
    quantiteAttribuee: 65,
    quantiteDisponible: 5,
    dateAchat: "2026-02-20",
    dateExpiration: "2028-02-20",
    controlePeriodique: "Mensuel",
    fournisseur: "Portwest",
    coutUnitaire: 3200,
    observations: "Classe 2 - voirie",
  },
  {
    reference: "EQP-001",
    designation: "Trousse de secours",
    categorie: "Premiers secours",
    norme: "NF S 90-010",
    risqueCouvert: "Blessures legeres",
    site: "Yamoussoukro",
    quantiteStock: 8,
    quantiteAttribuee: 8,
    quantiteDisponible: 0,
    dateAchat: "2026-01-20",
    dateExpiration: "2027-01-20",
    controlePeriodique: "Mensuel",
    fournisseur: "Pharma BTP",
    coutUnitaire: 45000,
    observations: "Verification contenu mensuelle",
  },
  {
    reference: "EPI-013",
    designation: "Casque anti-bruit 30dB",
    categorie: "Protection auditive",
    norme: "EN 352-1",
    risqueCouvert: "Bruit fort",
    site: "San Pedro",
    quantiteStock: 45,
    quantiteAttribuee: 30,
    quantiteDisponible: 15,
    dateAchat: "2026-01-26",
    dateExpiration: "2028-07-23",
    controlePeriodique: "Trimestriel",
    fournisseur: "Portwest",
    coutUnitaire: 15000,
    observations: "Verifier stock",
  },
  {
    reference: "EPI-016",
    designation: "Trepied evacuation",
    categorie: "Espace confine",
    norme: "EN 795",
    risqueCouvert: "Sauvetage",
    site: "Bouake",
    quantiteStock: 37,
    quantiteAttribuee: 18,
    quantiteDisponible: 19,
    dateAchat: "2026-02-22",
    dateExpiration: "2029-02-22",
    controlePeriodique: "Avant chaque usage",
    fournisseur: "Uvex CI",
    coutUnitaire: 380000,
    observations: "RAS",
  },
];

export function getPpeSummary(records = ppeRecords) {
  const totalStock = records.reduce((sum, item) => sum + item.quantiteStock, 0);
  const totalAttributed = records.reduce((sum, item) => sum + item.quantiteAttribuee, 0);
  const totalAvailable = records.reduce((sum, item) => sum + item.quantiteDisponible, 0);
  const inventoryValue = records.reduce((sum, item) => sum + item.quantiteStock * item.coutUnitaire, 0);
  const today = new Date("2026-06-02");
  const soonThreshold = new Date(today);
  soonThreshold.setDate(today.getDate() + 90);
  const expired = records.filter((item) => new Date(item.dateExpiration) < today).length;
  const expiringSoon = records.filter((item) => {
    const expiration = new Date(item.dateExpiration);
    return expiration >= today && expiration <= soonThreshold;
  }).length;
  const lowStock = records.filter((item) => item.quantiteDisponible <= Math.max(5, item.quantiteStock * 0.1)).length;
  const anomalies = records.filter((item) => item.quantiteStock - item.quantiteAttribuee !== item.quantiteDisponible).length;

  return {
    totalStock,
    totalAttributed,
    totalAvailable,
    inventoryValue,
    expired,
    expiringSoon,
    lowStock,
    anomalies,
    availabilityRate: totalStock ? Math.round((totalAvailable / totalStock) * 100) : 0,
  };
}

export function getPpeCategoryBreakdown(records = ppeRecords) {
  return Object.values(
    records.reduce<Record<string, { categorie: string; stock: number; disponible: number }>>((acc, item) => {
      acc[item.categorie] ??= { categorie: item.categorie, stock: 0, disponible: 0 };
      acc[item.categorie].stock += item.quantiteStock;
      acc[item.categorie].disponible += item.quantiteDisponible;
      return acc;
    }, {}),
  );
}
