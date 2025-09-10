import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Function to handle marketplace navigation based on user role
  const handleMarketplaceClick = (e, categoryFilter = null) => {
    e.preventDefault();
    
    if (!user) {
      // If user is not logged in, redirect to login
      navigate('/login');
      return;
    }

    // Route based on user role
    if (user.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (user.role === 'buyer') {
      if (categoryFilter) {
        navigate(`/buyer/dashboard?category=${categoryFilter}`);
      } else {
        navigate('/buyer/dashboard');
      }
    } else {
      // Default fallback
      navigate('/buyer/dashboard');
    }
  };

  const heroSlides = [
    {
      title: "Fresh Farm Produce",
      subtitle: "Direct from Local Farmers",
      description: "Experience the finest quality vegetables, fruits, and grains sourced directly from verified organic farms",
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      cta: "Shop Fresh Produce"
    },
    {
      title: "Support Local Farmers",
      subtitle: "Fair Trade & Sustainable Agriculture",
      description: "Connect with farmers in your community and support sustainable farming practices",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      cta: "Join as Farmer"
    },
    {
      title: "Farm to Table",
      subtitle: "Fresh Delivery Guaranteed",
      description: "Get farm-fresh produce delivered to your doorstep with our reliable delivery network",
      image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      cta: "Start Shopping"
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Verified Organic Farms',
      description: 'All our farmers are certified organic and follow sustainable farming practices.',
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      title: 'Fair Pricing',
      description: 'Transparent pricing that ensures fair compensation for farmers and value for buyers.',
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery system ensuring fresh produce reaches you on time.',
      image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Community Driven',
      description: 'Building strong relationships between farmers and consumers in local communities.',
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  const productCategories = [
    {
      name: "Fresh Vegetables",
      count: "500+ varieties",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Organic, locally grown vegetables"
    },
    {
      name: "Seasonal Fruits",
      count: "300+ varieties",
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Fresh, juicy seasonal fruits"
    },
    {
      name: "Grains & Cereals",
      count: "200+ varieties",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Premium quality grains"
    },
    {
      name: "Herbs & Spices",
      count: "150+ varieties",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Aromatic herbs and spices"
    }
  ];

  const stats = [
    { value: '5,000+', label: 'Verified Farmers', icon: '👨‍🌾' },
    { value: '50,000+', label: 'Products Listed', icon: '🌾' },
    { value: '100,000+', label: 'Happy Customers', icon: '😊' },
    { value: '99.5%', label: 'Satisfaction Rate', icon: '⭐' }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Home Chef & Food Blogger',
      content: 'The quality of vegetables I get from FarmConnect is absolutely incredible! Fresh, organic, and delivered right to my door. My family loves the difference in taste and nutrition.',
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      location: "Mumbai, Maharashtra"
    },
    {
      name: 'Rajesh Kumar',
      role: 'Organic Farmer',
      content: 'This platform completely changed my farming business! I can now sell directly to customers without middlemen. Fair prices and a wonderful community of buyers.',
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      location: "Punjab, India"
    },
    {
      name: 'Anita Patel',
      role: 'Restaurant Owner',
      content: 'Bulk ordering for my restaurant has never been easier! The quality is consistent, delivery is reliable, and my customers notice the difference in our dishes.',
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      location: "Gujarat, India"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-screen overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl">
                  <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                    {slide.title}
                    <span className="block text-green-400 text-4xl md:text-5xl mt-2">
                      {slide.subtitle}
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
                    {slide.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={(e) => handleMarketplaceClick(e)}
                      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                    >
                      {slide.cta}
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                    
                    <Link 
                      to="/about" 
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'bg-green-400 w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-20 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div 
                key={index}
                id={`stat-${index}`}
                data-animate
                className={`transform transition-all duration-1000 delay-${index * 200} ${
                  isVisible[`stat-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <h3 className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</h3>
                <p className="text-green-100 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Enhanced Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-green-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Explore Our{" "}
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Product Categories
              </span>
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
                Discover a wide variety of fresh, organic produce from trusted local farmers
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Premium Category Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {productCategories.map((category, index) => (
              <button 
                key={index}
                onClick={(e) => handleMarketplaceClick(e, category.name.toLowerCase().replace(' ', '-'))}
                id={`category-${index}`}
                data-animate
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 hover:border-green-500/50 shadow-2xl hover:shadow-green-500/20 transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-2 cursor-pointer ${
                  isVisible[`category-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Premium Badge */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    PREMIUM
                  </div>
                  
                  {/* Action Icon */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-gray-900/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-500">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 relative">
                  {/* Category Title */}
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-green-300 transition-colors duration-300">
                    {category.name}
                  </h3>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 font-semibold text-lg">{category.count}</span>
                    <div className="flex items-center text-yellow-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {category.description}
                  </p>
                  
                  {/* CTA Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-400 font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                      <span>Shop Now</span>
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-500">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="text-green-400">FarmConnect</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of agricultural commerce with our innovative platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {features.map((feature, index) => (
              <div 
                key={index}
                id={`feature-${index}`}
                data-animate
                className={`${index % 2 === 0 ? 'md:order-1' : 'md:order-2'} transform transition-all duration-1000 ${
                  isVisible[`feature-${index}`] ? 'translate-x-0 opacity-100' : `${index % 2 === 0 ? '-translate-x-10' : 'translate-x-10'} opacity-0`
                }`}
              >
                {index % 2 === 0 ? (
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="lg:w-1/2">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-64 object-cover rounded-2xl shadow-lg border border-gray-700/50"
                      />
                    </div>
                    <div className="lg:w-1/2">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center text-green-400 mr-4">
                          {feature.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                      </div>
                      <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                    <div className="lg:w-1/2">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-64 object-cover rounded-2xl shadow-lg border border-gray-700/50"
                      />
                    </div>
                    <div className="lg:w-1/2">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center text-green-400 mr-4">
                          {feature.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                      </div>
                      <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It <span className="text-green-400">Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Simple steps to connect with local farmers and get fresh produce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Register & Browse",
                description: "Sign up as a buyer or farmer and explore our vast marketplace of fresh produce",
                icon: "👤",
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02", 
                title: "Connect & Order",
                description: "Connect directly with verified farmers and place orders for fresh, organic produce",
                icon: "🛒",
                color: "from-green-500 to-green-600"
              },
              {
                step: "03",
                title: "Receive & Enjoy", 
                description: "Get your fresh produce delivered to your doorstep and enjoy farm-fresh quality",
                icon: "🚚",
                color: "from-orange-500 to-orange-600"
              }
            ].map((step, index) => (
              <div 
                key={index}
                id={`step-${index}`}
                data-animate
                className={`text-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-500 transform hover:scale-105 ${
                  isVisible[`step-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="relative mb-8">
                  <div className={`relative mx-auto w-24 h-24 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-4xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 border border-green-400 rounded-full shadow-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-green-400">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our <span className="text-green-400">Community</span> Says
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Real stories from farmers and buyers who are part of our growing community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                id={`testimonial-${index}`}
                data-animate
                className={`bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 hover:border-green-500/50 p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isVisible[`testimonial-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-green-500/30"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                    <p className="text-green-400 font-medium">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                
                <p className="text-gray-300 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Farm Background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-green-100 mb-10 max-w-3xl mx-auto">
            Join thousands of farmers and buyers who are already part of the sustainable agriculture revolution
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
            <Link 
              to="/register?role=buyer" 
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-600 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            >
              Start Shopping Today
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            
            <Link 
              to="/register?role=farmer" 
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white hover:text-green-600 transition-all duration-300 transform hover:scale-105"
            >
              Join as Farmer
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Stay Updated with <span className="text-green-400">FarmConnect</span>
            </h3>
            <p className="text-gray-400 mb-8 text-lg">
              Get the latest updates on new farmers, seasonal produce, and special offers
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address"
                className="flex-1 px-6 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-400">FarmConnect</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting farmers directly with buyers for a sustainable future in agriculture.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: "📘", href: "#", label: "Facebook" },
                  { icon: "🐦", href: "#", label: "Twitter" },
                  { icon: "📷", href: "#", label: "Instagram" },
                  { icon: "💼", href: "#", label: "LinkedIn" }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-gray-700 transition-all duration-300"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">For Farmers</h4>
              <ul className="space-y-3">
                {[
                  { text: "Join as Farmer", href: "/register?role=farmer" },
                  { text: "Farmer Resources", href: "#" },
                  { text: "Certification Help", href: "#" },
                  { text: "Best Practices", href: "#" },
                  { text: "Pricing Guide", href: "#" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link to={link.href} className="text-gray-400 hover:text-green-400 transition-colors duration-300">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">For Buyers</h4>
              <ul className="space-y-3">
                {[
                  { text: "Join as Buyer", href: "/register?role=buyer" },
                  { text: "Browse Products", onClick: (e) => handleMarketplaceClick(e) },
                  { text: "Delivery Info", href: "#" },
                  { text: "Quality Guarantee", href: "#" },
                  { text: "Bulk Orders", href: "#" }
                ].map((link, index) => (
                  <li key={index}>
                    {link.onClick ? (
                      <button 
                        onClick={link.onClick}
                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 text-left"
                      >
                        {link.text}
                      </button>
                    ) : (
                      <Link to={link.href} className="text-gray-400 hover:text-green-400 transition-colors duration-300">
                        {link.text}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
              <ul className="space-y-3">
                {[
                  { text: "Help Center", href: "#" },
                  { text: "Contact Us", href: "/contact" },
                  { text: "Terms of Service", href: "#" },
                  { text: "Privacy Policy", href: "#" },
                  { text: "Return Policy", href: "#" }
                ].map((link, index) => (
                  <li key={index}>
                    <Link to={link.href} className="text-gray-400 hover:text-green-400 transition-colors duration-300">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 FarmConnect. All rights reserved. Made with 💚 for sustainable agriculture.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
