import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Github, Gitlab, Building, ChevronDown } from 'lucide-react';

const SignUp = () => {
    const [formData, setFormData] = useState({
        organizationId: '',
        email: '',
        provider: '',
        password: '',
        confirmPassword: ''
    });
    const [organizations, setOrganizations] = useState([]);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    //const API_BASE_URL = 'http://localhost:5142/api';

    // Fetch organizations from API
    const fetchOrganizations = async () => {
        try {
            setLoadingOrgs(true);
            const response = await fetch(`api/organization`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch organizations');
            }
            
            const data = await response.json();
            setOrganizations(data);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setApiError('Failed to load organizations. Please try again.');
        } finally {
            setLoadingOrgs(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, []);

    // Validation rules
    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'organizationId':
                if (!value) {
                    newErrors.organizationId = 'Organization is required';
                } else {
                    delete newErrors.organizationId;
                }
                break;

            case 'email':
                if (!value.trim()) {
                    newErrors.email = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors.email = 'Please enter a valid email address';
                } else {
                    delete newErrors.email;
                }
                break;

            case 'provider':
                if (!value) {
                    newErrors.provider = 'Provider is required';
                } else {
                    delete newErrors.provider;
                }
                break;

            case 'password':
                if (!value) {
                    newErrors.password = 'Password is required';
                } else if (value.length > 6) {
                    newErrors.password = 'Password must be maximum 6 characters long';
                } else {
                    delete newErrors.password;
                }
                break;

            case 'confirmPassword':
                if (!value) {
                    newErrors.confirmPassword = 'Please confirm your password';
                } else if (value !== formData.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else {
                    delete newErrors.confirmPassword;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  // ✅ Store orgId in local storage when org is selected
  if (name === "organizationId") {
    localStorage.setItem("OrgId", value);
  }
  if (name === "email") {
  localStorage.setItem("Email", value);
}


  // Clear API error when user starts typing
  if (apiError) setApiError("");

  // Validate field on change
  validateField(name, value);
};


    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        // Validate all fields before submission
        Object.keys(formData).forEach(field => {
            validateField(field, formData[field]);
        });

        // Check if there are any errors
        if (Object.keys(errors).length === 0) {
            setLoading(true);
            try {
                // Prepare data for API - now using organizationId directly
                const userData = {
                    orgId: parseInt(formData.organizationId), // Convert to number
                    email: formData.email,
                    provider: formData.provider
                    };

                console.log('Sending registration data:', userData);

                const response = await fetch(`api/user/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                const contentType = response.headers.get('content-type');
                const responseText = await response.text();
                
                console.log('Content-Type:', contentType);
                console.log('Response text:', responseText);

                if (!response.ok) {
                    if (contentType && contentType.includes('text/html')) {
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    }
                    
                    try {
                        const errorJson = JSON.parse(responseText);
                        throw new Error(errorJson.message || `Error: ${response.status}`);
                    } catch {
                        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
                    }
                }

                let result;
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = { message: 'Registration successful' };
                }

                console.log('Registration successful:', result);
                
                navigate('/signin', { 
                    state: { 
                        message: 'Registration successful! Please sign in.' 
                    } 
                });

            } catch (err) {
                console.error('Registration error:', err);
                setApiError(err.message || 'Registration failed. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSocialSignUp = async (provider) => {
        setApiError('');
        setLoading(true);
        
        try {
            // For social sign up, use the first organization as default
            const defaultOrgId = organizations.length > 0 ? organizations[0].id : 1;
            
            const socialUserData = {
                orgId: defaultOrgId,
                email: formData.email || `${provider.toLowerCase()}@example.com`,
                provider: provider.toLowerCase(),
              };

            const response = await fetch(`api/user/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(socialUserData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `${provider} sign up failed`);
            }

            console.log(`${provider} sign up successful:`, result);
            
            navigate('/dashboard', { 
                state: { 
                    message: `${provider} sign up successful!` 
                } 
            });

        } catch (err) {
            console.error(`${provider} sign up error:`, err);
            setApiError(err.message || `${provider} sign up failed. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return Object.keys(formData).every(field => {
            // Skip password validation since fields are commented out
            if (field === 'password' || field === 'confirmPassword') return true;
            return formData[field].trim();
        }) && Object.keys(errors).length === 0;
    };

return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        Or{' '}
                        <Link
                            to="/signin"
                            className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500"
                        >
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                {/* API Error Display */}
                {apiError && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                        {apiError}
                        <button 
                            onClick={() => setApiError('')}
                            className="float-right font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Organization Field */}
                        <div>
                            <label htmlFor="organizationId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Organization
                            </label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                                <select
                                    id="organizationId"
                                    name="organizationId"
                                    value={formData.organizationId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 ${errors.organizationId
                                        ? 'border-red-500 dark:border-red-400'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}
                                    required
                                    disabled={loadingOrgs}
                                >
                                    <option value="">Select an organization</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                            {loadingOrgs && (
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Loading organizations...</p>
                            )}
                            {errors.organizationId && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organizationId}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 ${errors.email
                                        ? 'border-red-500 dark:border-red-400'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}
                                    placeholder="Enter your email address"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                            )}
                        </div>

                        {/* Provider Field */}
                        <div>
                            <label htmlFor="provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Provider
                            </label>
                            <select
                                id="provider"
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`appearance-none relative block w-full px-3 py-3 border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 ${errors.provider
                                    ? 'border-red-500 dark:border-red-400'
                                    : 'border-slate-300 dark:border-slate-600'
                                    }`}
                                required
                            >
                                <option value="">Select a provider</option>
                                <option value="github">GitHub</option>
                                <option value="gitlab">GitLab</option>
                                <option value="azure">Azure DevOps</option>
                                <option value="bitbucket">Bitbucket</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.provider && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.provider}</p>
                            )}
                        </div>

                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={!isFormValid() || loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors ${(!isFormValid() || loading)
                                ? 'bg-violet-400 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-700'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* Social Sign Up Options */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialSignUp('Google')}
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialSignUp('GitHub')}
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Github className="w-5 h-5 mr-2" />
                            GitHub
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialSignUp('GitLab')}
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Gitlab className="w-5 h-5 mr-2" />
                            GitLab
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialSignUp('Bitbucket')}
                            disabled={loading}
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#0052CC">
                                <path d="M.778 1.211c-.424-.006-.772.334-.778.758 0 .2.079.391.22.531l10.952 10.953c.14.14.33.22.53.22.424-.006.764-.354.758-.778 0-.2-.08-.391-.22-.531L1.529 1.431A.748.748 0 0 0 .778 1.211zm11.55 10.734L23.28 1.211a.748.748 0 0 1 .531-.22c.424.006.772.334.778.758 0 .2-.079.391-.22.531L13.417 12.484c-.14.14-.33.22-.53.22-.424.006-.764-.354-.758-.778 0-.2.08-.391.22-.531zm0 0"/>
                            </svg>
                            Bitbucket
                        </button>
                    </div>

                    {/* Terms and Privacy */}
                    <div className="text-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            By creating an account, you agree to our{' '}
                            <a href="#" className="text-violet-600 dark:text-violet-400 hover:text-violet-500">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="text-violet-600 dark:text-violet-400 hover:text-violet-500">
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;