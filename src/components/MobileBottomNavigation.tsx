import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Database, FlaskConical, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  projectId?: string;
  experimentId?: string;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavProps> = ({
  projectId = 'proj_northlight_01',
  experimentId = 'exp_23a'
}) => {
  const location = useLocation();
  const basePath = `/projects/${projectId}/experiments/${experimentId}`;

  const navItems = [
    { label: 'Finding', path: `${basePath}/finding`, icon: Search, activeColor: '#8b5cf6' },
    { label: 'Evidence', path: `${basePath}/evidence`, icon: Database, activeColor: '#8b5cf6' },
    { label: 'Test', path: `${basePath}/test`, icon: FlaskConical, activeColor: '#8b5cf6' },
    { label: 'More', path: `${basePath}/more`, icon: MoreHorizontal, activeColor: '#8b5cf6' }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: '72px',
        height: '72px',
        backgroundColor: '#091218',
        borderTop: '1px solid #16232c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        boxSizing: 'border-box'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.includes(item.path);
        return (
          <NavLink
            key={item.label}
            to={`${item.path}${location.search}`}
            aria-current={isActive ? 'page' : undefined}
            style={() => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? item.activeColor : '#9aa8b2',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              minWidth: '64px',
              minHeight: '48px',
              padding: '6px'
            })}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? item.activeColor : '#9aa8b2'} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
