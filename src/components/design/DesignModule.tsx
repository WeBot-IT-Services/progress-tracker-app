import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesignProject {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'partial' | 'completed';
}

const DesignModule: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'wip' | 'history'>('wip');

  // Mock data for demonstration
  const wipProjects: DesignProject[] = [
    { id: '1', name: 'Project hhhh', dueDate: '10/06/2025', status: 'pending' },
    { id: '2', name: 'Test Manufacturing Project', dueDate: '31/12/2024', status: 'partial' },
  ];

  const historyProjects: DesignProject[] = [
    { id: '3', name: 'Completed Project A', dueDate: '15/05/2025', status: 'completed' },
    { id: '4', name: 'Completed Project B', dueDate: '20/05/2025', status: 'completed' },
  ];

  const handleStatusChange = (projectId: string, newStatus: 'partial' | 'completed') => {
    // Here you would typically update the status in Firebase
    console.log(`Updating project ${projectId} to ${newStatus}`);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'partial':
        return 'Partial Completed';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'partial':
        return 'text-orange-600';
      case 'completed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

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
            <h1 className="text-xl font-semibold text-gray-900">Design & Engineering</h1>
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
              WIP
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

        {/* WIP Tab */}
        {activeTab === 'wip' && (
          <div className="space-y-4">
            {wipProjects.map((project) => (
              <div key={project.id} className="card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600">Due: {project.dueDate}</p>
                  {project.status === 'partial' && (
                    <p className="text-sm text-orange-600 font-medium mt-1">
                      Partial Completed
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={project.status === 'partial'}
                        onChange={() => handleStatusChange(project.id, 'partial')}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        project.status === 'partial' 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-gray-300 hover:border-orange-400'
                      }`}>
                        {project.status === 'partial' && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-700">Partial Completed</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={project.status === 'completed'}
                        onChange={() => handleStatusChange(project.id, 'completed')}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        project.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}>
                        {project.status === 'completed' && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-700">Completed</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyProjects.map((project) => (
              <div key={project.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600">Due: {project.dueDate}</p>
                    <p className={`text-sm font-medium mt-1 ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="btn btn-secondary text-sm">
                      Edit
                    </button>
                    <button className="btn btn-secondary text-sm">
                      Revert
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignModule;
