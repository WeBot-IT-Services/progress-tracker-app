import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TailwindTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Tailwind CSS Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Testing various Tailwind CSS features and utilities
          </p>
        </div>

        {/* Grid Layout Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Grid Layout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Column 1</h3>
              <p className="text-blue-600">Responsive grid system</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Column 2</h3>
              <p className="text-green-600">Auto-responsive layout</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Column 3</h3>
              <p className="text-purple-600">Mobile-first design</p>
            </div>
          </div>
        </div>

        {/* Flexbox Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Flexbox Layout</h2>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-gray-700">Flexbox working</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <span className="text-gray-700">Responsive design</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="w-6 h-6 text-red-500" />
              <span className="text-gray-700">Cross-browser support</span>
            </div>
          </div>
        </div>

        {/* Custom Colors Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Custom Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary-500 rounded-lg"></div>
              <p className="text-sm text-center text-gray-600">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary-500 rounded-lg"></div>
              <p className="text-sm text-center text-gray-600">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-success-500 rounded-lg"></div>
              <p className="text-sm text-center text-gray-600">Success</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-warning-500 rounded-lg"></div>
              <p className="text-sm text-center text-gray-600">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-danger-500 rounded-lg"></div>
              <p className="text-sm text-center text-gray-600">Danger</p>
            </div>
          </div>
        </div>

        {/* Animations Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Animations</h2>
          <div className="flex flex-wrap gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-lg animate-pulse"></div>
            <div className="w-16 h-16 bg-green-500 rounded-lg animate-bounce"></div>
            <div className="w-16 h-16 bg-purple-500 rounded-lg animate-spin"></div>
            <div className="w-16 h-16 bg-red-500 rounded-lg animate-fade-in"></div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Pulse, Bounce, Spin, and Custom Fade-in animations
          </p>
        </div>

        {/* Buttons Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Interactive Elements</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200">
              Primary Button
            </button>
            <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors duration-200">
              Secondary Button
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105">
              Gradient Button
            </button>
          </div>
        </div>

        {/* Mobile Responsive Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mobile Responsive</h2>
          <div className="space-y-4">
            <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-700">
              This text scales with screen size
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">
                <span className="inline sm:hidden">📱 Mobile view</span>
                <span className="hidden sm:inline md:hidden">📱 Small tablet view</span>
                <span className="hidden md:inline lg:hidden">💻 Medium screen view</span>
                <span className="hidden lg:inline xl:hidden">🖥️ Large screen view</span>
                <span className="hidden xl:inline">🖥️ Extra large screen view</span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Tailwind CSS is Working Correctly!
              </h3>
              <p className="text-green-600">
                All utilities, custom colors, animations, and responsive features are functioning properly.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TailwindTest;
