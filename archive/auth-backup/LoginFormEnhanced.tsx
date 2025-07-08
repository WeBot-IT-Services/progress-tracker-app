import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MysteelLogo from '../common/MysteelLogo';
import type { UserRole } from '../../types';
import './animations.css';
import {
  Eye,
  EyeOff,
  Shield,
  Users,
  Wrench,
  Factory,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  Settings,
  AlertCircle
} from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegisterMode }) => {
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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials
  useEffect(() => {
    if (!isRegisterMode) {
      const remembered = localStorage.getItem('rememberMe');
      const lastIdentifier = localStorage.getItem('lastIdentifier');
      if (remembered === 'true' && lastIdentifier) {
        setFormData(prev => ({ ...prev, identifier: lastIdentifier }));
        setRememberMe(true);
      }
    }
  }, [isRegisterMode]);

  const validateField = (name: string, value: string) => {
    const errors: {[key: string]: string} = {};
    
    switch (name) {
      case 'identifier':
        if (!value.trim()) {
          errors.identifier = isRegisterMode ? 'Email is required' : 'Email or Employee ID is required';
        } else if (isRegisterMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.identifier = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (isRegisterMode && value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        }
        break;
      case 'name':
        if (isRegisterMode && !value.trim()) {
          errors.name = 'Full name is required';
        }
        break;
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate all fields
    const isValidIdentifier = validateField('identifier', formData.identifier);
    const isValidPassword = validateField('password', formData.password);
    const isValidName = !isRegisterMode || validateField('name', formData.name);

    if (!isValidIdentifier || !isValidPassword || !isValidName) {
      setLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        await register(formData.identifier, formData.password, formData.name, formData.role);
      } else {
        await login(formData.identifier, formData.password);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastIdentifier', formData.identifier);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('lastIdentifier');
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
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
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error
    if (error) {
      setError('');
    }
  };

  // Quick login credentials for demo
  const quickLogin = (identifier: string, password: string) => {
    setFormData(prev => ({ ...prev, identifier, password }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">

          {/* Logo and Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <MysteelLogo
                size="xl"
                variant="full"
                className="mx-auto transform hover:scale-105 transition-all duration-500"
              />
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden glass-card">
              
              <div className="relative z-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Registration Fields */}
                  {isRegisterMode && (
                    <div className="space-y-6 animate-slide-down">
                      {/* Name Field */}
                      <div className="group">
                        <label className="block text-sm font-medium text-blue-100 mb-2 transition-colors group-focus-within:text-blue-300">
                          <User className="inline w-4 h-4 mr-2" />
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-blue-200 
                                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                                     transition-all duration-300 hover:bg-white/15 focus:bg-white/20
                                     backdrop-blur-sm group-hover:border-white/40 form-input"
                            placeholder="Enter your full name"
                            required={isRegisterMode}
                            autoComplete="name"
                          />
                          {fieldErrors.name && (
                            <div className="mt-1 text-red-400 text-xs flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {fieldErrors.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Role Selection */}
                      <div className="group">
                        <label className="block text-sm font-medium text-blue-100 mb-2 transition-colors group-focus-within:text-blue-300">
                          <Settings className="inline w-4 h-4 mr-2" />
                          Department Role
                        </label>
                        <div className="relative">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white 
                                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                                     transition-all duration-300 hover:bg-white/15 focus:bg-white/20
                                     backdrop-blur-sm group-hover:border-white/40 appearance-none cursor-pointer"
                            required={isRegisterMode}
                          >
                            <option value="admin" className="bg-slate-800 text-white">👑 Administrator</option>
                            <option value="sales" className="bg-slate-800 text-white">💼 Sales Team</option>
                            <option value="design" className="bg-slate-800 text-white">🎨 Design & Engineering</option>
                            <option value="production" className="bg-slate-800 text-white">🏭 Production Team</option>
                            <option value="installation" className="bg-slate-800 text-white">🔧 Installation Team</option>
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email/ID Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-blue-100 mb-2 transition-colors group-focus-within:text-blue-300">
                      <Mail className="inline w-4 h-4 mr-2" />
                      {isRegisterMode ? 'Email Address' : 'Email or Employee ID'}
                    </label>
                    <div className="relative">
                      <input
                        type={isRegisterMode ? 'email' : 'text'}
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-blue-200 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                                 transition-all duration-300 hover:bg-white/15 focus:bg-white/20
                                 backdrop-blur-sm group-hover:border-white/40 form-input"
                        placeholder={isRegisterMode ? 'Enter your email address' : 'Enter email or employee ID'}
                        required
                        autoComplete={isRegisterMode ? 'email' : 'username'}
                      />
                      {fieldErrors.identifier && (
                        <div className="mt-1 text-red-400 text-xs flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {fieldErrors.identifier}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="group">
                    <label className="block text-sm font-medium text-blue-100 mb-2 transition-colors group-focus-within:text-blue-300">
                      <Lock className="inline w-4 h-4 mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/30 rounded-xl text-white placeholder-blue-200 
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent 
                                 transition-all duration-300 hover:bg-white/15 focus:bg-white/20
                                 backdrop-blur-sm group-hover:border-white/40 form-input"
                        placeholder="Enter your password"
                        required
                        autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white 
                                 transition-colors duration-200 focus:outline-none focus:text-white p-1 rounded-lg
                                 hover:bg-white/10 focus:bg-white/10"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {fieldErrors.password && (
                        <div className="mt-1 text-red-400 text-xs flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {fieldErrors.password}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-shake">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Remember Me - Login Only */}
                  {!isRegisterMode && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                            rememberMe 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-white/30 hover:border-white/50'
                          }`}>
                            {rememberMe && (
                              <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-blue-200 group-hover:text-white transition-colors">
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        className="text-sm text-blue-300 hover:text-white transition-colors focus:outline-none focus:underline"
                        onClick={() => alert('Forgot password feature coming soon!')}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 
                             text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform 
                             hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                             disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent
                             group relative overflow-hidden button-enhanced"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full 
                                  group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Mode Toggle */}
                <div className="text-center mt-6">
                  <p className="text-blue-200 text-sm">
                    {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
                    <button
                      onClick={onToggleMode}
                      className="ml-2 text-blue-300 hover:text-white font-semibold transition-colors duration-200 focus:outline-none focus:underline"
                    >
                      {isRegisterMode ? 'Sign In' : 'Create One'}
                    </button>
                  </p>
                </div>

                {/* Quick Login Demo (Login mode only) */}
                {!isRegisterMode && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-center text-blue-200 text-xs mb-3">Quick Demo Access</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => quickLogin('admin@mysteel.com', 'MS2024!Admin#Secure')}
                        className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-xs text-blue-200 hover:text-white transition-colors"
                      >
                        👑 Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => quickLogin('sales@mysteel.com', 'MS2024!Sales#Manager')}
                        className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-xs text-blue-200 hover:text-white transition-colors"
                      >
                        💼 Sales
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-xs font-medium">Secure SSL Connection</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-white/40">
              <span>© {new Date().getFullYear()} Mysteel Construction</span>
              <span>•</span>
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
