// import React, { useState } from 'react';
// import Layout from '../components/Layout';
// import { Plus, Search, Github, Gitlab, CheckCircle, ArrowRight } from 'lucide-react';

// const RepositoriesDashboard = () => {
//   const [showAddRepo, setShowAddRepo] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Sample repository data
//   const repositories = [
//     {
//       name: 'final.js',
//       visibility: 'Public',
//       type: 'Repository',
//       lastUpdated: '2 days ago',
//       language: 'JavaScript',
//       stars: 12
//     },
//     {
//       name: 'Ameya_JS',
//       visibility: 'Public',
//       type: 'Repository',
//       lastUpdated: '1 week ago',
//       language: 'JavaScript',
//       stars: 8
//     },
//     {
//       name: 'Ameya_ApexalQ',
//       visibility: 'Public',
//       type: 'Repository',
//       lastUpdated: '3 days ago',
//       language: 'Python',
//       stars: 15
//     },
//     {
//       name: 'Assignments',
//       visibility: 'Public',
//       type: 'Repository',
//       lastUpdated: '1 month ago',
//       language: 'Java',
//       stars: 5
//     },
//     {
//       name: 'TracknBill_SeleniumTests',
//       visibility: 'Public',
//       type: 'Repository',
//       lastUpdated: '2 weeks ago',
//       language: 'Python',
//       stars: 3
//     }
//   ];

//   const filteredRepositories = repositories.filter(repo =>
//     repo.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleAddRepository = (provider) => {
//     console.log(`Continue with ${provider}`);
//     setShowAddRepo(false);
//     // Add your repository integration logic here
//   };

//   return (
//     <Layout>
//       <div className="space-y-8">
//         {/* Header */}
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Repositories</h1>
//           <p className="text-slate-600 dark:text-slate-400">
//             List of repositories accessible to CodeRabbit.
//           </p>
//         </div>

//         {/* Repositories Section */}
//         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Repositories</h2>
//               <p className="text-slate-600 dark:text-slate-400 mt-1">
//                 {filteredRepositories.length} of {repositories.length} repositories shown
//               </p>
//             </div>

//             {/* Add Repository Button */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowAddRepo(!showAddRepo)}
//                 className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
//               >
//                 <Plus className="w-4 h-4" />
//                 <span>Add repository</span>
//               </button>

//               {/* Add Repository Dropdown */}
//               {showAddRepo && (
//                 <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50">
//                   <div className="p-4 border-b border-slate-200 dark:border-slate-700">
//                     <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add Repository</h3>
//                   </div>
//                   <div className="p-2">
//                     <button
//                       onClick={() => handleAddRepository('GitHub')}
//                       className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                     >
//                       <Github className="w-5 h-5" />
//                       <span>Continue with GitHub</span>
//                     </button>
//                     <button
//                       onClick={() => handleAddRepository('GitLab')}
//                       className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                     >
//                       <Gitlab className="w-5 h-5" />
//                       <span>Continue with GitLab</span>
//                     </button>
//                     <button
//                       onClick={() => handleAddRepository('Microsoft')}
//                       className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
//                     >
//                       <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="currentColor">
//                         <path d="M0 0h11v11H0V0zm12 0h11v11H12V0zM0 12h11v11H0V12zm12 0h11v11H12V12z"/>
//                       </svg>
//                       <span>Continue with Microsoft</span>
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Search Bar */}
//           <div className="mb-6">
//             <div className="relative max-w-md">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Repo not found? Search here..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
//               />
//             </div>
//           </div>

//           {/* Repositories List */}
//           <div className="space-y-3">
//             {filteredRepositories.map((repo, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
//               >
//                 <div className="flex items-center space-x-4">
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                   <div>
//                     <div className="flex items-center space-x-2">
//                       <span className="text-sm font-medium text-slate-900 dark:text-white">
//                         {repo.name}
//                       </span>
//                       <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
//                         {repo.visibility}
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-4 mt-1">
//                       <span className="text-xs text-slate-500 dark:text-slate-400">{repo.language}</span>
//                       <span className="text-xs text-slate-500 dark:text-slate-400">⭐ {repo.stars}</span>
//                       <span className="text-xs text-slate-500 dark:text-slate-400">Updated {repo.lastUpdated}</span>
//                     </div>
//                   </div>
//                 </div>
//                 <span className="text-xs text-slate-500 dark:text-slate-400 px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded-full">
//                   {repo.type}
//                 </span>
//               </div>
//             ))}

//             {filteredRepositories.length === 0 && (
//               <div className="text-center py-8">
//                 <p className="text-slate-500 dark:text-slate-400">No repositories found matching your search.</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Repository Statistics */}
//         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
//           <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Repository Statistics</h2>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
//               <p className="text-sm text-slate-600 dark:text-slate-400">Total Repositories</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{repositories.length}</p>
//             </div>
//             <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
//               <p className="text-sm text-slate-600 dark:text-slate-400">Public Repos</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{repositories.length}</p>
//             </div>
//             <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
//               <p className="text-sm text-slate-600 dark:text-slate-400">Languages</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">3</p>
//             </div>
//             <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
//               <p className="text-sm text-slate-600 dark:text-slate-400">Total Stars</p>
//               <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">43</p>
//             </div>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
//           <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
//               <div className="flex items-center space-x-3">
//                 <Github className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//                 <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Import from GitHub</span>
//               </div>
//               <ArrowRight className="w-4 h-4 text-slate-400" />
//             </button>

//             <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
//               <div className="flex items-center space-x-3">
//                 <Gitlab className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//                 <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Import from GitLab</span>
//               </div>
//               <ArrowRight className="w-4 h-4 text-slate-400" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default RepositoriesDashboard;

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  RefreshCw,
  Plus,
  Search,
  Github,
  Gitlab,
  CheckCircle,
  ArrowRight,
  Grid,
  List,
} from "lucide-react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const RepositoriesDashboard = () => {
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'list'
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [githubRepos, setGithubRepos] = useState([]);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const navigate = useNavigate();

  const handleRepoClick = (repo) => {
    // 1️⃣ Call the sync endpoint
    fetch(`/api/contributors/sync/${repo.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Navigate to repository detail page
    navigate(`/code-overview/repositories/${repo.id}`); // use repo.Id from DB
  };
  // Fetch repositories on component mount
  // Fetch repositories on component mount
  const loadRepos = async () => {
    // 1️⃣ Get orgId from localStorage (this must already be set somewhere after login)
    const orgId = localStorage.getItem("OrgId");

    // 2️⃣ Try to get provider from URL (?provider=github)
    const searchParams = new URLSearchParams(window.location.search);
    const providerFromQuery = searchParams.get("provider");

    // 3️⃣ If not in URL, fallback to localStorage (we'll store it there after login)
    const providerFromStorage = localStorage.getItem("provider");

    // 4️⃣ Final provider: query string wins, otherwise use localStorage
    const provider = providerFromQuery || providerFromStorage;

    if (!orgId || !provider) {
      console.warn("Missing orgId or provider", { orgId, provider });
      setRepos([]);
      return;
    }

    try {
      setLoading(true);

      // 5️⃣ Sync based on provider
      if (provider === "github") {
        await fetch(`/api/repository/sync?orgId=${orgId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else if (provider === "gitlab") {
        await fetch(`/api/sourcecontrol/gitlab/repos?orgId=${orgId}`);
      }

      // 6️⃣ Then read from DB so UI always gets latest stored repos
      const listResponse = await fetch(
        `/api/repository?orgId=${orgId}&provider=${provider}`
      );
      const data = await listResponse.json();

      console.log("DB repos after sync →", data);

      if (Array.isArray(data)) {
        setRepos(data);
      } else {
        console.warn("Unexpected repos format:", data);
        setRepos([]);
      }
    } catch (err) {
      console.error("Load repos failed →", err);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  // useEffect(() => {
  //   async function loadRepos() {
  //     const orgId = localStorage.getItem("OrgId");
  //     const provider = new URLSearchParams(window.location.search).get(
  //       "provider"
  //     );

  //     if (!orgId || !provider) {
  //       console.warn("Missing orgId or provider");
  //       setRepos([]);
  //       return;
  //     }

  //     try {
  //       setLoading(true);

  //       let response;
  //       let data;

  //       if (provider === "github") {
  //         // 1️⃣ Sync GitHub → DB and get DB repos back
  //         response = await fetch(`/api/repository/sync?orgId=${orgId}`, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //         });
  //         data = await response.json();
  //       } else if (provider === "gitlab") {
  //         // 2️⃣ For now, still use gitlab repos endpoint (it already saves to DB)
  //         response = await fetch(
  //           `/api/sourcecontrol/gitlab/repos?orgId=${orgId}`
  //         );
  //         data = await response.json();
  //       } else {
  //         console.warn("Unsupported provider:", provider);
  //         setRepos([]);
  //         return;
  //       }

  //       console.log("Fetched repos →", data);

  //       if (Array.isArray(data)) {
  //         setRepos(data);
  //       } else {
  //         console.warn("Unexpected repos format:", data);
  //         setRepos([]);
  //       }
  //     } catch (err) {
  //       console.error("Load repos failed →", err);
  //       setRepos([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   loadRepos();
  // }, []);

  const connectRepo = async (repoObj) => {
    try {
      console.log("connectRepo INPUT =>", repoObj);

      const orgId = localStorage.getItem("OrgId");

      let repoFullName = null;

      // ✅ ONLY USE name, since we know it contains owner/repo
      if (repoObj?.name) {
        repoFullName = repoObj.name;
      } else if (typeof repoObj === "string") {
        repoFullName = repoObj;
      }

      console.log("repoFullName =>", repoFullName);

      if (!repoFullName) {
        alert("Repository name missing");
        return;
      }

      const [owner, repo] = repoFullName.split("/");

      if (!owner || !repo) {
        alert("Invalid repository format. Expected: owner/repo");
        return;
      }

      const payload = {
        owner,
        repo,
        externalId, //optional, ignoring for now
      };

      console.log("sending payload =>", payload);

      const res = await fetch(`/api/repository/connect?orgId=${orgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      console.log("connect repo response:", data);

      if (!res.ok) {
        alert(data?.message ?? "Failed to connect repo");
        return;
      }

      alert("✅ Repo connected!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRepository = (provider) => {
    console.log(`Continue with ${provider}`);
    setShowAddRepo(false);
    // Add your repository integration logic here
  };

  // Transform GitHub repos to match your existing structure
  // const transformedRepos = Array.isArray(repos)
  //   ? repos.map((repo) => {
  //       // repo from GitHub API OR DB row
  //       const fullName = repo.full_name || repo.name || "";
  //       const [ownerFromName, repoNameFromName] = fullName.split("/");

  //       return {
  //         // For GitHub API: id = GitHub id
  //         // For DB: id = DB id (from Repository.Id)
  //         id: repo.id,

  //         // Friendly name for UI
  //         name: repoNameFromName || repo.name || "",

  //         full_name: fullName,

  //         visibility: repo.private ? "Private" : "Public",

  //         type: "Repository",
  //         lastUpdated: repo.lastSyncedAt || "Recently",

  //         language: repo.language || "Not specified",
  //         stars: repo.stargazers_count || 0,

  //         // owner: from GitHub response or derived from full_name
  //         owner: repo.owner?.login || ownerFromName || "",
  //       };
  //     })
  //   : [];

  // const filteredRepositories = transformedRepos.filter((repo) =>
  //   repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const transformedRepos = Array.isArray(repos)
    ? repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        visibility: repo.private ? "Private" : "Public",
        type: "Repository",
        lastUpdated: "Recently",
        language: repo.language || "Not specified",
        stars: repo.stargazers_count || 0,
        owner: repo.owner?.login || "",
      }))
    : [];

  const filteredRepositories = transformedRepos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Repositories
          </h1>
          <p className="text-slate-600 dark:text-slate-400"></p>
        </div>

        {/* Repositories Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Your Repositories
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {filteredRepositories.length} of {transformedRepos.length}{" "}
                repositories shown
              </p>
            </div>

            {/* View Toggle and Add Repository Button */}
            <div className="flex items-center space-x-3">
              {/* View Toggle Button */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "cards"
                      ? "bg-white dark:bg-slate-600 shadow-sm"
                      : "hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <Grid
                    className={`w-4 h-4 ${
                      viewMode === "cards"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-600 shadow-sm"
                      : "hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <List
                    className={`w-4 h-4 ${
                      viewMode === "list"
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadRepos}
                className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Repo not found? Search here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {loading && (
            <p className="text-center py-4">Loading repositories...</p>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Repositories View - Cards or List */}
          {!loading &&
            !error &&
            (viewMode === "cards" ? (
              // Cards View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepositories.map((repo, index) => (
                  <div
                    key={index}
                    onClick={() => handleRepoClick(repo)}
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

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {repo.language}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ⭐ {repo.stars}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded-full">
                        {repo.type}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Updated {repo.lastUpdated}
                      </span>
                      {/* <button
                        onClick={() => connectRepo(repo)}
                        className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Connect
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-3">
                {filteredRepositories.map((repo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {repo.name}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            {repo.visibility}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {repo.language}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ⭐ {repo.stars}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Updated {repo.lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded-full">
                        {repo.type}
                      </span>
                      {/* <button
                        onClick={() => connectRepo(repo)}
                        className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Connect
                      </button> */}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {!loading && !error && filteredRepositories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                No repositories found matching your search.
              </p>
            </div>
          )}
        </div>

        {/* Repository Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Repository Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Repositories
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {transformedRepos.length}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Public Repos
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {
                  transformedRepos.filter(
                    (repo) => repo.visibility === "Public"
                  ).length
                }
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Languages
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {new Set(transformedRepos.map((repo) => repo.language)).size}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Stars
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {transformedRepos.reduce((sum, repo) => sum + repo.stars, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Github className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Import from GitHub</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Gitlab className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Import from GitLab</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div> */}
      </div>
    </Layout>
  );
};

export default RepositoriesDashboard;
