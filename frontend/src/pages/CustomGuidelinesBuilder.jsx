// import React, { useState } from 'react';
// import Layout from '../components/Layout';
// import { Plus, Search, Save, Trash2, Edit3, Eye, Code, FileText, Settings, Copy, Download, Grid, List,Upload } from 'lucide-react';

// const CustomGuidelinesBuilder = () => {
//     const [searchTerm, setSearchTerm] = useState('');
//     const [editingGuideline, setEditingGuideline] = useState(null);
//     const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
//     const [showModal, setShowModal] = useState(false);
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [guidelineToDelete, setGuidelineToDelete] = useState(null);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage] = useState(4);

//     // Form state
//     const [formData, setFormData] = useState({
//         name: '',
//         language: '',
//         filepath: '',
//         uploadedFile: null
//     });

//     // Sample guidelines data with additional fields
//     const guidelines = [
//         {
//             id: 1,
//             name: 'React Best Practices',
//             description: 'Guidelines for React component structure and patterns',
//             language: 'JavaScript',
//             filepath: '/guidelines/react-best-practices.jsx',
//             rules: 12,
//             lastUpdated: '2 days ago',
//             status: 'active'
//         },
//         {
//             id: 2,
//             name: 'Python Code Style',
//             description: 'PEP8 compliance and Python coding standards',
//             language: 'Python',
//             filepath: '/guidelines/python-style-guide.py',
//             rules: 8,
//             lastUpdated: '1 week ago',
//             status: 'active'
//         },
//         {
//             id: 3,
//             name: 'API Security Rules',
//             description: 'Security guidelines for REST API development',
//             language: 'C#',
//             filepath: '/guidelines/api-security.cs',
//             rules: 15,
//             lastUpdated: '3 days ago',
//             status: 'draft'
//         },
//         {
//             id: 4,
//             name: 'Database Schema Standards',
//             description: 'Database design and naming conventions',
//             language: 'SQL',
//             filepath: '/guidelines/database-standards.sql',
//             rules: 10,
//             lastUpdated: '1 month ago',
//             status: 'active'
//         },
//         {
//             id: 5,
//             name: 'Frontend Testing Guidelines',
//             description: 'Testing standards for frontend applications',
//             language: 'JavaScript',
//             filepath: '/guidelines/frontend-testing.jsx',
//             rules: 7,
//             lastUpdated: '5 days ago',
//             status: 'active'
//         },
//         {
//             id: 6,
//             name: 'Backend Architecture',
//             description: 'Backend system design and architecture patterns',
//             language: 'C#',
//             filepath: '/guidelines/backend-architecture.cs',
//             rules: 9,
//             lastUpdated: '2 weeks ago',
//             status: 'draft'
//         }
//     ];

//     const filteredGuidelines = guidelines.filter(guideline =>
//         guideline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         guideline.description.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     // Pagination logic
//     const indexOfLastItem = currentPage * itemsPerPage;
//     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//     const currentItems = filteredGuidelines.slice(indexOfFirstItem, indexOfLastItem);
//     const totalPages = Math.ceil(filteredGuidelines.length / itemsPerPage);

//     const handleAddGuideline = () => {
//         setFormData({ name: '', language: '', filepath: '' });
//         setEditingGuideline(null);
//         setShowModal(true);
//     };

//     const handleEditGuideline = (guideline) => {
//         setEditingGuideline(guideline);
//         setFormData({
//             name: guideline.name,
//             language: guideline.language,
//             filepath: guideline.filepath
//         });
//         setShowModal(true);
//     };

//     const handleDeleteGuideline = (guideline) => {
//         setGuidelineToDelete(guideline);
//         setShowDeleteModal(true);
//     };

//     const confirmDelete = () => {
//         console.log('Delete guideline:', guidelineToDelete.id);
//         // Add your delete logic here
//         setShowDeleteModal(false);
//         setGuidelineToDelete(null);
//     };

//     const cancelDelete = () => {
//         setShowDeleteModal(false);
//         setGuidelineToDelete(null);
//     };

//     const handleDownloadPdf = (guideline) => {
//         console.log('Download PDF:', guideline);
//         // Add download logic here
//         // Simulate successful download
//         setTimeout(() => {
//             alert(`PDF for "${guideline.name}" has been downloaded successfully!`);
//         }, 500);
//     };

//     const handleFormSubmit = (e) => {
//         e.preventDefault();
//         console.log('Form submitted:', formData);
//         // Add save logic here
//         setShowModal(false);
//         setFormData({ name: '', language: '', filepath: '' });
//         setEditingGuideline(null);
//     };

//     const handleFormCancel = () => {
//         setShowModal(false);
//         setFormData({ name: '', language: '', filepath: '' });
//         setEditingGuideline(null);
//     };

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const paginate = (pageNumber) => setCurrentPage(pageNumber);

//     return (
//         <Layout>
//             <div className="space-y-8">
//                 {/* Header */}
//                 <div>
//                     <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Custom Guidelines Builder</h1>
//                     <p className="text-slate-600 dark:text-slate-400">
//                         Create and manage custom code review guidelines for your organization
//                     </p>
//                 </div>

//                 {/* Main Content */}
//                 <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
//                     <div className="flex items-center justify-between mb-6">
//                         <div>
//                             <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Guidelines</h2>
//                             <p className="text-slate-600 dark:text-slate-400 mt-1">
//                                 {filteredGuidelines.length} of {guidelines.length} guidelines shown
//                             </p>
//                         </div>

//                         {/* View Toggle and Add Guideline Button */}
//                         <div className="flex items-center space-x-3">
//                             {/* View Toggle */}
//                             <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
//                                 <button
//                                     onClick={() => setViewMode('list')}
//                                     className={`p-2 rounded-md transition-colors ${viewMode === 'list'
//                                         ? 'bg-white dark:bg-slate-600 shadow-sm'
//                                         : 'hover:bg-slate-200 dark:hover:bg-slate-600'
//                                         }`}
//                                 >
//                                     <List className={`w-4 h-4 ${viewMode === 'list'
//                                         ? 'text-violet-600 dark:text-violet-400'
//                                         : 'text-slate-500 dark:text-slate-400'
//                                         }`} />
//                                 </button>
//                                 <button
//                                     onClick={() => setViewMode('cards')}
//                                     className={`p-2 rounded-md transition-colors ${viewMode === 'cards'
//                                         ? 'bg-white dark:bg-slate-600 shadow-sm'
//                                         : 'hover:bg-slate-200 dark:hover:bg-slate-600'
//                                         }`}
//                                 >
//                                     <Grid className={`w-4 h-4 ${viewMode === 'cards'
//                                         ? 'text-violet-600 dark:text-violet-400'
//                                         : 'text-slate-500 dark:text-slate-400'
//                                         }`} />
//                                 </button>
//                             </div>

//                             {/* Add Guideline Button */}
//                             <div className="relative">
//                                 <button
//                                     onClick={handleAddGuideline}
//                                     className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
//                                 >
//                                     <Plus className="w-4 h-4" />
//                                     <span>Create Guideline</span>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Search Bar */}
//                     <div className="mb-6">
//                         <div className="relative max-w-md">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                             <input
//                                 type="text"
//                                 placeholder="Search guidelines..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
//                             />
//                         </div>
//                     </div>

//                     {/* Guidelines View - List or Cards */}
//                     {viewMode === 'list' ? (
//                         // List View
//                         <div className="space-y-4">
//                             {currentItems.map((guideline) => (
//                                 <div
//                                     key={guideline.id}
//                                     className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
//                                 >
//                                     <div className="flex items-center space-x-4">
//                                         <div className={`w-3 h-3 rounded-full ${guideline.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
//                                             }`}></div>
//                                         <div className="flex-1">
//                                             <div className="flex items-center space-x-2 mb-1">
//                                                 <span className="text-sm font-medium text-slate-900 dark:text-white">
//                                                     {guideline.name}
//                                                 </span>
//                                                 <span className={`px-2 py-1 text-xs rounded-full ${guideline.status === 'active'
//                                                     ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
//                                                     : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
//                                                     }`}>
//                                                     {guideline.status}
//                                                 </span>
//                                             </div>
//                                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
//                                                 {guideline.description}
//                                             </p>
//                                             <div className="flex items-center space-x-4">
//                                                 <span className="text-xs text-slate-500 dark:text-slate-400">{guideline.language}</span>
//                                                 <span className="text-xs text-slate-500 dark:text-slate-400">{guideline.rules} rules</span>
//                                                 <span className="text-xs text-slate-500 dark:text-slate-400">File: {guideline.filepath}</span>
//                                                 <span className="text-xs text-slate-500 dark:text-slate-400">Updated {guideline.lastUpdated}</span>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center space-x-2">
//                                         <button
//                                             onClick={() => handleEditGuideline(guideline)}
//                                             className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
//                                             title="Edit"
//                                         >
//                                             <Edit3 className="w-4 h-4" />
//                                         </button>
//                                         <button
//                                             onClick={() => handleDownloadPdf(guideline)}
//                                             className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
//                                             title="Download PDF"
//                                         >
//                                             <Download className="w-4 h-4" />
//                                         </button>
//                                         <button
//                                             onClick={() => handleDeleteGuideline(guideline)}
//                                             className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
//                                             title="Delete"
//                                         >
//                                             <Trash2 className="w-4 h-4" />
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         // Cards View
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {currentItems.map((guideline) => (
//                                 <div
//                                     key={guideline.id}
//                                     className="flex flex-col p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
//                                 >
//                                     <div className="flex items-center space-x-2 mb-3">
//                                         <div className={`w-3 h-3 rounded-full ${guideline.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
//                                             }`}></div>
//                                         <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
//                                             {guideline.name}
//                                         </span>
//                                         <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${guideline.status === 'active'
//                                             ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
//                                             : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
//                                             }`}>
//                                             {guideline.status}
//                                         </span>
//                                     </div>

//                                     <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 flex-1">
//                                         {guideline.description}
//                                     </p>

//                                     <div className="space-y-2 mb-3">
//                                         <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
//                                             <span>{guideline.language}</span>
//                                             <span>{guideline.rules} rules</span>
//                                         </div>
//                                         <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
//                                             File: {guideline.filepath}
//                                         </div>
//                                         <div className="text-xs text-slate-500 dark:text-slate-400">
//                                             Updated {guideline.lastUpdated}
//                                         </div>
//                                     </div>

//                                     <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
//                                         <div className="flex items-center space-x-2">
//                                             <button
//                                                 onClick={() => handleEditGuideline(guideline)}
//                                                 className="p-1 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
//                                                 title="Edit"
//                                             >
//                                                 <Edit3 className="w-4 h-4" />
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDownloadPdf(guideline)}
//                                                 className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
//                                                 title="Download PDF"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDeleteGuideline(guideline)}
//                                                 className="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
//                                                 title="Delete"
//                                             >
//                                                 <Trash2 className="w-4 h-4" />
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}

//                     {/* Pagination */}
//                     {filteredGuidelines.length > 0 && (
//                         <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
//                             <div className="text-sm text-slate-600 dark:text-slate-400">
//                                 Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredGuidelines.length)} of {filteredGuidelines.length} guidelines
//                             </div>
//                             <div className="flex space-x-1">
//                                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
//                                     <button
//                                         key={page}
//                                         onClick={() => paginate(page)}
//                                         className={`px-3 py-1 text-sm rounded-md transition-colors ${currentPage === page
//                                             ? 'bg-violet-600 text-white'
//                                             : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
//                                             }`}
//                                     >
//                                         {page}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {filteredGuidelines.length === 0 && (
//                         <div className="text-center py-8">
//                             <p className="text-slate-500 dark:text-slate-400">No guidelines found matching your search.</p>
//                         </div>
//                     )}
//                 </div>

//                 {/* Modal for Create/Edit Guideline */}
//                 {showModal && (
//                     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//                         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
//                             <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
//                                 {editingGuideline ? 'Edit Guideline' : 'Create New Guideline'}
//                             </h2>

//                             <form onSubmit={handleFormSubmit} className="space-y-4">
//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
//                                         Name of Document <span className="text-red-500">*</span>
//                                     </label>
//                                     <input
//                                         type="text"
//                                         name="name"
//                                         value={formData.name}
//                                         onChange={handleInputChange}
//                                         className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white"
//                                         placeholder="Enter document name"
//                                         required
//                                     />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
//                                         Language <span className="text-red-500">*</span>
//                                     </label>
//                                     <select
//                                         name="language"
//                                         value={formData.language}
//                                         onChange={handleInputChange}
//                                         className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white"
//                                         required
//                                     >
//                                         <option value="">Select Language</option>
//                                         <option value="JavaScript">JavaScript</option>
//                                         <option value="Python">Python</option>
//                                         <option value="Java">Java</option>
//                                         <option value="C#">C#</option>
//                                         <option value="SQL">SQL</option>
//                                         <option value="Multiple">Multiple</option>
//                                     </select>
//                                 </div>

//                                 <div className="relative">
//                                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
//                                         File Path <span className="text-red-500">*</span>
//                                     </label>
//                                     <select
//                                         name="filepath"
//                                         value={formData.filepath}
//                                         onChange={handleInputChange}
//                                         className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white appearance-none"
//                                         required
//                                     >
//                                         <option value="">Select File Type</option>
//                                         <option value=".jsx">.jsx</option>
//                                         <option value=".js">.js</option>
//                                         <option value=".tsx">.tsx</option>
//                                         <option value=".ts">.ts</option>
//                                         <option value=".py">.py</option>
//                                         <option value=".cs">.cs</option>
//                                         <option value=".java">.java</option>
//                                         <option value=".sql">.sql</option>
//                                         <option value=".json">.json</option>
//                                         <option value=".xml">.xml</option>
//                                     </select>
//                                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-6 text-slate-700 dark:text-slate-300">
//                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                                         </svg>
//                                     </div>
//                                 </div>

//                                 <div className="flex items-center justify-end space-x-3 pt-4">
//                                     <button
//                                         type="button"
//                                         onClick={handleFormCancel}
//                                         className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         type="submit"
//                                         className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
//                                     >
//                                         {editingGuideline ? 'Update' : 'Save'}
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     </div>
//                 )}

//                 {/* Delete Confirmation Modal */}
//                 {showDeleteModal && (
//                     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//                         <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
//                             <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
//                                 Confirm Delete
//                             </h2>

//                             <p className="text-slate-600 dark:text-slate-400 mb-6">
//                                 Are you sure you want to delete the guideline "<span className="font-semibold">{guidelineToDelete?.name}</span>"? This action cannot be undone.
//                             </p>

//                             <div className="flex items-center justify-end space-x-3">
//                                 <button
//                                     onClick={cancelDelete}
//                                     className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     onClick={confirmDelete}
//                                     className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
//                                 >
//                                     Delete
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </Layout>
//     );
// };

// export default CustomGuidelinesBuilder;

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Plus,
  Search,
  Save,
  Trash2,
  Edit3,
  Eye,
  Code,
  FileText,
  Settings,
  Copy,
  Download,
  Grid,
  List,
  Upload,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

const CustomRulesBuilder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRule, setEditingRule] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [repos, setRepos] = useState([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Add this filteredRules definition
  const filteredRules = rules.filter(
    (rule) =>
      rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.filepath?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    filepath: "",
    uploadedFile: null,
    repoIds: [],
    repoNames: [],
  });

  useEffect(() => {
    fetchRules();
    fetchRepos();
  }, []);

  // Fetch rules from API
  const fetchRules = async () => {
    try {
      setLoading(true);
      const orgId = localStorage.getItem("OrgId");

      if (!orgId) {
        console.error("No OrgId found in localStorage");
        setRules([]);
        return;
      }

      const response = await fetch(`/api/RulePack/org/${orgId}`);

      if (response.ok) {
        const data = await response.json();

        // 🔥 Normalize repoIds & repoNames
        const normalized = data.map((rule) => ({
          ...rule,
          repoIds: (() => {
            if (Array.isArray(rule.repoIds)) return rule.repoIds;
            if (
              typeof rule.repoIds === "string" &&
              rule.repoIds.trim() !== ""
            ) {
              try {
                return JSON.parse(rule.repoIds);
              } catch (e) {
                console.warn("Invalid repoIds format:", rule.repoIds);
              }
            }
            return [];
          })(),
          repoNames: (() => {
            if (Array.isArray(rule.repoNames)) return rule.repoNames;
            if (
              typeof rule.repoNames === "string" &&
              rule.repoNames.trim() !== ""
            ) {
              try {
                return JSON.parse(rule.repoNames);
              } catch (e) {
                console.warn("Invalid repoNames format:", rule.repoNames);
              }
            }
            return [];
          })(),
        }));

        console.log("🔥 Normalized Rules Data:", normalized);
        setRules(normalized);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const orgId = localStorage.getItem("OrgId");
      if (!orgId) {
        console.warn("OrgId not found in localStorage");
        return;
      }

      // 🔥 Correct API endpoint now:
      const response = await fetch(`/api/Repository?orgId=${orgId}`);

      if (!response.ok) throw new Error("Failed to load repositories.");

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.warn("⚠ No repos found for this organization.");
        setRepos([]);
        return;
      }

      // 🔥 Correct mapping
      const mappedRepos = data.map((repo) => ({
        id: repo.id,
        name: repo.name,
      }));

      console.log("Loaded Repositories:", mappedRepos);
      setRepos(mappedRepos);
    } catch (error) {
      console.error("❌ Fetch repos error:", error);
      setRepos([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if click happens outside element having .repo-dropdown class
      if (!event.target.closest(".repo-dropdown")) {
        setShowRepoDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Save rules to API
  // Save rules to API
  const saveRule = async (ruleData) => {
    try {
      const orgId = localStorage.getItem("OrgId") || 1;

      // 🚀 Prepare payload correctly (arrays not stringified)
      const rulePayload = {
        name: ruleData.name,
        type: ruleData.type || "custom",
        orgId: parseInt(orgId),
        enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
        rules: JSON.stringify(ruleData.rules || {}), // keep as JSON string because backend expects string

        repoIds: ruleData.repoIds || [], // Must be array
        repoNames: ruleData.repoNames || [],
      };

      console.log("🚀 Sending RulePack payload:", rulePayload);

      let response;

      // 🔄 Update rule (PUT)
      if (ruleData.id && !isNaN(parseInt(ruleData.id))) {
        response = await fetch(`/api/RulePack/${parseInt(ruleData.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...rulePayload, id: parseInt(ruleData.id) }),
        });
      }
      // ➕ Create rule (POST)
      else {
        response = await fetch("/api/RulePack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rulePayload),
        });
      }

      // ❗If server returns error
      if (!response.ok) {
        const backendError = await response.text();
        console.error("❌ Backend Error:", backendError);
        throw new Error(
          `Failed to ${ruleData.id ? "update" : "create"} rule (${
            response.status
          })`
        );
      }

      // 🎉 Success
      const result = await response.json();
      console.log("✔ Rule saved successfully:", result);
      return result;
    } catch (error) {
      console.error("🚨 Error saving rule:", error);
      throw error;
    }
  };

  // Delete rule
  const deleteRule = async (ruleId) => {
    try {
      const response = await fetch(`/api/RulePack/${ruleId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete rule");
      return await response.json();
    } catch (error) {
      console.error("Error deleting rule:", error);
      throw error;
    }
  };

  // Toggle rule enabled status
  const toggleRule = async (ruleId, currentStatus) => {
    try {
      const response = await fetch(`/api/RulePack/${ruleId}/toggle`, {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to toggle rule");
      const result = await response.json();
      return result.enabled;
    } catch (error) {
      console.error("Error toggling rule:", error);
      throw error;
    }
  };

  // Upload file for rule
  const uploadFile = async (file, ruleId) => {
    try {
      setUploading(true);

      // Read the file content
      const fileContent = await readFileAsText(file);

      // Create rule data from file content
      const ruleData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        content: fileContent,
        uploadedAt: new Date().toISOString(),
      };

      return {
        rule: ruleData,
        message: "File uploaded successfully",
      };
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);

  const handleAddRule = () => {
    setFormData({
      name: "",
      language: "",
      filepath: "",
      uploadedFile: null,
      repoIds: [],
      repoNames: [],
    });
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type || "",
      filepath: rule.filepath || "",
      uploadedFile: null,
      repoIds: rule.repoIds || [],
      repoNames: rule.repoNames || [],
    });
    setShowModal(true);
  };

  const handleDeleteRule = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteRule(ruleToDelete.id);
      setRules((prev) => prev.filter((rule) => rule.id !== ruleToDelete.id));
      setShowDeleteModal(false);
      setRuleToDelete(null);
    } catch (error) {
      alert("Failed to delete rule: " + error.message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRuleToDelete(null);
  };

  const handleToggleRule = async (rule) => {
    try {
      const newStatus = await toggleRule(rule.id, rule.enabled);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: newStatus } : r))
      );
    } catch (error) {
      alert("Failed to toggle rule: " + error.message);
    }
  };

  const handleDownloadFile = async (rule) => {
    try {
      console.log("Download rule:", rule);

      // Check if rule has file content stored in the rules field
      let fileContent = "";
      let fileName = "";

      // Check if rules field contains the file data
      if (rule.rules) {
        // If rules is a string (JSON stringified), parse it
        if (typeof rule.rules === "string") {
          try {
            const parsedRules = JSON.parse(rule.rules);
            fileContent = parsedRules.content || "";
            fileName = parsedRules.fileName || `${rule.name}_file.txt`;
          } catch (parseError) {
            console.error("Error parsing rules JSON:", parseError);
            fileContent = rule.rules; // Use as plain text
            fileName = `${rule.name}_file.txt`;
          }
        }
        // If rules is an object
        else if (typeof rule.rules === "object" && rule.rules !== null) {
          fileContent = rule.rules.content || "";
          fileName = rule.rules.fileName || `${rule.name}_file.txt`;
        }
      }

      // If no content found in rules, check other possible locations
      if (!fileContent) {
        // Check if content is directly on the rule object
        if (rule.content) {
          fileContent = rule.content;
          fileName = rule.fileName || `${rule.name}_file.txt`;
        } else {
          // Create a basic rule configuration file as fallback
          fileContent = JSON.stringify(
            {
              ruleName: rule.name,
              ruleType: rule.type,
              language: rule.language,
              fileType: rule.filepath,
              enabled: rule.enabled,
              lastUpdated: rule.lastUpdated,
              description: "Custom code review rule",
            },
            null,
            2
          );
          fileName = `${rule.name}_config.json`;
        }
      }

      // Ensure fileName has proper extension
      if (!fileName.includes(".")) {
        const extension = rule.filepath || ".txt";
        fileName = `${fileName}${extension}`;
      }

      console.log(
        "Downloading file:",
        fileName,
        "Content length:",
        fileContent.length
      );

      // Create a blob from the file content
      const blob = new Blob([fileContent], {
        type: getMimeType(fileName),
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file: " + error.message);
    }
  };

  // Helper function to determine MIME type
  const getMimeType = (fileName) => {
    if (!fileName) return "text/plain";

    const extension = fileName.split(".").pop().toLowerCase();
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      json: "application/json",
      js: "application/javascript",
      jsx: "application/javascript",
      ts: "application/typescript",
      tsx: "application/typescript",
      py: "text/x-python",
      java: "text/x-java",
      cs: "text/x-csharp",
      xml: "application/xml",
      sql: "application/sql",
      html: "text/html",
      css: "text/css",
    };

    return mimeTypes[extension] || "text/plain";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert("Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      uploadedFile: file,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      let ruleContent = {};

      // 1️⃣ Use new uploaded file if provided
      if (formData.uploadedFile) {
        const uploaded = await uploadFile(
          formData.uploadedFile,
          editingRule?.id
        );
        ruleContent = {
          fileName: uploaded.rule.fileName,
          content: uploaded.rule.content,
          uploadedAt: uploaded.rule.uploadedAt,
        };
      }
      // 2️⃣ Otherwise, use previous file content
      else if (editingRule?.rules) {
        ruleContent =
          typeof editingRule.rules === "string"
            ? JSON.parse(editingRule.rules)
            : editingRule.rules;
      }

      // 🎯 FINAL DATA TO SEND TO BACKEND
      const ruleData = {
        ...(editingRule?.id &&
          !isNaN(parseInt(editingRule.id)) && { id: parseInt(editingRule.id) }),

        name: formData.name,
        type: formData.type || "custom",
        language: formData.language,
        filepath: formData.filepath,

        // 🔥 NOW sending both
        repoIds: formData.repoIds, // [numeric]
        repoNames: formData.repoNames, // ["owner/repo"]

        rules: ruleContent,
        lastUpdated: new Date().toISOString(),
      };

      const savedRule = await saveRule(ruleData);

      if (editingRule) {
        setRules((prev) =>
          prev.map((rule) => (rule.id === savedRule.id ? savedRule : rule))
        );
      } else {
        setRules((prev) => [...prev, savedRule]);
      }

      // 🧹 RESET FORM
      setShowModal(false);
      setFormData({
        name: "",
        language: "",
        filepath: "",
        uploadedFile: null,
        repoIds: [],
        repoNames: [], // 🔥 reset correctly
      });
      setEditingRule(null);
    } catch (error) {
      alert("Failed to save rule: " + error.message);
    }
  };

  const handleFormCancel = () => {
    setShowModal(false);
    setFormData({
      name: "",
      language: "",
      filepath: "",
      uploadedFile: null,
      repoIds: [],
      repoNames: [], // 🔥 Must reset both
    });
    setEditingRule(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getRuleTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "security":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "performance":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "best-practice":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Custom Rules Builder
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage custom code review rules for your organization
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Your Rules
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {filteredRules.length} of {rules.length} rules shown
              </p>
            </div>

            {/* View Toggle and Add Rule Button */}
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
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
              </div>

              {/* Add Rule Button */}
              <div className="relative">
                <button
                  onClick={handleAddRule}
                  className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Rule</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">
                Loading rules...
              </p>
            </div>
          ) : (
            <>
              {/* Rules View - List or Cards */}
              {viewMode === "list" ? (
                // List View
                <div className="space-y-4">
                  {currentItems.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            rule.enabled ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {rule.name}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getRuleTypeColor(
                                rule.type
                              )}`}
                            >
                              {rule.type}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                rule.enabled
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {rule.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <span>Language: {rule.language || "Any"}</span>
                            <span>File: {rule.filepath || "N/A"}</span>
                            <span>
                              Updated:{" "}
                              {new Date(rule.lastUpdated).toLocaleDateString()}
                            </span>
                            {rule.fileName && (
                              <span className="text-blue-500 dark:text-blue-400">
                                {rule.fileName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`p-2 rounded transition-colors ${
                            rule.enabled
                              ? "text-yellow-600 hover:text-yellow-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                          title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(rule)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Cards View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex flex-col p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            rule.enabled ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {rule.name}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getRuleTypeColor(
                              rule.type
                            )}`}
                          >
                            {rule.type}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              rule.enabled
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Language: {rule.language || "Any"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          File: {rule.filepath || "N/A"}
                        </div>
                        {rule.fileName && (
                          <div className="text-xs text-blue-500 dark:text-blue-400 truncate">
                            File: {rule.fileName}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Updated:{" "}
                          {new Date(rule.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`text-xs px-3 py-1 rounded ${
                            rule.enabled
                              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }`}
                        >
                          {rule.enabled ? "Disable" : "Enable"}
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(rule)}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule)}
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredRules.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {indexOfFirstItem + 1}-
                    {Math.min(indexOfLastItem, filteredRules.length)} of{" "}
                    {filteredRules.length} rules
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === page
                              ? "bg-violet-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {filteredRules.length === 0 && rules.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">
                    No rules created yet. Create your first rule to get started.
                  </p>
                </div>
              )}

              {filteredRules.length === 0 && rules.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">
                    No rules found matching your search.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal for Create/Edit Rule */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {editingRule ? "Edit Rule" : "Create New Rule"}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white"
                    placeholder="Enter rule name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Select Rule Type</option>
                    <option value="custom">Custom</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="best-practice">Best Practice</option>
                    <option value="code-style">Code Style</option>
                  </select>
                </div>

                {/* Repository multi-select dropdown */}
                <div className="relative repo-dropdown">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Apply To Repositories{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Dropdown toggle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // don’t trigger document click
                      setShowRepoDropdown((prev) => !prev);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex flex-wrap gap-1">
                      {formData.repoNames.length > 0 ? (
                        formData.repoNames.map((repoName) => (
                          <span
                            key={repoName}
                            className="text-xs bg-violet-600 text-white px-2 py-1 rounded-md"
                          >
                            {repoName}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm">
                          Select repositories
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 text-xs ml-2">▼</span>
                  </div>

                  {/* Dropdown list */}
                  {showRepoDropdown && (
                    <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg w-full max-h-56 overflow-y-auto">
                      {repos.length === 0 && (
                        <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                          No repositories found
                        </div>
                      )}

                      {repos.map((repo) => {
                        const isSelected = formData.repoIds.includes(repo.id);

                        return (
                          <div
                            key={repo.id}
                            onClick={() => {
                              setFormData((prev) => {
                                const currentlySelected = prev.repoIds.includes(
                                  repo.id
                                );

                                if (currentlySelected) {
                                  return {
                                    ...prev,
                                    repoIds: prev.repoIds.filter(
                                      (id) => id !== repo.id
                                    ),
                                    repoNames: prev.repoNames.filter(
                                      (name) => name !== repo.name
                                    ),
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    repoIds: [...prev.repoIds, repo.id],
                                    repoNames: [...prev.repoNames, repo.name],
                                  };
                                }
                              });
                            }}
                            className={`px-4 py-2 cursor-pointer flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              isSelected
                                ? "bg-violet-100 dark:bg-violet-800"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected}
                              className="rounded"
                            />
                            <span className="text-sm text-slate-800 dark:text-slate-100">
                              {repo.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Click to open, then choose one or more repositories.
                    Selected items will be shown above.
                  </p> */}
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload Rule File{" "}
                    {!editingRule && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          PDF, DOC, DOCX, TXT files (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  {formData.uploadedFile && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-300 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        File selected: {formData.uploadedFile.name}
                      </p>
                    </div>
                  )}
                  {editingRule &&
                    editingRule.fileName &&
                    !formData.uploadedFile && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          Current file: {editingRule.fileName}
                        </p>
                      </div>
                    )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleFormCancel}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading
                      ? "Uploading..."
                      : editingRule
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Confirm Delete
              </h2>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete the rule "
                <span className="font-semibold">{ruleToDelete?.name}</span>"?
                This action cannot be undone.
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomRulesBuilder;
