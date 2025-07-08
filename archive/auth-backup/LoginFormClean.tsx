import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MysteelLogo from '../common/MysteelLogo';
import type { UserRole } from '../../types';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  Settings
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        await register(formData.identifier, formData.password, formData.name, formData.role);
      } else {
        await login(formData.identifier, formData.password);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const quickLogin = (identifier: string, password: string) => {
    setFormData(prev => ({ ...prev, identifier, password }));
  };

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
              
              {/* Registration Fields */}
              {isRegisterMode && (
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 
                               focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                      required={isRegisterMode}
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                      <Settings className="w-4 h-4 mr-2" />
                      Department Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
                               focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200
                               appearance-none cursor-pointer"
                      required={isRegisterMode}
                    >
                      <option value="admin" className="bg-slate-800">👑 Administrator</option>
                      <option value="sales" className="bg-slate-800">💼 Sales Team</option>
                      <option value="design" className="bg-slate-800">🎨 Design & Engineering</option>
                      <option value="production" className="bg-slate-800">🏭 Production Team</option>
                      <option value="installation" className="bg-slate-800">🔧 Installation Team</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Email/ID Field */}
              <div>
                <label className="flex items-center text-sm font-medium text-white/80 mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  {isRegisterMode ? 'Email Address' : 'Email or Employee ID'}
                </label>
                <input
                  type={isRegisterMode ? 'email' : 'text'}
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 
                           focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
                  placeholder={isRegisterMode ? 'Enter your email address' : 'Enter email or employee ID'}
                  required
                />
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

              {/* Remember Me - Login Only */}
              {!isRegisterMode && (
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
              )}

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
                    <span>{isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Toggle */}
            <div className="text-center mt-4">
              <p className="text-white/60 text-sm">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={onToggleMode}
                  className="ml-2 text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                >
                  {isRegisterMode ? 'Sign In' : 'Create One'}
                </button>
              </p>
            </div>

            {/* Quick Demo Access */}
            {!isRegisterMode && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-center text-white/40 text-xs mb-2">Quick Demo Access</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => quickLogin('admin@mysteel.com', 'MS2024!Admin#Secure')}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('sales@mysteel.com', 'MS2024!Sales#Manager')}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    💼 Sales
                  </button>
                </div>
              </div>
            )}
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
