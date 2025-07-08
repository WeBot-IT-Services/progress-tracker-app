import React from 'react';
import { Building2 } from 'lucide-react';

interface VersionFooterProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const VersionFooter: React.FC<VersionFooterProps> = ({ className = '', theme = 'light' }) => {
  
  const getFooterTheme = () => {
    if (theme === 'dark') {
      return {
        footerBg: 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-t border-slate-600',
        companyTitle: 'text-white',
        companySubtitle: 'text-slate-300',
        companyDesc: 'text-slate-400',
        sectionTitle: 'text-slate-200',
        cardBg: 'bg-slate-800 border-slate-600 hover:border-slate-500',
        textMuted: 'text-slate-400',
        buildDetailsBg: 'bg-slate-800 border-slate-600 hover:border-slate-500',
        buildDetailsContent: 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 text-slate-300',
        buildDetailsTitle: 'text-slate-200',
        bottomBarBg: 'bg-slate-800 bg-opacity-50',
        copyrightText: 'text-slate-300',
        copyrightMuted: 'text-slate-400'
      };
    }
    
    return {
      footerBg: 'bg-gradient-to-r from-gray-50 via-blue-50 to-gray-50 border-t border-gray-200',
      companyTitle: 'text-gray-900 group-hover:text-blue-700',
      companySubtitle: 'text-gray-600',
      companyDesc: 'text-gray-500',
      sectionTitle: 'text-gray-700',
      cardBg: 'bg-white border-gray-100 hover:border-blue-200',
      textMuted: 'text-gray-600',
      buildDetailsBg: 'bg-gray-50 border-gray-100 hover:border-gray-200',
      buildDetailsContent: 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 text-gray-600',
      buildDetailsTitle: 'text-gray-700',
      bottomBarBg: 'bg-white bg-opacity-50',
      copyrightText: 'text-gray-600',
      copyrightMuted: 'text-gray-500'
    };
  };
  
  const themeStyles = getFooterTheme();
  
  return (
    <footer className={`${themeStyles.footerBg} shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center space-y-4">
          {/* Company Information */}
          <div className="flex flex-col items-center space-y-3 group">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border`}>
                <img 
                  src="/mysteel-logo.png" 
                  alt="Mysteel Construction" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className={`font-bold text-lg transition-colors duration-300 ${themeStyles.companyTitle}`}>
                  Mysteel Progress Tracker
                </h3>
                <p className={`text-sm ${themeStyles.companySubtitle}`}>Construction Management Platform</p>
              </div>
            </div>
            <p className={`text-xs leading-relaxed text-center max-w-md ${themeStyles.companyDesc}`}>
              Professional construction project management and tracking solutions designed for modern construction workflows.
            </p>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className={`border-t pt-3 mt-4 rounded-t-lg ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'} ${themeStyles.bottomBarBg}`}>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <span className={`text-xs font-medium ${themeStyles.copyrightText}`}>
              © {new Date().getFullYear()} Mysteel Construction
            </span>
            <span className={`hidden sm:inline text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-gray-300'}`}>•</span>
            <span className={`text-xs ${themeStyles.copyrightMuted}`}>All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default VersionFooter;
