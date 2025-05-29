// Footer.js
import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Wells Fargo</h3>
          <p className="text-sm">Trusted banking since 1852.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Services</h4>
          <ul className="space-y-1">
            <li><a href="#" className="hover:underline">Checking</a></li>
            <li><a href="#" className="hover:underline">Savings</a></li>
            <li><a href="#" className="hover:underline">Credit Cards</a></li>
            <li><a href="#" className="hover:underline">Loans</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li><a href="#" className="hover:underline">Help Center</a></li>
            <li><a href="#" className="hover:underline">Security</a></li>
            <li><a href="#" className="hover:underline">Privacy</a></li>
            <li><a href="#" className="hover:underline">Accessibility</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2">Connect</h4>
          <div className="flex space-x-4 mt-2">
            <a href="#" aria-label="Facebook"><FaFacebook className="text-2xl hover:text-gray-400" /></a>
            <a href="#" aria-label="Twitter"><FaTwitter className="text-2xl hover:text-gray-400" /></a>
            <a href="#" aria-label="Instagram"><FaInstagram className="text-2xl hover:text-gray-400" /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin className="text-2xl hover:text-gray-400" /></a>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Wells Fargo. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;


// Header.js
import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
  const [navOpen, setNavOpen] = useState(false);

  const toggleNav = () => setNavOpen(!navOpen);

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <a href="/" className="text-xl font-bold text-red-700">Wells Fargo</a>
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-700 hover:text-red-700">Home</a>
          <a href="#" className="text-gray-700 hover:text-red-700">Accounts</a>
          <a href="#" className="text-gray-700 hover:text-red-700">Loans</a>
          <a href="#" className="text-gray-700 hover:text-red-700">Contact</a>
        </nav>
        <button onClick={toggleNav} className="md:hidden text-gray-700">
          {navOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
      {navOpen && (
        <div className="md:hidden bg-white shadow-md">
          <nav className="flex flex-col space-y-2 px-4 py-2">
            <a href="#" className="text-gray-700 hover:text-red-700">Home</a>
            <a href="#" className="text-gray-700 hover:text-red-700">Accounts</a>
            <a href="#" className="text-gray-700 hover:text-red-700">Loans</a>
            <a href="#" className="text-gray-700 hover:text-red-700">Contact</a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
