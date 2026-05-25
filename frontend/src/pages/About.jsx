import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Users, Sun } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-16 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 to-teal-800/80 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200" 
          alt="Farmers at sunset"
          className="w-full h-[300px] md:h-[400px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-emerald-300 font-bold tracking-widest uppercase text-sm mb-4 block">Our Roots</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">The FreshGrid Story</h1>
            <p className="text-emerald-50 text-base md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Cultivating a healthier world by bridging the gap between local farmers and your dining table, one fresh harvest at a time.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Story Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6 text-gray-700 dark:text-gray-300"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">It Started With a Simple Seed</h2>
          <p className="text-base md:text-lg leading-relaxed">
            Back in 2024, our founders noticed a growing disconnect. While local farms were overflowing with vibrant, nutrient-rich produce, supermarkets were stocking shelves with vegetables that had traveled thousands of miles, losing their flavor and vitality along the way.
          </p>
          <p className="text-base md:text-lg leading-relaxed">
            FreshGrid was born from a radical yet simple idea: what if we could bring the farmer's market directly to your doorstep? By building a technology-driven grid, we eliminate the middlemen, ensuring that the farmers get fair compensation and you get produce harvested at peak ripeness.
          </p>
          <p className="text-base md:text-lg font-medium text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-r-lg">
            "We aren't just selling vegetables; we're rebuilding the community food supply chain for a sustainable future."
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative px-4 sm:px-0"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-[2rem] transform rotate-3" />
          <img 
            src="/images/hero-farm.png" 
            alt="Lush green organic farm field" 
            className="relative rounded-3xl shadow-xl w-full object-cover h-[350px] md:h-[450px] border-4 border-white dark:border-charcoal-light transform -rotate-2 hover:rotate-0 transition-transform duration-500"
          />
        </motion.div>
      </div>

      {/* Values Grid */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-8 md:p-16 border border-gray-100 dark:border-white/5 mb-8 mx-4 sm:mx-0">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Our Core Values</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">The principles that guide every harvest, every delivery, and every partnership we make.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { icon: Leaf, title: 'Sustainable Farming', desc: 'We strictly partner with farms using organic and regenerative agriculture techniques.' },
            { icon: Heart, title: 'Community First', desc: 'A percentage of every sale goes back to supporting local agricultural education.' },
            { icon: Users, title: 'Fair Trade', desc: 'Eliminating the middleman means our farmers earn 40% more than industry standards.' },
            { icon: Sun, title: 'Peak Freshness', desc: 'Produce is harvested to order and delivered within 24 hours of leaving the soil.' }
          ].map((value, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-charcoal p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all text-center group"
            >
              <div className="w-14 h-14 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary group-hover:text-white text-primary dark:text-emerald-400">
                <value.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{value.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
