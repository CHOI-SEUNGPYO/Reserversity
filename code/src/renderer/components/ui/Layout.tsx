import React, { useState } from 'react';
import { NavLink, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Box, Shield, Download, Bell, Settings, User, Menu, X, UserX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NewReservationDrawer } from './NewReservationDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isNewReservationOpen = searchParams.get('new') === 'true';
  const closeReservationDrawer = () => {
    // Navigate back to the same pathname to clear search params, preserving state
    navigate(location.pathname);
  };

  const navItems = [
    { label: '대시보드', icon: <LayoutGrid className="w-5 h-5" />, path: '/' },
    { label: '자원 관리', icon: <Box className="w-5 h-5" />, path: '/resources' },
    { label: '제재 관리', icon: <UserX className="w-5 h-5" />, path: '/permissions' },
    { label: '내보내기', icon: <Download className="w-5 h-5" />, path: '/export' },
  ];

  return (
    <div className="flex h-screen w-full bg-background font-sans relative overflow-hidden">
      
      {/* Backdrop for mobile/drawer sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-[260px] border-r border-[#E2E8F0] bg-[#F1F5F9] flex flex-col z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="h-[64px] flex justify-between items-center px-6">
          <div className="flex flex-col justify-center">
            <div 
              className="flex items-center gap-2 text-primary font-bold text-[22px] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => { navigate('/'); setIsOpen(false); }}
            >
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-lg leading-none">R</div>
              Reserversity
            </div>
            <div className="text-[11px] font-semibold text-secondary ml-10 mt-[-2px]">
              관리자 콘솔
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)} // Close on navigate
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-[15px] font-medium transition-colors relative",
                  isActive
                    ? "bg-[#dbe1ff] text-primary" // bg-primary-fixed
                    : "text-secondary hover:bg-slate-200"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[70%] bg-primary rounded-r-md" />
                  )}
                  {React.cloneElement(item.icon, {
                    className: cn("w-[18px] h-[18px]", isActive ? "text-primary" : "text-slate-500")
                  })}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-slate-700">Admin User</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header (64px) */}
        <header className="h-[64px] flex-shrink-0 border-b border-[#E2E8F0] bg-surface-container-lowest flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsOpen(true)}
              className="text-slate-500 hover:text-primary transition-colors p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            {!isOpen && (
              <button 
                onClick={() => navigate('/')}
                className="font-bold text-primary text-xl tracking-tight hidden sm:block hover:opacity-80 transition-opacity"
              >
                Reserversity
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Global Slide-out Drawer for New Reservation */}
      <NewReservationDrawer isOpen={isNewReservationOpen} onClose={closeReservationDrawer} />
    </div>
  );
}
