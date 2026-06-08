import { Crown, Shield } from "lucide-react";

export function SuperAdminPortBadge() {
  return (
    <div className="portBadge portBadgeSecure">
      <div className="portBadgeLeft">
        <Crown size={16} />
        <strong>Interface Super-Admin</strong>
        <span className="portBadgeSep">—</span>
        <span>Acces plateforme global</span>
      </div>
      <div className="portBadgeRight">
        <Shield size={14} />
        <span className="status ok">Connexion securisee</span>
      </div>
    </div>
  );
}
