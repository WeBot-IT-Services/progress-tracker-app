import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  dueDate: string;
  status: 'DNE' | 'Production' | 'Installation' | 'Completed';
  amount?: number;
}

const SalesModule: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [formData, setFormData] = useState({
    projectName: '',
    amount: '',
    completionDate: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock data for demonstration
  const projects: Project[] = [
    { id: '1', name: 'Project hhhh', dueDate: '10/06/2025', status: 'DNE' },
    { id: '2', name: 'Project kkk', dueDate: '29/06/2025', status: 'Production' },
    { id: '3', name: 'Projecta', dueDate: '03/06/2025', status: 'Production' },
    { id: '4', name: 'Project hgg', dueDate: '03/06/2025', status: 'DNE' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save to Firebase
    console.log('Submitting project:', formData);
    setShowSuccess(true);
    setFormData({ projectName: '', amount: '', completionDate: '' });
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DNE':
        return 'status-badge-dne';
      case 'Production':
        return 'status-badge-production';
      case 'Installation':
        return 'status-badge-installation';
      case 'Completed':
        return 'status-badge-completed';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button
              onClick={() => navigate('/')}
              className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl mr-6 transition-all duration-200 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Module</h1>
                <p className="text-sm text-gray-600">Manage projects and submissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-2 mb-8 shadow-lg border border-white/20">
          <div className="flex">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'submit'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📝 Submit New Project
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              📊 Project History
            </button>
          </div>
        </div>

        {/* Submit Project Tab */}
        {activeTab === 'submit' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">New Project</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter project amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Date
                </label>
                <input
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-base font-semibold"
              >
                Submit Project
              </button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <span className={`status-badge ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Due: {project.dueDate}</p>
                    {currentUser?.role === 'admin' && project.amount && (
                      <p className="text-sm text-gray-600">Amount: RM {project.amount.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
            Project submitted successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesModule;
