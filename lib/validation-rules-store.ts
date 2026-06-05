import type { ValidationRule } from "@/lib/operations-data";
import { validationRules as seedRules } from "@/lib/operations-data";

let store: ValidationRule[] = seedRules.map((r) => ({ ...r }));

export function getValidationRules(): ValidationRule[] {
  return store.map((r) => ({ ...r }));
}

export function createValidationRule(input: Omit<ValidationRule, "id">): ValidationRule {
  const rule: ValidationRule = { ...input, id: `rule-${Date.now()}` };
  store = [rule, ...store];
  return { ...rule };
}

export function updateValidationRule(id: string, patch: Partial<Omit<ValidationRule, "id">>): ValidationRule | null {
  const idx = store.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store[idx] = { ...store[idx], ...patch };
  return { ...store[idx] };
}

export function deleteValidationRule(id: string): boolean {
  const before = store.length;
  store = store.filter((r) => r.id !== id);
  return store.length < before;
}

export function toggleValidationRule(id: string): ValidationRule | null {
  const rule = store.find((r) => r.id === id);
  if (!rule) return null;
  return updateValidationRule(id, { status: rule.status === "Active" ? "Brouillon" : "Active" });
}
