import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-charcoal-light border-t border-gray-200 dark:border-white/5 py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} FreshGrid. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors">
              Contact
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
