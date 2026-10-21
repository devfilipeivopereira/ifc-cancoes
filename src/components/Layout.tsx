import type { ComponentType } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "../lib/theme";
import { IconCalendar, IconHome, IconInsight, IconMoon, IconMusic, IconSun } from "./Icons";

const NAV: { to: string; label: string; end: boolean; icon: ComponentType<{ className?: string }> }[] = [
  { to: "/", label: "Início", end: true, icon: IconHome },
  { to: "/musicas", label: "Músicas", end: false, icon: IconMusic },
  { to: "/cultos", label: "Cultos", end: false, icon: IconCalendar },
  { to: "/insights", label: "Insights", end: false, icon: IconInsight },
];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen min-w-0 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <NavLink to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Igreja da Família Cristã, início">
              <img
                src={theme === "dark" ? "/logo-ifc-branco.png" : "/logo-ifc-roxo.png"}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold leading-tight">Igreja da Família Cristã</span>
                <span className="hidden text-xs text-muted sm:block">Repertório de louvor</span>
              </span>
            </NavLink>
            <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold ${isActive ? "bg-primary text-white" : "text-ink hover:bg-primary/10"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 lg:ml-2">
              <button
                type="button"
                className="btn btn-ghost h-11 w-11 !px-0"
                onClick={toggle}
                aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {theme === "dark" ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
              </button>
              <a
                className="btn btn-primary hidden sm:inline-flex"
                href="https://www.igrejafamiliacrista.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visitar
              </a>
            </div>
          </div>
        </header>
        <motion.main
          id="conteudo"
          key={location.pathname}
          className="min-w-0 flex-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          {children}
        </motion.main>
        <footer className="mt-12 border-t border-line bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={theme === "dark" ? "/logo-ifc-branco.png" : "/logo-ifc-roxo.png"}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <div>
                <p className="font-extrabold">Igreja da Família Cristã</p>
                <p className="text-sm text-muted">Uma Família para Pertencer</p>
              </div>
            </div>
            <p className="max-w-xl text-sm text-muted">
              Dados extraídos do WorshipTools Presenter; metadados das músicas gerados por IA e podem conter imprecisões. Este
              site não reproduz letras: o botão “Ver letra” abre uma página externa.
            </p>
          </div>
        </footer>
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Principal"
        >
          <div className="grid grid-cols-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-bold ${isActive ? "text-primary" : "text-muted"}`
                  }
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </MotionConfig>
  );
}
