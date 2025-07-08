/**
 * Data Viewer Component
 * READ-ONLY interface to view existing Firestore data
 */

import React, { useState } from 'react';
import { Eye, Database, RefreshCw, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { verifyExistingData } from '../../utils/firestoreDataViewer';

interface DataSnapshot {
  collection: string;
  totalDocuments: number;
  documents: Array<{
    id: string;
    data: any;
    hasRequiredFields: boolean;
    missingFields: string[];
  }>;
  lastUpdated: Date;
}

const DataViewer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, DataSnapshot> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const viewData = async () => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      console.log('🔍 Viewing existing Firestore data...');
      const result = await verifyExistingData();
      
      if (result.success) {
        setData(result.data);
        setTotalDocuments(result.totalDocuments);
        console.log('✅ Data viewing completed');
      } else {
        setError(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Data viewing failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `firestore-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Firestore Data Viewer</h1>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Read-Only Data Verification</h3>
              </div>
              <p className="text-blue-700 mt-2 text-sm">
                This tool only reads and displays your existing Firestore data. 
                No modifications, repairs, or recovery operations will be performed.
              </p>
            </div>
            
            <button
              onClick={viewData}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Viewing Data...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  View Existing Firestore Data
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Error</h3>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-800">
                      Data Found: {totalDocuments} Total Documents
                    </h3>
                  </div>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {Object.entries(data).map(([collection, snapshot]) => (
                    <div key={collection} className="text-center">
                      <p className="text-sm text-gray-600 capitalize">{collection}</p>
                      <p className="text-lg font-semibold">{snapshot.totalDocuments}</p>
                      <p className="text-xs text-gray-500">documents</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collection Details */}
              {Object.entries(data).map(([collectionName, snapshot]) => (
                <div key={collectionName} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4 capitalize">
                    {collectionName} Collection ({snapshot.totalDocuments} documents)
                  </h3>
                  
                  {snapshot.totalDocuments === 0 ? (
                    <p className="text-gray-500 text-center py-4">No documents found in this collection</p>
                  ) : (
                    <div className="space-y-4">
                      {snapshot.documents.map((doc, index) => (
                        <div key={doc.id} className="border border-gray-100 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-700">
                              Document {index + 1}: {doc.id}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              doc.hasRequiredFields 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.hasRequiredFields ? 'Complete' : 'Missing Fields'}
                            </span>
                          </div>
                          
                          {doc.missingFields.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-yellow-600">
                                Missing fields: {doc.missingFields.join(', ')}
                              </p>
                            </div>
                          )}
                          
                          <div className="bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(doc.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Next Steps</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Check the browser console for detailed logs</p>
                  <p>• Verify that app modules can access this data</p>
                  <p>• If data is missing, check Firebase project configuration</p>
                  <p>• If data exists but modules can't access it, check service logic</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataViewer;
