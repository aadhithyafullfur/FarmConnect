import React from 'react';
import { Link } from 'react-router-dom';
import pattern from '../pattern.svg';

function HeroSection() {
  return (
    <section className="relative min-h-[80vh] bg-gradient-to-br from-green-900 via-green-800 to-green-700">
      {/* Overlay Pattern */}
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      <div className="absolute inset-0" style={{ backgroundImage: `url(${pattern})`, opacity: 0.1 }}></div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Fresh From Farm
            <span className="block text-green-400">To Your Table</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect directly with local farmers, discover fresh organic produce, and support sustainable agriculture. Experience farm-fresh quality delivered to your doorstep.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link to="/register?role=buyer" className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <button className="relative w-full bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-900 transition duration-300">
                Join as Buyer
                <span className="block text-sm text-gray-400">Find Fresh Products</span>
              </button>
            </Link>

            <Link to="/register?role=farmer" className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <button className="relative w-full bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-900 transition duration-300">
                Join as Farmer
                <span className="block text-sm text-gray-400">Sell Your Produce</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <h3 className="text-4xl font-bold text-green-400">2K+</h3>
            <p className="text-gray-300">Active Farmers</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-green-400">10K+</h3>
            <p className="text-gray-300">Products Listed</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-green-400">15K+</h3>
            <p className="text-gray-300">Happy Customers</p>
          </div>
          <div>
            <h3 className="text-4xl font-bold text-green-400">98%</h3>
            <p className="text-gray-300">Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
