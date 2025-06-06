import React from 'react';
import { TrendingUp, Shield, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Footer Row */}
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">TradeRisk Pro</h3>
              <p className="text-xs text-gray-500">Professional Trading Tools</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Calculator</a>
            <a href="/alerts" className="text-gray-600 hover:text-blue-600 transition-colors">Alerts</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Terms</a>
            <a href="mailto:hello@traderisk.pro" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>

          {/* Copyright */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>© {currentYear} TradeRisk Pro</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-current" />
              <span>for traders</span>
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">
                <span className="font-medium text-yellow-700">Disclaimer:</span> 
                This platform is for educational purposes only. Trading involves substantial risk and may not be suitable for all investors. 
                Always consult with a qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 