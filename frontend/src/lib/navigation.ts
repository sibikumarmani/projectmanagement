import { BarChart3, BriefcaseBusiness, ClipboardCheck, FileText, Flag, FolderKanban, LayoutDashboard, PackageSearch, ShieldAlert, Trees } from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/wbs", label: "WBS", icon: Trees },
  { href: "/milestones", label: "Milestones", icon: Flag },
  { href: "/activities", label: "Activities", icon: ClipboardCheck },
  { href: "/budgets", label: "Budgets", icon: BriefcaseBusiness },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/material-requests", label: "Materials", icon: PackageSearch },
  { href: "/risks", label: "Risks", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];
