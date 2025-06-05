import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductionModule: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');

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
            <h1 className="text-xl font-semibold text-gray-900">Production</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 mb-6 shadow-sm border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('wip')}
              className={`tab-button ${
                activeTab === 'wip' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`tab-button ${
                activeTab === 'history' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              History
            </button>
          </div>
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Production Module</h2>
          <p className="text-gray-600">
            This module will allow production managers to create and manage milestones for projects.
          </p>
          <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ProductionModule;
