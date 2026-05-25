import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/products');
        if (response.data.success) {
          const allProducts = response.data.data;
          
          // Get unique categories
          const categories = [...new Set(allProducts.map(p => p.category))];
          
          // Select one product from up to 3 different categories
          const selected = [];
          for (const category of categories) {
            if (selected.length >= 3) break;
            const productsInCategory = allProducts.filter(p => p.category === category);
            if (productsInCategory.length > 0) {
              // Get a random product from this category
              const randomProduct = productsInCategory[Math.floor(Math.random() * productsInCategory.length)];
              selected.push(randomProduct);
            }
          }
          
          // If we couldn't get 3 from different categories, fill with other ones
          while (selected.length < 3 && selected.length < allProducts.length) {
            const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
            if (!selected.find(p => (p._id || p.id) === (randomProduct._id || randomProduct.id))) {
              selected.push(randomProduct);
            }
          }
          
          setFeaturedProducts(selected);
        }
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <div className="space-y-24 pb-12">
      {/* Hero Section */}
      <section id="hero" className="relative flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
        <div className="lg:w-1/2 space-y-8 z-10">
          <div className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-medium rounded-full text-sm border border-primary/20">
            100% Organic & Local
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Farm Fresh to <br/>
            <span className="text-primary dark:text-primary-light">Your Door</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg">
            Discover the best local produce, delivered directly from farmers to your table. Experience the taste of freshness every day.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              to="/shop" 
              className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-full shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              Shop Now
            </Link>
            <Link 
              to="/about" 
              className="px-8 py-3.5 bg-white dark:bg-charcoal-light border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary-light text-gray-700 dark:text-gray-200 font-semibold rounded-full transition-all duration-300"
            >
              Our Story
            </Link>
          </div>
        </div>
        
        <div className="lg:w-1/2 relative">
          <div className="absolute inset-0 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl transform translate-x-10 translate-y-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&q=80&w=800" 
            alt="Fresh vegetables in a basket" 
            className="relative z-10 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 w-full object-cover h-[500px]"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured-harvest">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Featured Harvest</h2>
            <p className="text-gray-600 dark:text-gray-400">Hand-picked selections for this season.</p>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center text-primary dark:text-primary-light font-semibold hover:underline">
            View All <span className="ml-2">&rarr;</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/5 animate-pulse flex flex-col h-[400px]">
                <div className="h-48 bg-gray-200 dark:bg-white/5 w-full" />
                <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-2/3" />
                    <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-lg w-full" />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-5 bg-gray-200 dark:bg-white/5 rounded-lg w-16" />
                    <div className="h-8 bg-gray-200 dark:bg-white/5 rounded-lg w-8" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            featuredProducts.map(product => (
              <ProductCard key={product._id || product.id} product={product} />
            ))
          )}
        </div>
        
        <div className="mt-8 sm:hidden text-center">
           <Link to="/shop" className="inline-flex items-center text-primary dark:text-primary-light font-semibold hover:underline">
            View All Products <span className="ml-2">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="glass-panel rounded-3xl p-8 md:p-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">How FreshGrid Works</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">From the soil to your kitchen in three simple steps.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-2xl flex items-center justify-center text-2xl font-bold">1</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Browse & Order</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose from a wide variety of fresh, locally sourced products.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-2xl flex items-center justify-center text-2xl font-bold">2</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Farmers Harvest</h3>
            <p className="text-gray-600 dark:text-gray-400">Our partner farmers pick your items fresh upon receiving the order.</p>
          </div>
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-2xl flex items-center justify-center text-2xl font-bold">3</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Doorstep Delivery</h3>
            <p className="text-gray-600 dark:text-gray-400">Receive your fresh produce at your doorstep the very next morning.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
