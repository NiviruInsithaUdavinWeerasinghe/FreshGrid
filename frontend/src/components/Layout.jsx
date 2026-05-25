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
      <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-charcoal relative flex flex-col">
        <style>{`
          /* Lock window height and let inner layout handle scroll naturally if needed */
          html, body {
            overflow: hidden !important;
            height: 100% !important;
          }
          /* Override 100vh constraints on inner auth pages so they fit flex height */
          .page-enter > div {
            min-height: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding-top: 100px !important; /* Clear floated Navbar space */
            padding-bottom: 100px !important; /* Balanced bottom spacing */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        `}</style>
        {/* Float header absolutely to avoid displacing document flow height */}
        <div className="absolute top-0 left-0 w-full z-50">
          <Navbar />
        </div>
        <FloatingNav />
        <div key={location.key} className="page-enter flex-grow overflow-y-auto w-full h-full">
          <Outlet />
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
