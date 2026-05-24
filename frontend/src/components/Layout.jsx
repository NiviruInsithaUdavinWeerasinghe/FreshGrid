import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingNav from './FloatingNav';
import PromoBanner from './PromoBanner';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen relative">
      <PromoBanner />
      <Navbar />
      <FloatingNav />
      {/*
        key={location.key} forces React to unmount + remount the wrapper div
        on every navigation, which re-triggers the page-enter CSS animation.
      */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <div key={location.key} className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
