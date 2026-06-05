"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Palette, Plus, UserCog } from "lucide-react";
import { modules } from "@/lib/hse-data";
import type { Tenant } from "@/lib/tenant-data";

type SuperAdminTenantManagerProps = {
  initialTenants: Tenant[];
};

const emptyTenant = {
  name: "",
  sector: "",
  country: "Cote d'Ivoire",
  admin: "",
};

export function SuperAdminTenantManager({ initialTenants }: SuperAdminTenantManagerProps) {
  const [tenants, setTenants] = useState(initialTenants);
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenants[0]?.id ?? "");
  const [draftTenant, setDraftTenant] = useState(emptyTenant);
  const [saveStatus, setSaveStatus] = useState("Synchronise");
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0];

  const activeModules = useMemo(() => new Set(selectedTenant?.modules ?? []), [selectedTenant]);

  useEffect(() => {
    async function loadTenants() {
      const response = await fetch("/api/tenants?userId=super-admin");
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setTenants(payload.data);
      setSelectedTenantId((current) => current || (payload.data[0]?.id ?? ""));
    }

    loadTenants();
  }, []);

  function notifyTenantConfig(tenant: Tenant) {
    window.dispatchEvent(new CustomEvent("hse-tenant-config-change", { detail: { tenant } }));
  }

  function applyTenantPatch(patch: Partial<Tenant>) {
    if (!selectedTenant) {
      return null;
    }

    let updatedTenant: Tenant | null = null;
    setTenants((current) =>
      current.map((tenant) => {
        if (tenant.id !== selectedTenant.id) {
          return tenant;
        }

        updatedTenant = {
          ...tenant,
          ...patch,
          preferences: patch.preferences ? { ...tenant.preferences, ...patch.preferences } : tenant.preferences,
        };

        return updatedTenant;
      }),
    );

    return updatedTenant;
  }

  async function persistTenantPatch(patch: Partial<Tenant>) {
    if (!selectedTenant) {
      return;
    }

    const optimisticTenant = applyTenantPatch(patch);
    if (optimisticTenant) {
      notifyTenantConfig(optimisticTenant);
    }

    setSaveStatus("Enregistrement...");

    const response = await fetch(`/api/tenants/${selectedTenant.id}?userId=super-admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSaveStatus("Erreur sauvegarde");
      return;
    }

    const payload = await response.json();
    setTenants((current) => current.map((tenant) => (tenant.id === payload.data.id ? payload.data : tenant)));
    notifyTenantConfig(payload.data);
    setSaveStatus("Synchronise");
  }

  function updatePreference(key: keyof Tenant["preferences"], value: string) {
    if (!selectedTenant) {
      return;
    }

    persistTenantPatch({
      preferences: {
        ...selectedTenant.preferences,
        [key]: value,
      },
    });
  }

  function toggleModule(moduleId: string) {
    if (!selectedTenant) {
      return;
    }

    const nextModules = activeModules.has(moduleId)
      ? selectedTenant.modules.filter((item) => item !== moduleId)
      : [...selectedTenant.modules, moduleId];

    persistTenantPatch({ modules: nextModules });
  }

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftTenant.name.trim() || !draftTenant.admin.trim()) {
      return;
    }

    setSaveStatus("Creation...");

    const response = await fetch("/api/tenants?userId=super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftTenant),
    });

    if (!response.ok) {
      setSaveStatus("Erreur creation");
      return;
    }

    const payload = await response.json();
    const tenant = payload.data as Tenant;
    setTenants((current) => [tenant, ...current.filter((item) => item.id !== tenant.id)]);
    setSelectedTenantId(tenant.id);
    setDraftTenant(emptyTenant);
    setSaveStatus("Synchronise");
  }

  if (!selectedTenant) {
    return null;
  }

  return (
    <section className="superAdminManager">
      <article className="panel">
        <div className="panelHeader">
          <div>
            <h2>Creation entreprise</h2>
            <p>Le Super Admin cree l'entreprise et nomme son administrateur principal.</p>
          </div>
          <Plus size={22} />
        </div>
        <form className="tenantCreateForm" onSubmit={createTenant}>
          <label>
            Nom entreprise
            <input value={draftTenant.name} onChange={(event) => setDraftTenant({ ...draftTenant, name: event.target.value })} />
          </label>
          <label>
            Secteur
            <input value={draftTenant.sector} onChange={(event) => setDraftTenant({ ...draftTenant, sector: event.target.value })} />
          </label>
          <label>
            Pays
            <input value={draftTenant.country} onChange={(event) => setDraftTenant({ ...draftTenant, country: event.target.value })} />
          </label>
          <label>
            Admin entreprise
            <input value={draftTenant.admin} onChange={(event) => setDraftTenant({ ...draftTenant, admin: event.target.value })} />
          </label>
          <button className="primaryButton" type="submit">
            <Building2 size={18} />
            Creer l'entreprise
          </button>
        </form>
      </article>

      <article className="panel tenantConfigurator">
        <div className="panelHeader">
          <div>
            <h2>Configuration entreprise</h2>
            <p>Selectionner une entreprise puis ajuster ses modules, preferences et administrateur.</p>
          </div>
          <span className="status ok">{saveStatus}</span>
        </div>

        <div className="tenantSelector">
          {tenants.map((tenant) => (
            <button
              className={tenant.id === selectedTenant.id ? "selected" : ""}
              key={tenant.id}
              onClick={() => setSelectedTenantId(tenant.id)}
              type="button"
            >
              <span className="tenantMiniLogo" style={{ background: tenant.preferences.primaryColor }}>
                {tenant.preferences.logoText}
              </span>
              {tenant.name}
            </button>
          ))}
        </div>

        <div className="tenantConfigGrid">
          <div className="tenantPreview" style={{ "--tenant-primary": selectedTenant.preferences.primaryColor, "--tenant-secondary": selectedTenant.preferences.secondaryColor } as React.CSSProperties}>
            <span>{selectedTenant.preferences.logoText}</span>
            <strong>{selectedTenant.name}</strong>
            <small>{selectedTenant.sector} - {selectedTenant.status}</small>
          </div>

          <div className="tenantPreferencesEditor">
            <h3><Palette size={18} /> Preferences</h3>
            <label>
              Logo texte
              <input value={selectedTenant.preferences.logoText} onChange={(event) => updatePreference("logoText", event.target.value.toUpperCase())} />
            </label>
            <label>
              Couleur principale
              <input type="color" value={selectedTenant.preferences.primaryColor} onChange={(event) => updatePreference("primaryColor", event.target.value)} />
            </label>
            <label>
              Couleur secondaire
              <input type="color" value={selectedTenant.preferences.secondaryColor} onChange={(event) => updatePreference("secondaryColor", event.target.value)} />
            </label>
            <label>
              Densite dashboard
              <select value={selectedTenant.preferences.dashboardDensity} onChange={(event) => updatePreference("dashboardDensity", event.target.value)}>
                <option>Compact</option>
                <option>Standard</option>
                <option>Detaille</option>
              </select>
            </label>
          </div>

          <div className="tenantAdminEditor">
            <h3><UserCog size={18} /> Admin entreprise</h3>
            <label>
              Administrateur principal
              <input value={selectedTenant.admin} onChange={(event) => persistTenantPatch({ admin: event.target.value })} />
            </label>
            <label>
              Statut entreprise
              <select value={selectedTenant.status} onChange={(event) => persistTenantPatch({ status: event.target.value as Tenant["status"] })}>
                <option>Actif</option>
                <option>Configuration</option>
                <option>Suspendu</option>
              </select>
            </label>
          </div>
        </div>

        <div className="moduleActivation">
          <h3>Modules mis a disposition</h3>
          <div>
            {modules.map((module) => {
              const enabled = activeModules.has(module.id);
              return (
                <button className={enabled ? "enabled" : ""} key={module.id} onClick={() => toggleModule(module.id)} type="button">
                  {enabled ? <Check size={16} /> : null}
                  {module.shortName}
                </button>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
