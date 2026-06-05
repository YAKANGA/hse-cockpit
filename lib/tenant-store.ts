import { tenants as tenantSeeds, type Tenant } from "@/lib/tenant-data";

type CreateTenantInput = {
  name: string;
  sector?: string;
  country?: string;
  admin: string;
};

type UpdateTenantInput = Partial<Omit<Tenant, "id">>;

let tenantStore: Tenant[] = tenantSeeds.map((tenant) => ({
  ...tenant,
  modules: [...tenant.modules],
  preferences: { ...tenant.preferences },
}));

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || `tenant-${Date.now()}`;
}

function ensureUniqueTenantId(baseId: string) {
  let candidate = baseId;
  let index = 2;

  while (tenantStore.some((tenant) => tenant.id === candidate)) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }

  return candidate;
}

export function getTenants() {
  return tenantStore.map((tenant) => ({
    ...tenant,
    modules: [...tenant.modules],
    preferences: { ...tenant.preferences },
  }));
}

export function getTenantById(tenantId: string) {
  const tenant = tenantStore.find((item) => item.id === tenantId);

  return tenant
    ? {
        ...tenant,
        modules: [...tenant.modules],
        preferences: { ...tenant.preferences },
      }
    : undefined;
}

export function createTenant(input: CreateTenantInput) {
  const name = input.name.trim();
  const admin = input.admin.trim();

  if (!name || !admin) {
    return null;
  }

  const id = ensureUniqueTenantId(slugify(name));
  const tenant: Tenant = {
    id,
    name,
    sector: input.sector?.trim() || "Non renseigne",
    country: input.country?.trim() || "Cote d'Ivoire",
    status: "Configuration",
    admin,
    modules: ["events", "actions", "indicators"],
    users: 1,
    preferences: {
      primaryColor: "#0f766e",
      secondaryColor: "#101828",
      logoText: name.slice(0, 2).toUpperCase(),
      dashboardDensity: "Standard",
      language: "fr",
    },
  };

  tenantStore = [tenant, ...tenantStore];

  return getTenantById(id);
}

export function updateTenant(tenantId: string, input: UpdateTenantInput) {
  const existing = tenantStore.find((tenant) => tenant.id === tenantId);

  if (!existing) {
    return null;
  }

  tenantStore = tenantStore.map((tenant) =>
    tenant.id === tenantId
      ? {
          ...tenant,
          ...input,
          modules: input.modules ? [...input.modules] : tenant.modules,
          preferences: input.preferences
            ? { ...tenant.preferences, ...input.preferences }
            : tenant.preferences,
        }
      : tenant,
  );

  return getTenantById(tenantId);
}
