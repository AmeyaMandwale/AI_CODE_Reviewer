// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import Layout from '../components/Layout';
// import StatsCard from '../components/StatsCard';
// import QuickActions from '../components/QuickActions';
// import RecentActivity from '../components/RecentActivity';
// import { Search, BarChart3, Zap, CreditCard, Github, Gitlab, X } from 'lucide-react';
// import axios from 'axios';
// import { useSearchParams } from "react-router-dom";

// const Home = () => {
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [authType, setAuthType] = useState('signin'); // 'signin' or 'signup'
//   const [repos, setRepos] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token") || localStorage.getItem('authToken');

//   const handleGithubLogin = () => {
//   const orgId = localStorage.getItem("OrgId");
//   if (!orgId) {
//     alert("OrgId missing");
//     return;
//   }
//   window.location.href = `http://localhost:5142/api/GitHub/login?orgId=${orgId}`;
// };


//   // Check authentication and fetch repos if token exists
//   useEffect(() => {
//     const urlToken = searchParams.get("token");
     
//     if (urlToken) {
//       // If token comes from URL (OAuth callback), store it and remove from URL
//       localStorage.setItem('authToken', urlToken);
//       window.history.replaceState({}, document.title, window.location.pathname);
//       setShowAuthModal(false);
//       fetchRepos(urlToken);
//     } else if (token) {
//       // If token exists in localStorage, fetch repos
//       setShowAuthModal(false);
//       fetchRepos(token);
//     } else {
//       // No token found, show auth modal
//       setShowAuthModal(true);
//       setAuthType('signin');
//     }
//   }, [token, searchParams]);

//   const fetchRepos = async (authToken) => {
//     if (!authToken) return;
    
//     try {
//       setLoading(true);
//       const response = await axios.get(`/api/github/repos?token=${authToken}`);
//       console.log("Repos received:", response.data);
//       setRepos(response.data);
//     } catch (error) {
//       console.error("Failed to fetch repositories:", error);
//       // If token is invalid, clear it and show auth modal
//       localStorage.removeItem('authToken');
//       setShowAuthModal(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleSocialAuth = (provider) => {
//   //   if (provider === 'GitHub') {
//   //     // ✅ GitHub OAuth login - redirect to backend OAuth endpoint
//   //     window.location.href = `api/github/login`;
//   //   } else {
//   //     console.log(`Continue with ${provider}`);
//   //     // For other providers, use demo logic for now
//   //     localStorage.setItem('authToken', 'demo-token');
//   //     setShowAuthModal(false);
//   //   }
//   // };

//   const handleSignOut = () => {
//     localStorage.removeItem('authToken');
//     setRepos([]);
//     setShowAuthModal(true);
//     setAuthType('signin');
//   };

//   // Transform GitHub repos for display
//   const transformedRepos = repos.map(repo => ({
//     id: repo.id,
//     name: repo.name,
//     full_name: repo.full_name,
//     visibility: repo.private ? 'Private' : 'Public',
//     language: repo.language || 'Not specified',
//     stars: repo.stargazers_count || 0,
//     description: repo.description || '',
//     html_url: repo.html_url,
//     updated_at: repo.updated_at
//   }));

//   return (
//     <Layout>
//       {/* Authentication Modal */}
//       {showAuthModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
//                 {authType === 'signin' ? 'Sign In' : 'Create Account'}
//               </h2>
//               <button
//                 onClick={() => setShowAuthModal(false)}
//                 className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5 text-slate-500" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <button
//   onClick={handleGithubLogin}
//   className="w-full flex items-center justify-center space-x-3 ..."
// >
//   <Github className="w-5 h-5" />
//   <span className="font-medium">Continue with GitHub</span>
// </button>


//               <button
//                 onClick={() => handleSocialAuth('GitLab')}
//                 className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
//               >
//                 <Gitlab className="w-5 h-5" />
//                 <span className="font-medium">Continue with GitLab</span>
//               </button>

//               <button
//                 onClick={() => handleSocialAuth('Bitbucket')}
//                 className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M.778 1.211c-.424-.006-.772.334-.778.758 0 .2.079.391.219.531l2.812 2.813c.067.067.145.12.231.159l.028-.028 3.725 3.725-3.725 3.725-.028-.028a.932.932 0 0 0-.231.159l-2.812 2.812a.756.756 0 0 0 .531 1.288h8.709c2.07 0 3.75-1.68 3.75-3.75v-2.344a.937.937 0 0 0-.937-.937h-2.344a.937.937 0 0 0-.937.937v2.344c0 .518-.42.938-.937.938H4.811l1.781-1.781 1.781 1.781h2.344a.937.937 0 0 0 .937-.937v-2.344c0-1.55 1.258-2.812 2.812-2.812h2.344a.937.937 0 0 0 .937-.937V9.375a.937.937 0 0 0-.937-.937h-2.344c-1.55 0-2.812-1.262-2.812-2.812V3.282a.937.937 0 0 0-.937-.937H.778z"/>
//                 </svg>
//                 <span className="font-medium">Continue with Bitbucket</span>
//               </button>
//             </div>

//             <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
//               <p className="text-center text-sm text-slate-600 dark:text-slate-400">
//                 {authType === 'signin' ? "Don't have an account? " : "Already have an account? "}
//                 <button
//                   onClick={() => setAuthType(authType === 'signin' ? 'signup' : 'signin')}
//                   className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
//                 >
//                   {authType === 'signin' ? 'Sign up' : 'Sign in'}
//                 </button>
//               </p>
//             </div>
//           </motion.div>
//         </div>
//       )}

//       {/* Original Home Content */}
//       <div className="space-y-6">
//         {/* Welcome Section */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-6 lg:mb-8"
//         >
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
//                 Welcome back, John! 👋
//               </h1>
//               <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
//                 Here's what's happening with your SEO tools today.
//               </p>
//             </div>
//             {token && (
//               <button
//                 onClick={handleSignOut}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
//               >
//                 Sign Out
//               </button>
//             )}
//           </div>
//         </motion.div>

//         {/* Repositories Section - Only show if authenticated */}
//         {token && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
//           >
//             <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
//               Your GitHub Repositories
//             </h2>
            
//             {loading ? (
//               <p className="text-center py-4">Loading repositories...</p>
//             ) : transformedRepos.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {transformedRepos.slice(0, 6).map((repo) => (
//                   <div
//                     key={repo.id}
//                     className="flex flex-col p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
//                   >
//                     <div className="flex items-center space-x-2 mb-3">
//                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                       <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
//                         {repo.name}
//                       </span>
//                       <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full flex-shrink-0">
//                         {repo.visibility}
//                       </span>
//                     </div>
                    
//                     {repo.description && (
//                       <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
//                         {repo.description}
//                       </p>
//                     )}
                    
//                     <div className="flex items-center justify-between mt-auto">
//                       <div className="flex items-center space-x-3">
//                         <span className="text-xs text-slate-500 dark:text-slate-400">{repo.language}</span>
//                         <span className="text-xs text-slate-500 dark:text-slate-400">⭐ {repo.stars}</span>
//                       </div>
//                       <a
//                         href={repo.html_url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors"
//                       >
//                         View
//                       </a>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-center py-4 text-slate-500 dark:text-slate-400">
//                 No repositories found or you need to authenticate.
//               </p>
//             )}
            
//             {transformedRepos.length > 6 && (
//               <div className="mt-4 text-center">
//                 <button className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
//                   View all {transformedRepos.length} repositories
//                 </button>
//               </div>
//             )}
//           </motion.div>
//         )}

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
//           <StatsCard
//             title="API Queries"
//             value="1,247"
//             subtitle="of 2,500 used"
//             icon={Search}
//             color="violet"
//             progress={50}
//             trend={{ positive: true, value: "12%" }}
//           />
//           <StatsCard
//             title="Reports Generated"
//             value="23"
//             subtitle="this month"
//             icon={BarChart3}
//             color="blue"
//             trend={{ positive: true, value: "8%" }}
//           />
//           <StatsCard
//             title="Tools Used"
//             value="8"
//             subtitle="most popular: Keyword Research"
//             icon={Zap}
//             color="green"
//             trend={{ positive: false, value: "3%" }}
//           />
//           <StatsCard
//             title="Current Plan"
//             value="Pro"
//             subtitle="Upgrade to Enterprise"
//             icon={CreditCard}
//             color="orange"
//           />
//         </div>

//         {/* Main Content Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
//           {/* Quick Actions */}
//           <div className="lg:col-span-2">
//             <QuickActions />
//           </div>

//           {/* Recent Activity */}
//           <div className="lg:col-span-1">
//             <RecentActivity />
//           </div>
//         </div>

//         {/* Usage Chart Placeholder */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-6 border border-slate-200 dark:border-slate-700"
//         >
//           <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Usage Overview</h2>
//           <div className="h-48 lg:h-64 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
//             <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base">Chart will be implemented with Recharts</p>
//           </div>
//         </motion.div>
//       </div>
//     </Layout>
//   );
// };

// export default Home;



import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import { Search, BarChart3, Zap, CreditCard, Github, Gitlab, X } from 'lucide-react';
import axios from 'axios';
import { useSearchParams, useNavigate } from "react-router-dom";

const Home = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('signin'); // 'signin' or 'signup'
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gitlabToken = searchParams.get("gitlab_token");

  // Get authentication data from localStorage
  const orgId = localStorage.getItem("OrgId");
  const email = localStorage.getItem("Email");
  const isAuthenticated = localStorage.getItem("isAuthenticated") === 'true';
  const token = searchParams.get("token") || localStorage.getItem('authToken');

  const handleGithubLogin = () => {
    const orgId = localStorage.getItem("OrgId");
    if (!orgId) {
      alert("Please sign in first to connect GitHub");
      setShowAuthModal(false);
      navigate('/signin');
      return;
    } const provider = "github";
      localStorage.setItem("provider", "github");
    window.location.href = `http://localhost:5142/api/sourcecontrol/login?provider=${provider}&orgId=${orgId}`;
  };
  
  const handleGitlabLogin = () => {
  const orgId = localStorage.getItem("OrgId");
  if (!orgId) {
    alert("Please sign in first to connect GitLab");
    setShowAuthModal(false);
    navigate('/signin');
    return;
  }  const provider = "gitlab";
  localStorage.setItem("provider", "gitlab");
  window.location.href = `http://localhost:5142/api/sourcecontrol/login?provider=${provider}&orgId=${orgId}`;
};
  

  useEffect(() => {
  if (gitlabToken) {
    localStorage.setItem("gitlabToken", gitlabToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    fetchGitlabRepos(gitlabToken);
  }
}, [gitlabToken]);

const fetchGitlabRepos = async (token) => {
  try {
    setLoading(true);
    const response = await axios.get(`/api/gitlab/repos?token=${token}`);
    console.log("GitLab repos:", response.data);
  } catch (error) {
    console.error("Failed to fetch GitLab repos:", error);
  } finally {
    setLoading(false);
  }
};

  // Check authentication and fetch repos if token exists
  useEffect(() => {
  const checkAuthentication = async () => {
    // Always show modal if not authenticated
    setShowAuthModal(true);
    if (!isAuthenticated || !orgId || !email) {
      
      return;
    }

    // If authenticated, verify with backend
    try {
      const response = await fetch('/api/user/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId: parseInt(orgId), email })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      // User is valid, proceed with GitHub token check
      const urlToken = searchParams.get("token");
      if (urlToken) {
        localStorage.setItem('authToken', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        setShowAuthModal(false);
        fetchRepos(urlToken);
      } else if (token) {
        setShowAuthModal(false);
        fetchRepos(token);
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      // If verification fails, show auth modal
      setShowAuthModal(true);
    }
  };

  checkAuthentication();
}, [isAuthenticated, orgId, email, searchParams, token]);

  const fetchRepos = async (authToken) => {
  if (!authToken) return;
  
  const provider = localStorage.getItem("provider"); // ✅ Get provider type
  if (!provider) {
    console.error("Provider not found in localStorage");
    return;
  }

  try {
    setLoading(true);
    let response;

    // ✅ Fetch based on selected provider
    if (provider === "github") {
      response = await axios.get(`/api/github/repos?token=${authToken}`);
    } else if (provider === "gitlab") {
      response = await axios.get(`/api/gitlab/repos?token=${authToken}`);
    } else {
      console.error("Unknown provider:", provider);
      return;
    }

    console.log(`${provider} repos:`, response.data);
    setRepos(response.data);
  } catch (error) {
    console.error(`Failed to fetch ${provider} repositories:`, error);
    localStorage.removeItem('authToken');
    setShowAuthModal(true);
  } finally {
    setLoading(false);
  }
};


  const handleSocialAuth = (provider) => {
    if (provider === 'GitHub') {
      handleGithubLogin();
    } else {
      setAuthError(`Please use the sign in page for ${provider} authentication`);
    }
  };

  const handleSignOut = () => {
    // Clear all authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('OrgId');
    localStorage.removeItem('Email');
    localStorage.removeItem('authToken');
    localStorage.removeItem('githubToken');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('userEmail');
    
    setRepos([]);
    setShowAuthModal(true);
    navigate('/signin');
  };

  // Transform GitHub repos for display
  const transformedRepos = repos.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    visibility: repo.private ? 'Private' : 'Public',
    language: repo.language || 'Not specified',
    stars: repo.stargazers_count || 0,
    description: repo.description || '',
    html_url: repo.html_url,
    updated_at: repo.updated_at
  }));

  return (
    <Layout>
      {/* Authentication Modal - Show when not authenticated */}
      {showAuthModal &&  (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {authType === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">Continue with GitHub</span>
              </button>

              <button
  onClick={handleGitlabLogin}
  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
>
  <Gitlab className="w-5 h-5" />
  <span className="font-medium">Continue with GitLab</span>
</button>


              <button
                onClick={() => handleSocialAuth('Bitbucket')}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.778 1.211c-.424-.006-.772.334-.778.758 0 .2.079.391.219.531l2.812 2.813c.067.067.145.12.231.159l.028-.028 3.725 3.725-3.725 3.725-.028-.028a.932.932 0 0 0-.231.159l-2.812 2.812a.756.756 0 0 0 .531 1.288h8.709c2.07 0 3.75-1.68 3.75-3.75v-2.344a.937.937 0 0 0-.937-.937h-2.344a.937.937 0 0 0-.937.937v2.344c0 .518-.42.938-.937.938H4.811l1.781-1.781 1.781 1.781h2.344a.937.937 0 0 0 .937-.937v-2.344c0-1.55 1.258-2.812 2.812-2.812h2.344a.937.937 0 0 0 .937-.937V9.375a.937.937 0 0 0-.937-.937h-2.344c-1.55 0-2.812-1.262-2.812-2.812V3.282a.937.937 0 0 0-.937-.937H.778z"/>
                </svg>
                <span className="font-medium">Continue with Bitbucket</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                {authType === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setAuthType(authType === 'signin' ? 'signup' : 'signin')}
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                >
                  {authType === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Dashboard Content - Only show if authenticated */}
      {isAuthenticated && (
        <div className="space-y-6">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 lg:mb-8"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">
                Here's what's happening with your SEO tools today.
              </p>
            </div>
          </motion.div>

          {/* Repositories Section - Only show if authenticated */}
          {token && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              {/* <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Your GitHub Repositories
              </h2> */}
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
  Your {localStorage.getItem("provider") === "gitlab" ? "GitLab" : "GitHub"} Repositories
</h2>

              
              {loading ? (
                <p className="text-center py-4">Loading repositories...</p>
              ) : transformedRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transformedRepos.slice(0, 6).map((repo) => (
                    <div
                      key={repo.id}
                      className="flex flex-col p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {repo.name}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full flex-shrink-0">
                          {repo.visibility}
                        </span>
                      </div>
                      
                      {repo.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{repo.language}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">⭐ {repo.stars}</span>
                        </div>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                  No repositories found or you need to authenticate.
                </p>
              )}
              
              {transformedRepos.length > 6 && (
                <div className="mt-4 text-center">
                  <button className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
                    View all {transformedRepos.length} repositories
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatsCard
              title="API Queries"
              value="1,247"
              subtitle="of 2,500 used"
              icon={Search}
              color="violet"
              progress={50}
              trend={{ positive: true, value: "12%" }}
            />
            <StatsCard
              title="Reports Generated"
              value="23"
              subtitle="this month"
              icon={BarChart3}
              color="blue"
              trend={{ positive: true, value: "8%" }}
            />
            <StatsCard
              title="Tools Used"
              value="8"
              subtitle="most popular: Keyword Research"
              icon={Zap}
              color="green"
              trend={{ positive: false, value: "3%" }}
            />
            <StatsCard
              title="Current Plan"
              value="Pro"
              subtitle="Upgrade to Enterprise"
              icon={CreditCard}
              color="orange"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <QuickActions />
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>

          {/* Usage Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 lg:p-6 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Usage Overview</h2>
            <div className="h-48 lg:h-64 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base">Chart will be implemented with Recharts</p>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default Home;