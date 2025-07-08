import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MysteelLogo from '../common/MysteelLogo';
import FirstTimePasswordSetup from './FirstTimePasswordSetup';
import { adminUserService } from '../../services/adminUserService';
import EnhancedEmployeeIdAuthService from '../../services/enhancedEmployeeIdAuth';
import type { UserRole } from '../../types';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  Settings,
  Key,
  AlertCircle,
  Info
} from 'lucide-react';

interface LoginFormProps {
  // No props needed for login-only mode
}

const LoginForm: React.FC<LoginFormProps> = () => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    name: '',
    role: 'sales' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [firstTimeEmail, setFirstTimeEmail] = useState('');
  const [identifierValidation, setIdentifierValidation] = useState<any>(null);
  const [showEmployeeIdHelp, setShowEmployeeIdHelp] = useState(false);

  // Quick access employee IDs for Firebase demo users
  const [quickAccessIds] = useState([
    { id: 'A0001', department: 'Admin', name: 'Admin', icon: '👑', color: 'from-yellow-400 to-yellow-600' },
    { id: 'S0001', department: 'Sales', name: 'Sales', icon: '💼', color: 'from-blue-400 to-blue-600' },
    { id: 'D0001', department: 'Design', name: 'Design', icon: '🎨', color: 'from-purple-400 to-purple-600' },
    { id: 'P0001', department: 'Production', name: 'Production', icon: '🏭', color: 'from-green-400 to-green-600' },
    { id: 'I0001', department: 'Install', name: 'Install', icon: '🔧', color: 'from-orange-400 to-orange-600' }
  ]);



  // Validate identifier as user types
  const validateIdentifier = (identifier: string) => {
    const validation = EnhancedEmployeeIdAuthService.validateIdentifier(identifier);
    setIdentifierValidation(validation);
    return validation;
  };

  // Quick access handler - now includes demo login
  const handleQuickAccess = (employeeId: string) => {
    setFormData(prev => ({ ...prev, identifier: employeeId }));
    validateIdentifier(employeeId);
  };

  // Firebase-based demo login handler
  const handleDemoLogin = async (employeeId: string) => {
    setLoading(true);
    setError('');

    try {
      console.log(`🎯 Attempting Firebase demo login for Employee ID: ${employeeId}`);

      // Use the standard Firebase authentication flow
      // The demo users must exist in Firebase Authentication with proper credentials
      await login(employeeId, 'WR2024'); // Standard demo password for Firebase users

      console.log(`✅ Firebase demo login successful for ${employeeId}`);
    } catch (authError: any) {
      console.log('❌ Firebase demo login failed:', authError.message);

      // Provide helpful error message for missing demo users
      if (authError.message.includes('No account found') || authError.message.includes('invalid-credential')) {
        setError(`Demo user ${employeeId} not found in Firebase. Please ensure demo users are created in Firebase Authentication.`);
      } else {
        setError('Demo login failed. Please try again or contact administrator.');
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
      // Use enhanced employee ID authentication service
      try {
        await EnhancedEmployeeIdAuthService.login(formData.identifier, formData.password);
      } catch (authError: any) {
        // Check if this is a first-time user that needs password setup
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
          const email = formData.identifier.includes('@') ? formData.identifier : null;
          if (email) {
            const userStatus = await adminUserService.checkPasswordStatus(email);
            if (userStatus.exists && userStatus.needsPassword) {
              setFirstTimeEmail(email);
              setShowPasswordSetup(true);
              return;
            }
          }
        }
        throw authError;
      }
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
    
    // Validate identifier on change
    if (name === 'identifier') {
      validateIdentifier(value);
    }
    
    if (error) setError('');
  };

  // Get appropriate icon based on identifier type
  const getIdentifierIcon = () => {
    if (!identifierValidation) return <Mail className="w-5 h-5 text-white/40" />;
    
    switch (identifierValidation.format) {
      case 'email': return <Mail className="w-5 h-5 text-blue-400" />;
      case 'employeeId': return <User className="w-5 h-5 text-green-400" />;
      default: return <Mail className="w-5 h-5 text-white/40" />;
    }
  };

  // Get validation message
  const getValidationMessage = () => {
    if (!identifierValidation || !formData.identifier) return null;
    
    if (identifierValidation.format === 'invalid' && formData.identifier.length > 0) {
      return (
        <div className="flex items-center text-red-300 text-sm mt-1">
          <AlertCircle className="w-4 h-4 mr-1" />
          {identifierValidation.error}
        </div>
      );
    }
    
    if (identifierValidation.format === 'employeeId') {
      return (
        <div className="flex items-center text-green-300 text-sm mt-1">
          <CheckCircle className="w-4 h-4 mr-1" />
          Valid Employee ID ({identifierValidation.department?.toUpperCase()})
        </div>
      );
    }
    
    if (identifierValidation.format === 'email') {
      return (
        <div className="flex items-center text-blue-300 text-sm mt-1">
          <CheckCircle className="w-4 h-4 mr-1" />
          Valid email format
        </div>
      );
    }
    
    return null;
  };

  // If showing password setup, render that component instead
  if (showPasswordSetup) {
    return (
      <FirstTimePasswordSetup
        email={firstTimeEmail}
        onComplete={(success) => {
          setShowPasswordSetup(false);
          if (success) {
            // Password was set successfully, show success message
            setError('');
            alert('Password set successfully! Please log in with your new password.');
          }
        }}
        onBack={() => {
          setShowPasswordSetup(false);
          setFirstTimeEmail('');
        }}
      />
    );
  }

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
              
              {/* Email/ID Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                  {getIdentifierIcon()}
                  <span className="ml-2">Email or Employee ID</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-xl text-white placeholder-white/40
                             focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 ${
                               identifierValidation?.format === 'invalid' && formData.identifier.length > 0
                                 ? 'border-red-400/50 focus:ring-red-400/50'
                                 : identifierValidation?.format === 'employeeId'
                                 ? 'border-green-400/50 focus:ring-green-400/50'
                                 : identifierValidation?.format === 'email'
                                 ? 'border-blue-400/50 focus:ring-blue-400/50'
                                 : 'border-white/20 focus:ring-blue-400/50'
                             }`}
                    placeholder="Enter email or employee ID (e.g., A0001, S0001)"
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
                    placeholder="Enter your password (optional for demo accounts)"
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
                disabled={loading || (identifierValidation?.format === 'invalid' && formData.identifier.length > 0)}
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
                  Firebase Authentication • Demo Users
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
