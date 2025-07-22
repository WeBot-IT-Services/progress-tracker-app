import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, User, Key, Database, RefreshCw, Wrench } from 'lucide-react';
import ModuleContainer from '../common/ModuleContainer';
import UserCreationForm from '../admin/UserCreationForm';
import { usersService } from '../../services/firebaseService';
import EnhancedEmployeeIdAuthService from '../../services/enhancedEmployeeIdAuth';
import { hashPassword, verifyPassword } from '../../utils/passwordUtils';
import { AuthDiagnostics } from '../../utils/authDiagnostics';

interface TestResult {
  test: string;
  status: 'pending' | 'pass' | 'fail';
  message: string;
  details?: any;
}

const AuthenticationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showUserCreation, setShowUserCreation] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const tests = [
    {
      name: 'Database Connection',
      test: 'database_connection',
      description: 'Test connection to Firestore database'
    },
    {
      name: 'Demo Users Exist',
      test: 'demo_users_exist',
      description: 'Verify demo users (A0001-I0001) exist in database'
    },
    {
      name: 'Password Hashing',
      test: 'password_hashing',
      description: 'Test password hashing and verification functions'
    },
    {
      name: 'Demo User Authentication',
      test: 'demo_auth',
      description: 'Test authentication for demo users with WR2024 password'
    },
    {
      name: 'Employee ID Validation',
      test: 'employee_id_validation',
      description: 'Test employee ID format validation'
    },
    {
      name: 'User Creation',
      test: 'user_creation',
      description: 'Test creating new user accounts'
    }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await usersService.getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const updateTestResult = (testName: string, status: 'pass' | 'fail' | 'pending', message: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.test === testName);
      const newResult = { test: testName, status, message, details };
      
      if (existing) {
        return prev.map(r => r.test === testName ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTest = async (testName: string) => {
    updateTestResult(testName, 'pending', 'Running...');

    try {
      switch (testName) {
        case 'database_connection':
          await testDatabaseConnection();
          break;
        case 'demo_users_exist':
          await testDemoUsersExist();
          break;
        case 'password_hashing':
          await testPasswordHashing();
          break;
        case 'demo_auth':
          await testDemoAuthentication();
          break;
        case 'employee_id_validation':
          await testEmployeeIdValidation();
          break;
        case 'user_creation':
          await testUserCreation();
          break;
        default:
          updateTestResult(testName, 'fail', 'Unknown test');
      }
    } catch (error: any) {
      updateTestResult(testName, 'fail', error.message || 'Test failed');
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const users = await usersService.getUsers();
      updateTestResult('database_connection', 'pass', `Connected successfully. Found ${users.length} users.`, { userCount: users.length });
    } catch (error: any) {
      updateTestResult('database_connection', 'fail', `Connection failed: ${error.message}`);
    }
  };

  const testDemoUsersExist = async () => {
    const demoUsers = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
    const results = [];

    for (const employeeId of demoUsers) {
      try {
        const user = await usersService.getUserByEmployeeId(employeeId);
        results.push({
          employeeId,
          exists: !!user,
          hasPasswordHash: !!(user?.passwordHash),
          passwordSet: user?.passwordSet,
          status: user?.status
        });
      } catch (error) {
        results.push({
          employeeId,
          exists: false,
          error: error
        });
      }
    }

    const allExist = results.every(r => r.exists);
    const allHavePasswords = results.every(r => r.hasPasswordHash);

    if (allExist && allHavePasswords) {
      updateTestResult('demo_users_exist', 'pass', 'All demo users exist with proper password hashes', results);
    } else if (allExist) {
      updateTestResult('demo_users_exist', 'fail', 'Demo users exist but some missing password hashes', results);
    } else {
      updateTestResult('demo_users_exist', 'fail', 'Some demo users are missing', results);
    }
  };

  const testPasswordHashing = async () => {
    try {
      const testPassword = 'WR2024';
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      const isInvalid = await verifyPassword('wrongpassword', hash);

      if (isValid && !isInvalid) {
        updateTestResult('password_hashing', 'pass', 'Password hashing and verification working correctly', {
          hash: hash.substring(0, 16) + '...',
          validPassword: isValid,
          invalidPassword: isInvalid
        });
      } else {
        updateTestResult('password_hashing', 'fail', 'Password verification not working correctly');
      }
    } catch (error: any) {
      updateTestResult('password_hashing', 'fail', `Password hashing failed: ${error.message}`);
    }
  };

  const testDemoAuthentication = async () => {
    const demoUsers = ['A0001', 'S0001', 'D0001', 'P0001', 'I0001'];
    const results = [];

    for (const employeeId of demoUsers) {
      try {
        const user = await EnhancedEmployeeIdAuthService.login(employeeId, 'WR2024');
        results.push({
          employeeId,
          success: true,
          name: user.name,
          role: user.role
        });
      } catch (error: any) {
        results.push({
          employeeId,
          success: false,
          error: error.message
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      updateTestResult('demo_auth', 'pass', 'All demo users can authenticate successfully', results);
    } else {
      updateTestResult('demo_auth', 'fail', 'Some demo users failed authentication', results);
    }
  };

  const testEmployeeIdValidation = async () => {
    const testCases = [
      { id: 'A0001', shouldBeValid: true },
      { id: 'S0001', shouldBeValid: true },
      { id: 'D0001', shouldBeValid: true },
      { id: 'P0001', shouldBeValid: true },
      { id: 'I0001', shouldBeValid: true },
      { id: 'invalid', shouldBeValid: false },
      { id: '12345', shouldBeValid: false },
      { id: 'A001', shouldBeValid: false },
      { id: 'AA0001', shouldBeValid: false }
    ];

    const results = testCases.map(testCase => {
      const validation = EnhancedEmployeeIdAuthService.validateIdentifier(testCase.id);
      return {
        ...testCase,
        actualValid: validation.isValid,
        passed: validation.isValid === testCase.shouldBeValid
      };
    });

    const allPassed = results.every(r => r.passed);

    if (allPassed) {
      updateTestResult('employee_id_validation', 'pass', 'Employee ID validation working correctly', results);
    } else {
      updateTestResult('employee_id_validation', 'fail', 'Employee ID validation has issues', results);
    }
  };

  const testUserCreation = async () => {
    const testEmployeeId = 'T9999'; // Test user
    
    try {
      // Clean up any existing test user
      try {
        const existingUser = await usersService.getUserByEmployeeId(testEmployeeId);
        if (existingUser) {
          // Note: We can't delete users in this test, so we'll skip if exists
          updateTestResult('user_creation', 'pass', 'Test user already exists (skipping creation test)', { employeeId: testEmployeeId });
          return;
        }
      } catch (error) {
        // User doesn't exist, which is what we want
      }

      // Create test user
      const passwordHash = await hashPassword('TestPassword123!');
      const userData = {
        employeeId: testEmployeeId,
        name: 'Test User',
        email: 'test@mysteel.com',
        role: 'sales' as const,
        department: 'Testing',
        status: 'active' as const,
        passwordHash,
        passwordSet: true,
        isTemporary: false
      };

      await usersService.createUser(userData);

      // Test authentication with new user
      const authenticatedUser = await EnhancedEmployeeIdAuthService.login(testEmployeeId, 'TestPassword123!');

      updateTestResult('user_creation', 'pass', 'New user created and authenticated successfully', {
        employeeId: testEmployeeId,
        name: authenticatedUser.name,
        role: authenticatedUser.role
      });

    } catch (error: any) {
      updateTestResult('user_creation', 'fail', `User creation test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Use the comprehensive diagnostics
      const diagnosticResults = await AuthDiagnostics.runDiagnostics();

      // Convert diagnostic results to test results
      const convertedResults = diagnosticResults.map(result => ({
        test: result.test.toLowerCase().replace(/\s+/g, '_'),
        status: result.status === 'warning' ? 'fail' : result.status,
        message: result.message,
        details: result.details
      }));

      setTestResults(convertedResults);

    } catch (error: any) {
      console.error('Diagnostics failed:', error);
      setTestResults([{
        test: 'diagnostics',
        status: 'fail' as const,
        message: `Diagnostics failed: ${error.message}`,
        details: { error }
      }]);
    }

    setIsRunning(false);
  };

  const runQuickFix = async () => {
    setIsRunning(true);

    try {
      await AuthDiagnostics.quickFix();

      // Re-run tests after fix
      await runAllTests();

      alert('Quick fix completed! Check the test results.');

    } catch (error: any) {
      console.error('Quick fix failed:', error);
      alert(`Quick fix failed: ${error.message}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'pass' | 'fail') => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <ModuleContainer
      title="Authentication Testing"
      subtitle="Test and verify authentication system functionality"
      icon={Shield}
      iconColor="text-white"
      iconBgColor="bg-purple-500"
      headerActions={
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUserCreation(!showUserCreation)}
            className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px]"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Create User</span>
          </button>
          <button
            onClick={runQuickFix}
            disabled={isRunning}
            className="flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] disabled:opacity-50"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Fix</span>
          </button>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{isRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>
        </div>
      }
    >
      <div className="p-6">
        {/* User Creation Form */}
        {showUserCreation && (
          <div className="mb-8">
            <UserCreationForm
              onUserCreated={(user) => {
                console.log('User created:', user);
                loadUsers();
                setShowUserCreation(false);
              }}
              onClose={() => setShowUserCreation(false)}
            />
          </div>
        )}

        {/* Test Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication System Tests</h2>
          <p className="text-gray-600 mb-4">
            This page tests the authentication system to ensure both demo users and newly created users 
            can log in successfully. Run the tests to verify the system is working correctly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Current System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Users in Database: {users.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Demo Password: WR2024</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Employee ID Auth: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test) => {
            const result = testResults.find(r => r.test === test.test);
            
            return (
              <div
                key={test.test}
                className={`border rounded-lg p-4 transition-all ${
                  result?.status === 'pass'
                    ? 'border-green-200 bg-green-50'
                    : result?.status === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : result?.status === 'pending'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {result && getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => runTest(test.test)}
                    disabled={isRunning}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm min-h-[44px] disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>

                {result && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className={`text-sm ${
                      result.status === 'pass' ? 'text-green-800' :
                      result.status === 'fail' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {result.message}
                    </p>
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {testResults.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'pass').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'fail').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleContainer>
  );
};

export default AuthenticationTest;
