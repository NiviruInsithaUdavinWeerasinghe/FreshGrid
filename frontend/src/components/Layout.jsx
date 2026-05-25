import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingNav from './FloatingNav';
import PromoBanner from './PromoBanner';

const Layout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/auth/callback'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-charcoal is-auth-layout">
        <style>{`
          .is-auth-layout .min-h-screen {
            min-height: unset !important;
            background-color: transparent !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            height: auto !important;
          }
        `}</style>
        <div className="flex-shrink-0 z-50">
          <Navbar />
        </div>
        <FloatingNav />
        <div className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-6">
          <div key={location.key} className="page-enter w-full flex items-center justify-center">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <PromoBanner />
      <Navbar />
      <FloatingNav />
      {/*
        key={location.key} forces React to unmount + remount the wrapper div
        on every navigation, which re-triggers the page-enter CSS animation.
      */}
      <div className="flex-grow px-4 sm:px-6 lg:px-8">
        <main className="w-full max-w-[85rem] mx-auto py-8 overflow-x-hidden">
          <div key={location.key} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
