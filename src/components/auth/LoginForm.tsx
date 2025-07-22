import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MysteelLogo from '../common/MysteelLogo';
import EnhancedEmployeeIdAuthService from '../../services/enhancedEmployeeIdAuth';
import type { UserRole } from '../../types';
import {
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface LoginFormProps {
  // No props needed for login-only mode
}

const LoginForm: React.FC<LoginFormProps> = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
    name: '',
    role: 'sales' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmployeeIdHelp, setShowEmployeeIdHelp] = useState(false);

  // Quick access employee IDs for Firebase demo users
  const [quickAccessIds] = useState([
    { id: 'A0001', department: 'Admin', name: 'Admin', icon: '👑', color: 'from-yellow-400 to-yellow-600' },
    { id: 'S0001', department: 'Sales', name: 'Sales', icon: '', color: 'from-blue-400 to-blue-600' },
    { id: 'D0001', department: 'Design', name: 'Design', icon: '', color: 'from-purple-400 to-purple-600' },
    { id: 'P0001', department: 'Production', name: 'Production', icon: '', color: 'from-green-400 to-green-600' },
    { id: 'I0001', department: 'Install', name: 'Install', icon: '', color: 'from-orange-400 to-orange-600' }
  ]);



  // Note: Quick access functionality integrated into demo login

  // Enhanced demo login handler with detailed debugging
  const handleDemoLogin = async (employeeId: string) => {
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Demo Login Debug Info:');
      console.log(`   Employee ID: ${employeeId}`);
      console.log(`   Password: WR2024`);
      console.log(`   Expected Hash: 79daf4758343c745343debd60f51a057923ca343fdc2df42c7b38b6919566749`);

      console.log(`   ✅ Employee ID accepted: ${employeeId}`);
      console.log(`   🔐 Attempting authentication...`);

      // Use demo password for quick access
      await login(employeeId, 'WR2024');

      console.log(`   ✅ Demo login successful for ${employeeId}`);
    } catch (authError: any) {
      console.error('❌ Demo login failed:', authError);
      console.log('   Error details:', {
        message: authError.message,
        stack: authError.stack
      });

      // Provide specific error messages based on the failure type
      if (authError.message.includes('No account found')) {
        setError(`❌ User Not Found: Employee ID "${employeeId}" does not exist in the database. Demo users may not be set up yet.`);
      } else if (authError.message.includes('Invalid password')) {
        setError(`❌ Password Mismatch: Demo user "${employeeId}" exists but password doesn't match "WR2024".`);
      } else if (authError.message.includes('not active')) {
        setError(`❌ Account Inactive: Employee ID "${employeeId}" exists but account status is not active.`);
      } else if (authError.message.includes('password not set')) {
        setError(`❌ Password Not Set: Employee ID "${employeeId}" exists but password is not configured.`);
      } else if (authError.message.includes('migration failed')) {
        setError(`❌ Migration Failed: Could not update user "${employeeId}" with password hash. Please try again.`);
      } else if (authError.message.includes('Demo users must use password')) {
        setError(`❌ Wrong Password: Demo users must use password "WR2024".`);
      } else {
        setError(`❌ Demo Login Failed: ${authError.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use employee ID + password authentication
      await login(formData.employeeId, formData.password);
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error) setError('');
  };

  // Get appropriate icon for employee ID input
  const getIdentifierIcon = () => {
    return <User className="w-5 h-5 text-white/40" />;
  };

  // No validation message needed
  const getValidationMessage = () => {
    return null; // No validation feedback needed
  };

  // Note: Password setup removed - using employee ID only authentication

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <MysteelLogo
              size="lg"
              variant="full"
              className="mx-auto"
            />
          </div>

          {/* Clean Login Form */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Employee ID Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                  {getIdentifierIcon()}
                  <span className="ml-2">Employee ID</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-white/40
                             focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200
                             border-white/20 focus:ring-blue-400/50`}
                    placeholder="Enter employee ID (e.g., A0001, S0001, D0001)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmployeeIdHelp(!showEmployeeIdHelp)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
                {getValidationMessage()}
                
                {/* Employee ID Help */}
                {showEmployeeIdHelp && (
                  <div className="mt-2 p-3 bg-blue-500/20 border border-blue-400/50 rounded-xl">
                    <h4 className="text-sm font-medium text-blue-200 mb-2">Employee ID Format:</h4>
                    <div className="text-xs text-blue-300 space-y-1">
                      <div>• <strong>Admin:</strong> A0001, A0002, etc.</div>
                      <div>• <strong>Sales:</strong> S0001, S0002, etc.</div>
                      <div>• <strong>Design:</strong> D0001, D0002, etc.</div>
                      <div>• <strong>Production:</strong> P0001, P0002, etc.</div>
                      <div>• <strong>Installation:</strong> I0001, I0002, etc.</div>
                    </div>
                    <div className="mt-2 text-xs text-blue-200">
                      Don't know your Employee ID? Contact your supervisor or HR.
                    </div>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40
                             focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer text-white/60 hover:text-white/80">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400/50"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                  onClick={() => alert('Forgot password feature coming soon!')}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
                         text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200
                         hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Quick Demo Access Section */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-white/80 font-medium">Quick Demo Access</div>
                  <Settings className="w-4 h-4 text-white/60" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickAccessIds.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleDemoLogin(employee.id)}
                      disabled={loading}
                      className={`relative overflow-hidden rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg
                                bg-gradient-to-r ${employee.color} text-white font-medium text-sm
                                hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{employee.icon}</span>
                        <div>
                          <div className="font-semibold">{employee.name}</div>
                          <div className="text-xs opacity-90">({employee.id})</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-white/60 text-center">
                  Employee ID Authentication • Demo Users
                  <div className="mt-1 text-white/40">
                    Password: WR2024 for all demo accounts
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/40 text-xs">Secure SSL Connection</span>
            </div>
            <div className="text-white/30 text-xs">
              © 2025 Mysteel Construction • Enterprise Security
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
