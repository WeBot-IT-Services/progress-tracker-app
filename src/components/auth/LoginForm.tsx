import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MysteelLogo from '../common/MysteelLogo';
import type { UserRole } from '../../types';
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
  Settings
} from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegisterMode }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
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
        await register(formData.email, formData.password, formData.name, formData.role);
      } else {
        await login(formData.email, formData.password);
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
  };

  // Production credentials for quick demo access
  const PRODUCTION_CREDENTIALS = {
    'admin@mysteel.com': 'MS2024!Admin#Secure',
    'sales@mysteel.com': 'MS2024!Sales#Manager',
    'design@mysteel.com': 'MS2024!Design#Engineer',
    'production@mysteel.com': 'MS2024!Prod#Manager',
    'installation@mysteel.com': 'MS2024!Install#Super'
  };

  const quickLogin = (email: string) => {
    const password = PRODUCTION_CREDENTIALS[email as keyof typeof PRODUCTION_CREDENTIALS];
    setFormData(prev => ({ ...prev, email, password }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">

          {/* Logo and Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <MysteelLogo
                size="xl"
                variant="icon"
                className="mx-auto transform hover:scale-105 transition-all duration-500 hover:rotate-3 shadow-2xl"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl blur opacity-30 animate-pulse"></div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Progress
                </span>
                <br />
                <span className="text-white">Tracker</span>
              </h1>

              <div className="space-y-2">
                <p className="text-blue-200 text-lg sm:text-xl font-medium">
                  Mysteel Construction Management
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-slate-300 text-sm opacity-90">
                    {isRegisterMode ? 'Create your account to get started' : 'Welcome back, sign in to continue'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className="relative">
            {/* Glass Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl"></div>

              <div className="relative z-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isRegisterMode && (
                    <div className="space-y-6 animate-slide-down">
                      {/* Name Field */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-white/90">
                          <User className="w-4 h-4" />
                          <span>Full Name</span>
                        </label>
                        <div className="relative group">
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-base group-hover:bg-white/10"
                            required
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Role Field */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-white/90">
                          <Shield className="w-4 h-4" />
                          <span>Department Role</span>
                        </label>
                        <div className="relative group">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-base appearance-none cursor-pointer group-hover:bg-white/10"
                            required
                          >
                            <option value="sales" className="bg-slate-800 text-white">👥 Sales Department</option>
                            <option value="designer" className="bg-slate-800 text-white">🎨 Design & Engineering</option>
                            <option value="production" className="bg-slate-800 text-white">🏭 Production Team</option>
                            <option value="installation" className="bg-slate-800 text-white">🔧 Installation Crew</option>
                            <option value="admin" className="bg-slate-800 text-white">👑 Administrator</option>
                          </select>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-white/90">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-base group-hover:bg-white/10"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-white/90">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-300 text-base group-hover:bg-white/10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors duration-200 p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl text-sm backdrop-blur-sm animate-slide-down">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-2xl text-base overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>{isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </div>
                  </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-blue-300 hover:text-blue-200 text-sm font-semibold transition-colors duration-200 relative group"
                  >
                    <span className="relative z-10">
                      {isRegisterMode
                        ? "Already have an account? Sign In"
                        : "Don't have an account? Create One"
                      }
                    </span>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Login Section */}
          {!isRegisterMode && (
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-white/60 text-sm font-medium mb-4">Quick Demo Access</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => quickLogin('admin@mysteel.com')}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Admin Access</h4>
                      <p className="text-white/60 text-xs">Full system control</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/40 font-mono">
                    admin@mysteel.com
                  </div>
                </button>

                <button
                  onClick={() => quickLogin('sales@mysteel.com')}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Sales Demo</h4>
                      <p className="text-white/60 text-xs">Sales department</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/40 font-mono">
                    sales@mysteel.com
                  </div>
                </button>

                <button
                  onClick={() => quickLogin('design@mysteel.com')}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Designer</h4>
                      <p className="text-white/60 text-xs">Design & engineering</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/40 font-mono">
                    design@mysteel.com
                  </div>
                </button>

                <button
                  onClick={() => quickLogin('production@mysteel.com')}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                      <Factory className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Production</h4>
                      <p className="text-white/60 text-xs">Manufacturing</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/40 font-mono">
                    production@mysteel.com
                  </div>
                </button>

                <button
                  onClick={() => quickLogin('installation@mysteel.com')}
                  className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Installation</h4>
                      <p className="text-white/60 text-xs">Installation crew</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/40 font-mono">
                    installation@mysteel.com
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-xs font-medium">Secure SSL Connection</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-white/40">
              <span>© 2025 Mysteel Construction Sdn Bhd</span>
              <span>•</span>
              <span>Enterprise Grade Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
