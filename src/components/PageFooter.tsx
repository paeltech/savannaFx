"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const PageFooter: React.FC = () => {
  return (
    <footer className="bg-[#0b1220] text-gray-300 pt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <img src="/assets/placeholder.svg" alt="placeholder" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-bold">KOJOFOREX</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              KOJOFOREX helps you learn profitable strategies and build wealth through disciplined forex trading.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>Home</li>
              <li>Course</li>
              <li>Mentorship</li>
              <li>Academy</li>
              <li>Booking</li>
              <li>Dashboard</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Signals</li>
              <li>Collaborations</li>
              <li>Community</li>
              <li>Strategy Course</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: support@kojoforex.local</li>
              <li>Location: Accra, Ghana</li>
            </ul>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Subscribe Now</Button>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 py-6 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} KOJOFOREX — All rights reserved.</p>
          <div className="mt-2">Privacy Policy • Terms</div>
        </div>
      </div>
    </footer>
  );
};

export default PageFooter;