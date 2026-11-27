import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { usePWA } from "@/hooks/usePWA";
import { CircleDot, History, BarChart3, Settings, Bell } from "lucide-react";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isOnline } = usePWA();

  const navItems = [
    { href: "/", label: "Counter", icon: CircleDot },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Stats", icon: BarChart3 },
    { href: "/notifications", label: "Reminders", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className="flex flex-col h-[100dvh] w-full overflow-hidden relative font-sans"
      style={{ background: "var(--theme-bg-gradient, hsl(var(--background)))" }}
    >
      <div className="flex-1 overflow-y-auto pb-[68px] relative z-10 w-full">
        {children}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: "linear-gradient(180deg, hsl(var(--background) / 0.7), hsl(var(--background) / 0.97))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "hsl(var(--primary) / 0.25)", boxShadow: "0 -12px 30px -14px hsl(var(--primary) / 0.45), inset 0 1px 0 hsl(var(--primary) / 0.2)",
        }}
      >
        <div className="flex justify-around items-center px-2 h-[68px] max-w-md mx-auto relative">
          {!isOnline && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative h-full"
              >
                <div className="relative p-1.5 rounded-xl transition-all duration-200">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.38), hsl(var(--primary) / 0.08))", border: "1px solid hsl(var(--primary) / 0.45)", boxShadow: "0 0 16px hsl(var(--primary) / 0.45)" }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className="w-5 h-5 relative z-10 transition-all duration-200"
                    style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-full w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
