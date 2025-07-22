import React, { useState } from 'react';
import { TestTube, Eye, Edit, Plus, X, Factory } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import Modal from '../common/Modal';

const MobileLayoutTest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  const testItems = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Test Item ${i + 1}`,
    description: `This is a test description for item ${i + 1}. It contains some sample text to test the layout.`,
    status: ['active', 'pending', 'completed'][i % 3]
  }));

  return (
    <ModuleContainer
      title="Mobile Layout Test"
      subtitle="Testing mobile layout fixes and modal positioning"
      icon={TestTube}
      iconColor="text-white"
      iconBgColor="bg-purple-500"
      headerActions={
        <div className="flex space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Test Modal</span>
          </button>
        </div>
      }
    >
      <div className="p-6">
        {/* Test Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mobile Layout Test</h2>
          <p className="text-gray-600">
            This page tests the mobile layout fixes. The content should appear properly below the header
            without being overlapped, and modals should appear centered on the screen.
          </p>
        </div>

        {/* Modal Size Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold mb-3">Modal Size Test</h3>
          <div className="flex flex-wrap gap-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => {
                  setModalSize(size);
                  setShowModal(true);
                }}
                className={`px-4 py-2 rounded-lg transition-all min-h-[44px] ${
                  modalSize === size
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {size.toUpperCase()} Modal
              </button>
            ))}
          </div>
        </div>

        {/* Test Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-all text-sm min-h-[44px]"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg transition-all text-sm min-h-[44px]"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Module Testing Links */}
        <div className="mt-8 p-6 bg-green-50 rounded-xl">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Test Specific Modules</h3>
          <p className="text-sm text-green-700 mb-4">
            Click these links to test the mobile layout fixes on the specific modules that were problematic:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/production"
              className="flex items-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-3 rounded-lg transition-all min-h-[44px]"
            >
              <Factory className="w-5 h-5" />
              <span>Production Module</span>
            </a>
            <a
              href="/installation"
              className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-3 rounded-lg transition-all min-h-[44px]"
            >
              <Plus className="w-5 h-5" />
              <span>Installation Module</span>
            </a>
            <a
              href="/tracker"
              className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg transition-all min-h-[44px]"
            >
              <Eye className="w-5 h-5" />
              <span>Master Tracker</span>
            </a>
            <a
              href="/complaints"
              className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg transition-all min-h-[44px]"
            >
              <Edit className="w-5 h-5" />
              <span>Complaints Module</span>
            </a>
          </div>
        </div>

        {/* Spacing Test */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Layout Test Results</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>✅ Content should appear below the header without overlap</p>
            <p>✅ Touch targets should be at least 44px for mobile accessibility</p>
            <p>✅ Modals should appear centered and properly positioned</p>
            <p>✅ Grid should be responsive across different screen sizes</p>
            <p>✅ Fixed modules: Production, Installation, Master Tracker, Complaints</p>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Test Modal (${modalSize.toUpperCase()})`}
        subtitle="Testing modal positioning and mobile responsiveness"
        size={modalSize}
        footer={
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all min-h-[44px]"
            >
              Confirm
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal should appear centered on the screen, regardless of the current scroll position.
            It should be properly sized for mobile devices and have appropriate touch targets.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Modal Features:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Fixed positioning that works on mobile</li>
              <li>• Proper backdrop blur and overlay</li>
              <li>• Responsive sizing based on screen size</li>
              <li>• Touch-friendly close button</li>
              <li>• Keyboard accessibility (ESC to close)</li>
              <li>• Prevents body scroll when open</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <h5 className="font-medium text-green-800 mb-1">Mobile Optimized</h5>
              <p className="text-xs text-green-600">Responsive design with proper touch targets</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-1">Accessible</h5>
              <p className="text-xs text-blue-600">Keyboard navigation and screen reader friendly</p>
            </div>
          </div>

          {/* Long content to test scrolling */}
          <div className="space-y-3">
            <h4 className="font-semibold">Scrolling Test Content:</h4>
            {Array.from({ length: 10 }, (_, i) => (
              <p key={i} className="text-sm text-gray-600">
                This is paragraph {i + 1} to test modal scrolling behavior. The modal should handle
                long content gracefully and allow scrolling within the modal body while preventing
                background scroll.
              </p>
            ))}
          </div>
        </div>
      </Modal>
    </ModuleContainer>
  );
};

export default MobileLayoutTest;
