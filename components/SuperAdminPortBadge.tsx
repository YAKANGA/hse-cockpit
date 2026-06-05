import { headers } from "next/headers";
import { LockKeyhole, Server } from "lucide-react";

export async function SuperAdminPortBadge() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3001";
  const port = host.includes(":") ? host.split(":")[1] : "443";
  const superAdminPort = process.env.SUPER_ADMIN_PORT ?? "3001";
  const isCorrectPort = port === superAdminPort;

  return (
    <div className={isCorrectPort ? "portBadge portBadgeSecure" : "portBadge portBadgeWarn"}>
      <div className="portBadgeLeft">
        <LockKeyhole size={16} />
        <strong>Interface Super-Admin</strong>
        <span className="portBadgeSep">—</span>
        <span>Acces restreint au port</span>
        <code className="portBadgeCode">:{superAdminPort}</code>
      </div>
      <div className="portBadgeRight">
        <Server size={14} />
        <span>Port actif :</span>
        <code className="portBadgeCode">:{port}</code>
        {isCorrectPort ? (
          <span className="status ok">Connexion securisee</span>
        ) : (
          <span className="status danger">Port incorrect</span>
        )}
      </div>
    </div>
  );
}
