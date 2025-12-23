"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const PageFooter: React.FC = () => {
  return (
    <footer className="bg-black text-rainy-grey pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
            
              <img src="/assets/logo.png" alt="SavannaFX logo" className="w-32 rounded-lg" />
              
            </div>
            <p className="text-sm text-rainy-grey leading-relaxed">
              SavannaFX teaches and empowers traders to survive and thrive in the markets with discipline, timing, and awareness.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-rainy-grey leading-relaxed">
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Home</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Course</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Mentorship</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Academy</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Booking</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Dashboard</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-rainy-grey leading-relaxed">
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Signals</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Collaborations</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Community</li>
              <li className="hover:text-gold transition-colors duration-200 cursor-pointer">Strategy Course</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-rainy-grey leading-relaxed mb-6">
              <li>Email: support@savannafx.com</li>
              <li>Location: Dar es salaam, Tanzania</li>
            </ul>
            <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300">Subscribe Now</Button>
          </div>
        </div>

        <div className="border-t border-nero mt-12 pt-8 text-sm text-rainy-grey leading-relaxed">
          <p>© {new Date().getFullYear()} SavannaFX — All rights reserved.</p>
          <div className="mt-3 flex gap-4">
            <span className="hover:text-gold transition-colors duration-200 cursor-pointer">Privacy Policy</span>
            <span className="text-steel-wool">•</span>
            <span className="hover:text-gold transition-colors duration-200 cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;