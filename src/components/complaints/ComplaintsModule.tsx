import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComplaintsModule: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'submit' | 'status'>('submit');

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
            <h1 className="text-xl font-semibold text-gray-900">Complaints</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 mb-6 shadow-sm border border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('submit')}
              className={`tab-button ${
                activeTab === 'submit' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              Submit Complaint
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`tab-button ${
                activeTab === 'status' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              Complaint Status
            </button>
          </div>
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Complaints Module</h2>
          <p className="text-gray-600">
            This module will allow users to submit complaints and track their resolution status.
          </p>
          <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsModule;
