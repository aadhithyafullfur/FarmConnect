import React from 'react';

const testimonials = [
  {
    name: "John Smith",
    role: "Organic Farmer",
    content: "FarmConnect has revolutionized how I sell my produce. Direct connection with buyers means better prices and less waste.",
    image: "🧑‍🌾"
  },
  {
    name: "Sarah Johnson",
    role: "Restaurant Owner",
    content: "Finding reliable suppliers was always a challenge until I found FarmConnect. Now I get the freshest ingredients directly from local farmers.",
    image: "👩‍🍳"
  },
  {
    name: "Michael Brown",
    role: "Market Buyer",
    content: "The transparency and quality assurance on FarmConnect gives me confidence in every purchase. Great platform!",
    image: "🧔"
  }
];

function Testimonials() {
  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4 text-center">{testimonial.image}</div>
              <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
