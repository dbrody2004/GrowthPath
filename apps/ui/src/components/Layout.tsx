import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Icon, type IconName } from './Icon.js';

const SIDEBAR_COLLAPSED_KEY = 'growthpath.sidebarCollapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

const navItems: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/scans', label: 'Scans', icon: 'list_alt' },
  { to: '/jobs', label: 'Jobs', icon: 'work' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/scans': 'Scans',
  '/scans/new': 'New Scan Details',
  '/jobs': 'Jobs',
  '/settings': 'Settings',
};

function resolvePageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/scans/') && pathname.endsWith('/print')) return 'Printable Report';
  if (pathname === '/scans/new') return 'New Scan Details';
  if (pathname.startsWith('/scans/')) return 'Scan Report';
  return 'GrowthPath';
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = resolvePageTitle(location.pathname);
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand" title="GrowthPath">
              GP
            </div>
            <span className="sidebar-brand-text">GrowthPath</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={20} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={22} />
              <span className="sidebar-nav-label" aria-hidden={collapsed ? true : undefined}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div className="header-bar">
          <div className="header-bar-left">
            <Icon name="insights" size={22} className="header-logo-icon" />
            <h1 className="header-title">{title}</h1>
          </div>
          <div className="header-bar-right">
            {user && (
              <span className="user-chip">
                <Icon name="account_circle" size={18} />
                {user.email}
              </span>
            )}
            <button
              type="button"
              className="secondary icon-btn"
              onClick={() => void logout()}
              title="Sign out"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
