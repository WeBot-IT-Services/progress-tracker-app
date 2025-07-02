/**
 * Data Integrity Test Component
 * Provides UI to run data integrity checks and view results
 */

import React, { useState } from 'react';
import { Database, CheckCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { DataIntegrityChecker } from '../../utils/dataIntegrityChecker';
import type { IntegrityCheckResults } from '../../utils/dataIntegrityChecker';

const DataIntegrityTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<IntegrityCheckResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runIntegrityCheck = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Starting data integrity check from UI...');
      const checker = new DataIntegrityChecker();
      const checkResults = await checker.performFullIntegrityCheck();
      setResults(checkResults);
      console.log('✅ Data integrity check completed from UI');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Data integrity check failed from UI:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-integrity-check-${new Date().toISOString().split('T')[0]}.json`;
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
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Data Integrity Checker</h1>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This tool performs a comprehensive audit of Firestore data, identifies issues, 
              attempts repairs, and verifies data integrity across all modules.
            </p>
            
            <button
              onClick={runIntegrityCheck}
              disabled={isRunning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Running Integrity Check...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Run Data Integrity Check
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

          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`p-4 rounded-lg border ${
                results.summary.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {results.summary.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <h3 className="font-medium">
                      {results.summary.success ? 'Data Integrity: Good' : 'Data Integrity: Issues Found'}
                    </h3>
                  </div>
                  <button
                    onClick={exportResults}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Export Results
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Issues Found</p>
                    <p className="text-lg font-semibold">{results.summary.totalIssuesFound}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issues Fixed</p>
                    <p className="text-lg font-semibold text-green-600">{results.summary.totalIssuesFixed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Issues</p>
                    <p className="text-lg font-semibold text-red-600">{results.summary.remainingIssues}</p>
                  </div>
                </div>

                {results.summary.recommendations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {results.summary.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Audit Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Audit Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(results.audit.collections).map(([name, collection]) => (
                    <div key={name} className="text-center">
                      <p className="text-sm text-gray-600 capitalize">{name}</p>
                      <p className="text-lg font-semibold">{collection.totalDocuments}</p>
                      <p className="text-xs text-gray-500">
                        {collection.validDocuments} valid, {collection.invalidDocuments} invalid
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Recovery Results</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Migrated from Local</p>
                    <p className="text-lg font-semibold text-blue-600">{results.recovery.migratedFromLocal}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Repaired Documents</p>
                    <p className="text-lg font-semibold text-green-600">{results.recovery.repairedDocuments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Created Documents</p>
                    <p className="text-lg font-semibold text-purple-600">{results.recovery.createdDocuments}</p>
                  </div>
                </div>

                {results.recovery.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-700 mb-2">Recovery Errors:</p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      {results.recovery.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Results */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Verification Results</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Module Status</h4>
                    <div className="space-y-1">
                      {Object.entries(results.verification.modulesWorking).map(([module, working]) => (
                        <div key={module} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{module}</span>
                          <span className={`text-sm ${working ? 'text-green-600' : 'text-red-600'}`}>
                            {working ? '✅' : '❌'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">CRUD Operations</h4>
                    <div className="space-y-1">
                      {Object.entries(results.verification.crudOperations).map(([operation, working]) => (
                        <div key={operation} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{operation}</span>
                          <span className={`text-sm ${working ? 'text-green-600' : 'text-red-600'}`}>
                            {working ? '✅' : '❌'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Projects</p>
                    <p className="text-lg font-semibold">{results.verification.dataConsistency.projectsCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Milestones</p>
                    <p className="text-lg font-semibold">{results.verification.dataConsistency.milestonesCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Complaints</p>
                    <p className="text-lg font-semibold">{results.verification.dataConsistency.complaintsCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Users</p>
                    <p className="text-lg font-semibold">{results.verification.dataConsistency.usersCount}</p>
                  </div>
                </div>

                {results.verification.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-700 mb-2">Verification Errors:</p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      {results.verification.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataIntegrityTest;
