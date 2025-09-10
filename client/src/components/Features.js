import React from 'react';

const features = [
  {
    title: "Direct Farm-to-Table",
    description: "Connect directly with local farmers and get fresh produce straight from the source.",
    icon: "🌾"
  },
  {
    title: "Secure Transactions",
    description: "Safe and transparent payment system for both farmers and buyers.",
    icon: "🔒"
  },
  {
    title: "Quality Assurance",
    description: "All products are verified for quality and freshness.",
    icon: "✅"
  },
  {
    title: "Real-time Chat",
    description: "Communicate directly with farmers or buyers to discuss products and prices.",
    icon: "💬"
  }
];

function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Why Choose FarmConnect?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-green-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
