'use client';

import React from 'react';
import Navigation from './Navigation';
import AlertDashboard from './AlertDashboard';

export default function DirectAlertDashboard() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation 
        currentPage="dashboard" 
        pageTitle="Analytics Dashboard" 
        pageSubtitle="PORTFOLIO PERFORMANCE & INSIGHTS" 
      />

      {/* Background gradient matching other pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 -z-10"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

      {/* Main Content */}
      <div className="relative p-8">
        <div className="max-w-7xl mx-auto">
          <AlertDashboard />
        </div>
      </div>
    </div>
  );
} 