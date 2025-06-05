import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MasterTracker: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Master Tracker</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Master Tracker</h2>
          <p className="text-gray-600">
            This module will provide a comprehensive overview of all projects across all stages.
          </p>
          <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default MasterTracker;
