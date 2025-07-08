import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegisterMode }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or employee ID
    password: '',
    name: '',
    role: 'sales' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [rememberMe, setRememberMe] = useState(false);

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
    
    // Real-time validation
    if (value.trim()) {
      validateField(name, value);
    }
  };

  // Production credentials for quick demo access
  const PRODUCTION_CREDENTIALS = {
    'admin@mysteel.com': 'MS2024!Admin#Secure',
    'sales@mysteel.com': 'MS2024!Sales#Manager',
    'design@mysteel.com': 'MS2024!Design#Engineer',
    'production@mysteel.com': 'MS2024!Prod#Manager',
    'installation@mysteel.com': 'MS2024!Install#Super',
    // Employee ID credentials
    'EMP001': 'MS2024!Admin#Secure',
    'EMP002': 'MS2024!Sales#Manager',
    'EMP003': 'MS2024!Design#Engineer',
    'EMP004': 'MS2024!Prod#Manager',
    'EMP005': 'MS2024!Install#Super'
  };

  const quickLogin = (identifier: string) => {
    const password = PRODUCTION_CREDENTIALS[identifier as keyof typeof PRODUCTION_CREDENTIALS];
    setFormData(prev => ({ ...prev, identifier, password }));
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
                      {/* Enhanced Name Field */}
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
                                     backdrop-blur-sm group-hover:border-white/40"
                            placeholder="Enter your full name"
                            required={isRegisterMode}
                            autoComplete="name"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-indigo-400/0 
                                        group-focus-within:from-blue-400/10 group-focus-within:via-purple-400/10 group-focus-within:to-indigo-400/10 
                                        transition-all duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Enhanced Role Selection */}
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

                  {/* Enhanced Email/ID Field */}
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
                                 backdrop-blur-sm group-hover:border-white/40"
                        placeholder={isRegisterMode ? 'Enter your email address' : 'Enter email or employee ID'}
                        required
                        autoComplete={isRegisterMode ? 'email' : 'username'}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-indigo-400/0 
                                    group-focus-within:from-blue-400/10 group-focus-within:via-purple-400/10 group-focus-within:to-indigo-400/10 
                                    transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Enhanced Password Field */}
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
                                 backdrop-blur-sm group-hover:border-white/40"
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
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-indigo-400/0 
                                    group-focus-within:from-blue-400/10 group-focus-within:via-purple-400/10 group-focus-within:to-indigo-400/10 
                                    transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Enhanced Error Display */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-shake">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Remember Me Checkbox - Login Only */}
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
                              <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
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
                        onClick={() => {/* TODO: Implement forgot password */}}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Enhanced Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 
                             text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform 
                             hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                             disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent
                             group relative overflow-hidden"
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

                  {/* Email/Employee ID Field */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-white/90">
                      {isRegisterMode ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      <span>{isRegisterMode ? 'Email Address' : 'Email or Employee ID'}</span>
                    </label>
                    <div className="relative group">
                      <input
                        type={isRegisterMode ? "email" : "text"}
                        name="identifier"
                        placeholder={isRegisterMode ? "Enter your email address" : "Enter email or employee ID"}
                        value={formData.identifier}
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

              {/* Employee ID Quick Login Section */}
              <div className="mt-6">
                <div className="text-center mb-4">
                  <p className="text-white/50 text-xs font-medium">Or use Employee ID</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => quickLogin('EMP001')}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs text-white/80 font-medium">EMP001</div>
                      <div className="text-xs text-white/40">Admin</div>
                    </div>
                  </button>

                  <button
                    onClick={() => quickLogin('EMP002')}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs text-white/80 font-medium">EMP002</div>
                      <div className="text-xs text-white/40">Sales</div>
                    </div>
                  </button>

                  <button
                    onClick={() => quickLogin('EMP003')}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs text-white/80 font-medium">EMP003</div>
                      <div className="text-xs text-white/40">Design</div>
                    </div>
                  </button>

                  <button
                    onClick={() => quickLogin('EMP004')}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <Factory className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs text-white/80 font-medium">EMP004</div>
                      <div className="text-xs text-white/40">Production</div>
                    </div>
                  </button>

                  <button
                    onClick={() => quickLogin('EMP005')}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-300 text-center"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs text-white/80 font-medium">EMP005</div>
                      <div className="text-xs text-white/40">Install</div>
                    </div>
                  </button>
                </div>
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
