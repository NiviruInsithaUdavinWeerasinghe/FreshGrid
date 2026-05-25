import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        setStatus({ loading: false, success: true, error: '' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      setStatus({ loading: false, success: false, error: error.message });
    }
  };

  return (
    <footer className="bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-white/10 pt-16 pb-8 mt-auto relative overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-700"></div>
      
      <div className="max-w-[85rem] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-4 flex flex-col">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary dark:text-primary-light mb-4">
              <span role="img" aria-label="sprout" className="text-3xl">🌱</span>
              FreshGrid
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Your premium marketplace for the freshest farm-to-table produce, baked goods, and everyday essentials. We bridge the gap between local farmers and your kitchen.
            </p>
            <div className="flex gap-4 mt-auto">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider text-sm font-extrabold">Quick Links</h3>
            <ul className="space-y-3">
              {['Shop', 'About', 'Cart', 'Admin Portal'].map((link) => {
                const path = link === 'Admin Portal' ? '/admin' : `/${link.toLowerCase().replace(' ', '-')}`;
                return (
                  <li key={link}>
                    <Link to={path} className="text-sm text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors"></span>
                      {link}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Contact Form Section */}
          <div className="lg:col-span-5 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-inner relative">
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-200 mb-2">Drop a Message</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Have a question or feedback? Send an email directly to our admin team.</p>
            
            {status.success ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm font-bold flex items-center gap-3 border border-emerald-200 dark:border-emerald-500/20 animate-fade-in">
                <span className="text-xl">✅</span> 
                <div>
                  <p>Message sent successfully!</p>
                  <p className="text-xs font-medium opacity-80">We'll get back to you soon.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-800 dark:text-gray-200 transition-shadow"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-800 dark:text-gray-200 transition-shadow"
                  />
                </div>
                <textarea
                  name="message"
                  required
                  rows="3"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="w-full px-3 py-2.5 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-gray-800 dark:text-gray-200 resize-none transition-shadow"
                ></textarea>
                {status.error && <p className="text-xs text-red-500 font-medium">{status.error}</p>}
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
                >
                  {status.loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>Send Message <span>🚀</span></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            &copy; {new Date().getFullYear()} FreshGrid. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400 dark:text-gray-500">
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
