/* eslint-disable */

// Import necessary components and libraries
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs } from '../ui/tabs';
import { ChevronRight, Wallet, Image as ImageIcon, Zap, Menu, X } from 'lucide-react'; // Adjust the import path as necessary

// Define the features
const features = [
  {
    title: 'Feature 1',
    description: 'List your NFTs in seconds',
    icon: Zap, // Replace with actual icon component
  },
  {
    title: 'Feature 2',
    description: 'Buy and sell NFTs with ease',
    icon: Wallet, // Replace with actual icon component
  },
  {
    title: 'Feature 3',
    description: 'Discover one-of-a-kind digital art',
    icon: ImageIcon, // Replace with actual icon component
  },
];

// Convert features to tabs
const featureTabs = features.map((feature) => ({
  title: feature.title,
  value: feature.title,
  content: (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-cyan-900/30 p-6 rounded-lg hover:bg-cyan-900/50 transition-colors"
    >
      <feature.icon className="w-12 h-12 mb-4 text-cyan-400" />
      <h3 className="text-xl text-white font-semibold mb-2">{feature.title}</h3>
      <p className="text-cyan-300">{feature.description}</p>
    </motion.div>
  ),
}));

// Render the Tabs component
const FeatureSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Choose NFT Realm?</h2>
        <Tabs
          tabs={featureTabs}
          containerClassName="grid grid-cols-1 md:grid-cols-3 gap-8"
          contentClassName="col-span-1"
        />
      </div>
    </section>
  );
};

export default FeatureSection;