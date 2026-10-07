import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";
import clsx from "clsx";
import "./App.css";

const navItems = [
  { path: "/", label: "Calendar", icon: "▦" },
  { path: "/birthdays", label: "Birthdays", icon: "✦" },
  { path: "/crops", label: "Almanac", icon: "♧" },
  { path: "/profitability", label: "Gold guide", icon: "◎" },
  { path: "/characters", label: "Neighbors", icon: "♙" },
];

export default function Layout() {
  const { season, colors } = useTheme();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={clsx("app-shell min-h-screen transition-colors duration-500", colors.background, colors.text)}>
      <nav className="nav-shell" aria-label="Main navigation">
        <div className="nav-inner">
          <div className="brand"><span className="brand-mark">✿</span><span className="brand-copy"><strong>Mineral Town</strong><span>field journal</span></span></div>
          <div className="nav-links">
            {navItems.map((item) => <Link key={item.path} to={item.path} className={clsx("nav-link", isActive(item.path) && "active")}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span className="nav-label">{item.label}</span></Link>)}
          </div>
          <span className="season-chip">{season} season</span>
        </div>
      </nav>
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
