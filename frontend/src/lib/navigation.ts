import { BarChart3, BriefcaseBusiness, Clock3, FileText, FolderKanban, LayoutDashboard, PackageSearch, ShieldAlert, UserRoundPlus, Users } from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/employee-allocations", label: "Allocations", icon: UserRoundPlus },
  { href: "/timesheets", label: "Timesheets", icon: Clock3 },
  { href: "/budgets", label: "Budgets", icon: BriefcaseBusiness },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/material-requests", label: "Materials", icon: PackageSearch },
  { href: "/users", label: "Users", icon: Users },
  { href: "/risks", label: "Risks", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];
