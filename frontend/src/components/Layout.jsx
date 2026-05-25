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
      <div key={location.key} className="page-enter">
        <Outlet />
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
