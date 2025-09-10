import React from 'react';

function Footer() {
  return (
    <footer className="bg-green-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">FarmConnect</h3>
            <p className="text-gray-300">Connecting farmers and buyers for a sustainable future.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white">Contact</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">For Farmers</h4>
            <ul className="space-y-2">
              <li><a href="/farmer/register" className="text-gray-300 hover:text-white">Start Selling</a></li>
              <li><a href="/farmer/guide" className="text-gray-300 hover:text-white">Seller Guide</a></li>
              <li><a href="/farmer/success" className="text-gray-300 hover:text-white">Success Stories</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="https://twitter.com/farmconnect" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-2xl">📱</a>
              <a href="https://facebook.com/farmconnect" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-2xl">💻</a>
              <a href="mailto:contact@farmconnect.com" className="text-gray-300 hover:text-white text-2xl">📧</a>
            </div>
          </div>
        </div>
        <div className="border-t border-green-800 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} FarmConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
