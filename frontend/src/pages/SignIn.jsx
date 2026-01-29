// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

// const SignIn = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     provider: ''
//   });
//   const [errors, setErrors] = useState({});
//   const [apiError, setApiError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const navigate = useNavigate();

//   //const API_BASE_URL = 'http://localhost:5142/api';

//   // Validation rules
//   const validateField = (name, value) => {
//     const newErrors = { ...errors };

//     switch (name) {
//       case 'email':
//         if (!value.trim()) {
//           newErrors.email = 'Email is required';
//         } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
//           newErrors.email = 'Please enter a valid email address';
//         } else {
//           delete newErrors.email;
//         }
//         break;

//       case 'provider':
//         if (!value) {
//           newErrors.provider = 'Provider is required';
//         } else {
//           delete newErrors.provider;
//         }
//         break;

//       default:
//         break;
//     }

//     setErrors(newErrors);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // Clear API error when user starts typing
//     if (apiError) setApiError('');

//     // Validate field on change
//     validateField(name, value);
//   };

//   const handleBlur = (e) => {
//     const { name, value } = e.target;
//     validateField(name, value);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setApiError('');

//     // Validate all fields before submission
//     Object.keys(formData).forEach(field => {
//       validateField(field, formData[field]);
//     });

//     // Check if there are any errors
//     if (Object.keys(errors).length === 0) {
//       setLoading(true);
//       try {
//         const loginData = {
//           email: formData.email,
//           provider: formData.provider
//         };

//         console.log('Sending login data:', loginData);

//         const response = await fetch(`/api/user/signin`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(loginData)
//         });

//         const contentType = response.headers.get('content-type');
//         const responseText = await response.text();
        
//         console.log('Response status:', response.status);
//         console.log('Content-Type:', contentType);

//         if (!response.ok) {
//           // Handle HTML error responses from ASP.NET
//           if (contentType && contentType.includes('text/html')) {
//             throw new Error(`Server error: ${response.status} ${response.statusText}`);
//           }
          
//           // Try to parse as JSON for structured errors
//           try {
//             const errorJson = JSON.parse(responseText);
//             throw new Error(errorJson.message || `Error: ${response.status}`);
//           } catch {
//             throw new Error(`Login failed: ${response.status} ${response.statusText}`);
//           }
//         }

//         // Handle successful response
//         let result;
//         try {
//           result = JSON.parse(responseText);
//         } catch {
//           throw new Error('Invalid response from server');
//         }

//         console.log('Login successful:', result);

//         // Store remember me preference
//         if (rememberMe) {
//           localStorage.setItem('rememberMe', 'true');
//           localStorage.setItem('userEmail', formData.email);
//         } else {
//           localStorage.removeItem('rememberMe');
//           localStorage.removeItem('userEmail');
//         }

//         // Redirect based on response
//         if (result.redirectPath) {
//           navigate(result.redirectPath, { 
//             state: { 
//               message: result.message || 'Login successful!'
//             } 
//           });
//         } else {
//           // Default redirect
//           navigate('/', { 
//             state: { 
//               message: 'Login successful!'
//             } 
//           });
//         }

//       } catch (err) {
//         console.error('Login error:', err);
//         setApiError(err.message || 'Login failed. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const isFormValid = () => {
//     return formData.email.trim() && formData.provider && Object.keys(errors).length === 0;
//   };

//   // Load remembered email on component mount
//   React.useEffect(() => {
//     const remembered = localStorage.getItem('rememberMe');
//     const rememberedEmail = localStorage.getItem('userEmail');
    
//     if (remembered === 'true' && rememberedEmail) {
//       setFormData(prev => ({ ...prev, email: rememberedEmail }));
//       setRememberMe(true);
//     }
//   }, []);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div>
//           <div className="mx-auto h-12 w-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center">
//             <span className="text-white font-bold text-lg">S</span>
//           </div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
//             Sign in to your account
//           </h2>
//           <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
//             Or{' '}
//             <Link
//               to="/"
//               className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500"
//             >
//               return to dashboard
//             </Link>
//           </p>
//         </div>

//         {/* API Error Display */}
//         {apiError && (
//           <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
//             {apiError}
//             <button 
//               onClick={() => setApiError('')}
//               className="float-right font-bold"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           <div className="space-y-4">
//             {/* Email Field */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   autoComplete="email"
//                   required
//                   value={formData.email}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 ${errors.email
//                     ? 'border-red-500 dark:border-red-400'
//                     : 'border-slate-300 dark:border-slate-600'
//                     }`}
//                   placeholder="Enter your email address"
//                 />
//               </div>
//               {errors.email && (
//                 <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
//               )}
//             </div>

//             {/* Provider Field */}
//             <div>
//               <label htmlFor="provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
//                 Provider
//               </label>
//               <select
//                 id="provider"
//                 name="provider"
//                 value={formData.provider}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 className={`appearance-none relative block w-full px-3 py-3 border placeholder-slate-500 dark:placeholder-slate-400 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 ${errors.provider
//                   ? 'border-red-500 dark:border-red-400'
//                   : 'border-slate-300 dark:border-slate-600'
//                   }`}
//                 required
//               >
//                 <option value="">Select a provider</option>
//                 <option value="github">GitHub</option>
//                 <option value="gitlab">GitLab</option>
//                 <option value="azure">Azure DevOps</option>
//                 <option value="bitbucket">Bitbucket</option>
//                 <option value="other">Other</option>
//               </select>
//               {errors.provider && (
//                 <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.provider}</p>
//               )}
//             </div>

//             {/* Password Field - Commented Out */}
//             {/* ... your commented password field ... */}
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <input
//                 id="remember-me"
//                 name="remember-me"
//                 type="checkbox"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-slate-600 rounded"
//               />
//               <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
//                 Remember me
//               </label>
//             </div>

//             {/* Forgot Password - Commented Out */}
//             {/* ... your commented forgot password link ... */}
//           </div>

//           <div>
//             <button
//               type="submit"
//               disabled={!isFormValid() || loading}
//               className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors ${(!isFormValid() || loading)
//                 ? 'bg-violet-400 cursor-not-allowed'
//                 : 'bg-violet-600 hover:bg-violet-700'
//                 }`}
//             >
//               {loading ? (
//                 <div className="flex items-center">
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   Signing in...
//                 </div>
//               ) : (
//                 'Sign in'
//               )}
//             </button>
//           </div>

//           <div className="text-center">
//             <span className="text-sm text-slate-600 dark:text-slate-400">
//               Don't have an account?{' '}
//               <Link 
//                 to="/signup" 
//                 className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500"
//               >
//                 Sign up
//               </Link>
//             </span>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SignIn;


import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Building, ChevronDown } from 'lucide-react';
import axios from 'axios';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    organizationId: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await fetch(`/api/organization`);
      
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
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'organizationId':
        if (!value) {
          newErrors.organizationId = 'Organization is required';
        } else {
          delete newErrors.organizationId;
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

    // Clear API error when user starts typing
    if (apiError) setApiError('');

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
      const loginData = {
        email: formData.email,
        organizationId: parseInt(formData.organizationId)
      };

      console.log('Sending login data:', loginData);

      // Using axios - CORRECT WAY
      const response = await axios.post(`/api/user/signin`, loginData);

      console.log('Login successful:', response.data);

      // ✅ Store in localStorage only after successful validation
      localStorage.setItem('OrgId', formData.organizationId);
      localStorage.setItem('Email', formData.email);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', formData.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
      }

      // Redirect based on response
      if (response.data.redirectPath) {
        navigate(response.data.redirectPath, { 
          state: { 
            message: response.data.message || 'Login successful!'
          } 
        });
      } else {
        // Default redirect
        navigate('/', { 
          state: { 
            message: 'Login successful!'
          } 
        });
      }

    } catch (err) {
      console.error('Login error:', err);
      // Axios error handling - different from fetch
      if (err.response) {
        // Server responded with error status
        setApiError(err.response.data?.message || `Error: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received
        setApiError('No response from server. Please try again.');
      } else {
        // Something else happened
        setApiError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }
};

  const isFormValid = () => {
    return formData.email.trim() && formData.organizationId && Object.keys(errors).length === 0;
  };

  // Load remembered email on component mount
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const rememberedEmail = localStorage.getItem('userEmail');
    
    if (remembered === 'true' && rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Or{' '}
            <Link
              to="/"
              className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500"
            >
              return to dashboard
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

            {/* Organization Field - REPLACED Provider */}
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-slate-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                Remember me
              </label>
            </div>
          </div>

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
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-500"
              >
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;