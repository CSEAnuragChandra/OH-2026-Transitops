// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel,
  DollarSign, ShieldCheck, LogOut, ChevronRight, Gauge,
  BarChart3, Sun, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  },
  {
    label: "Fleet",
    href: "/fleet",
    icon: <Truck className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "DISPATCHER"],
  },
  {
    label: "Drivers",
    href: "/drivers",
    icon: <Users className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
  },
  {
    label: "Trips",
    href: "/trips",
    icon: <Route className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "DISPATCHER"],
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: <Wrench className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
  },
  {
    label: "Fuel Logs",
    href: "/fuel",
    icon: <Fuel className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: <DollarSign className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "FINANCIAL_ANALYST"],
  },
  {
    label: "Safety",
    href: "/safety",
    icon: <ShieldCheck className="w-4 h-4" />,
    roles: ["FLEET_MANAGER", "SAFETY_OFFICER"],
  },
];

const roleLabelMap: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
  DRIVER: "Driver",
};

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: Role;
}

export function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const filtered = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className="flex flex-col h-screen w-60 shrink-0 border-r"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
          <Gauge className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white">TransitOps</span>
          <span className="block text-[10px] text-slate-500">{roleLabelMap[userRole]}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {filtered.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "bg-blue-600/20 text-blue-400 font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <span className={cn("shrink-0", active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Controls */}
      <div className="border-t p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 text-xs w-full px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-800"
          style={{ color: "var(--fg-muted)" }}
          title="Toggle light/dark mode"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Switch to Light Mode
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              Switch to Dark Mode
            </>
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
