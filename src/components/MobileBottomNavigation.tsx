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
    { label: 'FINDING', path: `${basePath}/finding`, icon: Search, activeColor: '#8b5cf6' },
    { label: 'EVIDENCE', path: `${basePath}/evidence`, icon: Database, activeColor: '#8b5cf6' },
    { label: 'TEST', path: `${basePath}/test`, icon: FlaskConical, activeColor: '#b7e33d' },
    { label: 'MORE', path: `${basePath}/more`, icon: MoreHorizontal, activeColor: '#8b5cf6' }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#091218',
        borderTop: '1px solid #16232c',
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
            to={`${item.path}${location.search}`}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? item.activeColor : '#9aa8b2',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              minWidth: '64px',
              minHeight: '44px',
              padding: '6px'
            })}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
