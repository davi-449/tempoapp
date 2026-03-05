import { useState } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, BarChart3, UserCircle, LayoutDashboard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", icon: Home, path: "/" },
  { label: "Hub", icon: LayoutDashboard, path: "/hub" },
  { label: "Calendário", icon: CalendarDays, path: "/calendario" },
  { label: "Análise", icon: BarChart3, path: "/analise" },
  { label: "Perfil", icon: UserCircle, path: "/perfil" },
];

const MOBILE_LABEL_WIDTH = 72;

export function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIndex = navItems.findIndex(item => item.path === location.pathname);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-card border border-border rounded-full flex items-center p-2 shadow-xl space-x-1",
        "fixed inset-x-0 bottom-4 mx-auto z-40 w-fit max-w-[95vw] h-[52px]"
      )}
    >
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px]",
              isActive
                ? "bg-primary/10 text-primary gap-2"
                : "bg-transparent text-muted-foreground hover:bg-muted",
              "focus:outline-none focus-visible:ring-0"
            )}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            type="button"
          >
            <Icon
              size={22}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200"
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className="overflow-hidden flex items-center max-w-[72px]"
            >
              <span
                className={cn(
                  "font-medium text-xs whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis leading-[1.9]",
                  isActive ? "text-primary" : "opacity-0"
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
