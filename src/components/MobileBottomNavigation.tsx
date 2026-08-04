import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingDown, Database, SlidersHorizontal, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  projectId?: string;
  experimentId?: string;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavProps> = ({
  projectId = 'proj_northlight_01',
  experimentId = 'exp_23a'
}) => {
  const basePath = `/projects/${projectId}/experiments/${experimentId}`;

  const navItems = [
    { label: 'Finding', path: `${basePath}/finding`, icon: TrendingDown },
    { label: 'Evidence', path: `${basePath}/evidence`, icon: Database },
    { label: 'Test', path: `${basePath}/test`, icon: SlidersHorizontal },
    { label: 'More', path: `${basePath}/more`, icon: MoreHorizontal }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-mobile-height)',
        backgroundColor: 'var(--surface-1)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justify: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? 'var(--violet)' : 'var(--muted)',
              fontSize: '11px',
              fontWeight: isActive ? 600 : 400,
              minWidth: '64px',
              minHeight: '44px',
              padding: '6px'
            })}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
