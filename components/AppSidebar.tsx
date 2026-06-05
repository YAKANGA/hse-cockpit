import { demoSessions } from "@/lib/permissions";
import { tenants } from "@/lib/tenant-data";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MobileNavToggle } from "@/components/MobileNavToggle";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { TenantBrand } from "@/components/TenantBrand";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TopBarUser } from "@/components/TopBarUser";
import { TopNavLinks } from "@/components/TopNavLinks";
import { UserSessionSwitcher } from "@/components/UserSessionSwitcher";

export function AppSidebar() {
  return (
    <header className="topNav">
      <div className="topNavInner">
        <div className="topNavLeft">
          <TenantBrand tenants={tenants} />
        </div>

        <div className="topNavCenter">
          <TopNavLinks />
        </div>

        <div className="topNavRight">
          <GlobalSearch />
          <NotificationsPanel />
          <ThemeToggle />
          <TopBarUser />
          <MobileNavToggle />
        </div>
      </div>

      {/* Mobile expanded menu */}
      <div className="topNavMobileMenu">
        <TopNavLinks />
        <div className="topNavMobileExtras">
          <TenantSwitcher tenants={tenants} />
          <UserSessionSwitcher sessions={demoSessions} />
        </div>
      </div>
    </header>
  );
}
