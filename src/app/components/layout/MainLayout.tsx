import { Outlet, NavLink } from "react-router";
import { LayoutDashboard, Inbox, Users, CreditCard, TrendingUp, BarChart3, Network, Settings } from "lucide-react";

export function MainLayout() {
  const navItems = [
    { to: "/app", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/app/inbox", icon: Inbox, label: "Inbox" },
    { to: "/app/leads", icon: Users, label: "Leads" },
    { to: "/app/payments", icon: CreditCard, label: "Payments" },
    { to: "/app/finance", icon: TrendingUp, label: "Finance" },
    { to: "/app/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/app/architecture", icon: Network, label: "Architecture" },
    { to: "/app/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="tracking-tight">FlowOps AI</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Business Automation</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/app"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
