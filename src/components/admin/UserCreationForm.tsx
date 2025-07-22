import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { usersService } from '../../services/firebaseService';
import { hashPassword } from '../../utils/passwordUtils';
import EnhancedEmployeeIdAuthService from '../../services/enhancedEmployeeIdAuth';
import type { UserRole } from '../../types';

interface UserCreationFormProps {
  onUserCreated?: (user: any) => void;
  onClose?: () => void;
}

const UserCreationForm: React.FC<UserCreationFormProps> = ({ onUserCreated, onClose }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    role: 'sales' as UserRole,
    department: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');

    // Validate password in real-time
    if (name === 'password') {
      const validation = EnhancedEmployeeIdAuthService.validatePassword(value, formData.employeeId);
      setPasswordValidation(validation);
    }

    // Auto-set department based on employee ID
    if (name === 'employeeId') {
      const department = getDepartmentFromEmployeeId(value);
      if (department) {
        setFormData(prev => ({ ...prev, department }));
      }
    }
  };

  const getDepartmentFromEmployeeId = (employeeId: string): string => {
    const prefix = employeeId.charAt(0).toUpperCase();
    const departmentMap: Record<string, string> = {
      'A': 'Administration',
      'S': 'Sales',
      'D': 'Design',
      'P': 'Production',
      'I': 'Installation',
      'L': 'Leadership'
    };
    return departmentMap[prefix] || '';
  };

  const getRoleFromEmployeeId = (employeeId: string): UserRole => {
    const prefix = employeeId.charAt(0).toUpperCase();
    const roleMap: Record<string, UserRole> = {
      'A': 'admin',
      'S': 'sales',
      'D': 'designer',
      'P': 'production',
      'I': 'installation',
      'L': 'admin'
    };
    return roleMap[prefix] || 'sales';
  };

  const validateForm = (): string | null => {
    if (!formData.employeeId.trim()) {
      return 'Employee ID is required';
    }

    const employeeIdValidation = EnhancedEmployeeIdAuthService.validateIdentifier(formData.employeeId);
    if (!employeeIdValidation.isValid) {
      return employeeIdValidation.error || 'Invalid Employee ID format';
    }

    if (!formData.name.trim()) {
      return 'Name is required';
    }

    if (!formData.email.trim()) {
      return 'Email is required';
    }

    if (!formData.password) {
      return 'Password is required';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (passwordValidation && !passwordValidation.isValid) {
      return passwordValidation.errors[0] || 'Password does not meet requirements';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Check if employee ID is available
      const isAvailable = await EnhancedEmployeeIdAuthService.isEmployeeIdAvailable(formData.employeeId);
      if (!isAvailable) {
        throw new Error('Employee ID already exists');
      }

      // Hash the password
      const passwordHash = await hashPassword(formData.password);

      // Auto-determine role from employee ID if not set
      const role = formData.role || getRoleFromEmployeeId(formData.employeeId);

      // Create user data
      const userData = {
        employeeId: formData.employeeId.toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        role,
        department: formData.department || getDepartmentFromEmployeeId(formData.employeeId),
        status: 'active' as const,
        passwordHash,
        passwordSet: true,
        isTemporary: false
      };

      // Create user in Firestore
      await usersService.createUser(userData);

      setSuccess(`User ${formData.employeeId} created successfully!`);
      
      // Reset form
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        role: 'sales',
        department: '',
        password: '',
        confirmPassword: ''
      });
      setPasswordValidation(null);

      // Notify parent component
      if (onUserCreated) {
        onUserCreated(userData);
      }

    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Create New User</h3>
            <p className="text-sm text-gray-600">Add a new user account to the system</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID *
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="A0001, S0001, D0001, etc."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: A0001 (Admin), S0001 (Sales), D0001 (Design), P0001 (Production), I0001 (Installation)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="user@mysteel.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
              <option value="designer">Designer</option>
              <option value="production">Production</option>
              <option value="installation">Installation</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Auto-filled based on Employee ID"
            readOnly
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordValidation && (
              <div className="mt-2">
                <div className={`text-xs ${passwordValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  Strength: {passwordValidation.strength}
                </div>
                {passwordValidation.errors.length > 0 && (
                  <ul className="text-xs text-red-600 mt-1 space-y-1">
                    {passwordValidation.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || (passwordValidation && !passwordValidation.isValid)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {submitting ? 'Creating User...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreationForm;
