import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Search, Edit3, Trash2, Eye, Upload, Download, X } from 'lucide-react';

const Superadmin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // Add this state
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    settings: ''
  });

  //const API_BASE_URL = 'http://localhost:5142/api';

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organization`);
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError('Failed to load organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrganizations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);

  const handleAddOrganization = () => {
    setFormData({ name: '', settings: '' });
    setSelectedOrganization(null);
    setShowAddModal(true);
  };

  const handleEditOrganization = (org) => {
    setSelectedOrganization(org);
    setFormData({ 
      name: org.name, 
      settings: org.settings || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteOrganization = (org) => {
    setSelectedOrganization(org);
    setShowDeleteModal(true);
  };

  const handleViewOrganization = (org) => {
    setSelectedOrganization(org);
    setShowViewModal(true); // Open view modal
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrganization(null);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/organization/${selectedOrganization.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete organization');

      // Remove from local state
      setOrganizations(prev => prev.filter(org => org.id !== selectedOrganization.id));
      setShowDeleteModal(false);
      setSelectedOrganization(null);
    } catch (err) {
      setError('Failed to delete organization');
      console.error('Error deleting organization:', err);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedOrganization(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const organizationData = {
        name: formData.name,
        settings: formData.settings
      };

      console.log('Submitting data:', organizationData);

      let response;
      const url = selectedOrganization 
        ? `/api/organization/${selectedOrganization.id}`
        : `/api/organization`;

      const method = selectedOrganization ? 'PUT' : 'POST';

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData)
      });

      console.log('Response status:', response.status);
      console.log('Response URL:', url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to save organization: ${response.status} ${response.statusText}`);
      }

      // Refresh organizations list
      await fetchOrganizations();
      
      setShowAddModal(false);
      setFormData({ name: '', settings: '' });
      setSelectedOrganization(null);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.message);
      console.error('Error saving organization:', err);
    }
  };

  const handleFormCancel = () => {
    setShowAddModal(false);
    setFormData({ name: '', settings: '' });
    setSelectedOrganization(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target.result;
          // If it's a JSON file, parse it and set as settings
          if (file.type === 'application/json') {
            const jsonData = JSON.parse(fileContent);
            setFormData(prev => ({
              ...prev,
              settings: JSON.stringify(jsonData, null, 2)
            }));
          } else {
            // For text files, use as-is
            setFormData(prev => ({
              ...prev,
              settings: fileContent
            }));
          }
        } catch (err) {
          setError('Failed to parse file');
          console.error('Error parsing file:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileDownload = (org) => {
    try {
      const settings = org.settings ? JSON.parse(org.settings) : {};
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${org.name.toLowerCase().replace(/\s+/g, '-')}-settings.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download settings');
      console.error('Error downloading settings:', err);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const parseSettings = (settingsJson) => {
    try {
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch {
      return {};
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading organizations...</div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Organizations Management</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage all organizations and their settings
        </p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Organizations</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {filteredOrganizations.length} of {organizations.length} organizations shown
            </p>
          </div>
          
          {/* Add Organization Button */}
          <button 
            onClick={handleAddOrganization}
            className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Organizations Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Organization Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Settings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {currentItems.map((org) => {
                const settings = parseSettings(org.settings);
                return (
                  <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {org.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center space-x-2">
                          <span>{settings.permissions ? settings.permissions.length : 0} permissions</span>
                          <button
                            onClick={() => handleFileDownload(org)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Download Settings"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(org.createdAt || new Date())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewOrganization(org)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(org)}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrganizations.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrganizations.length)} of {filteredOrganizations.length} organizations
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredOrganizations.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">No organizations found matching your search.</p>
          </div>
        )}
      </div>

      {/* View Organization Modal */}
      {showViewModal && selectedOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Organization Details
              </h2>
              <button
                onClick={closeViewModal}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Organization Name
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                      {selectedOrganization.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Created Date
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                      {formatDate(selectedOrganization.createdAt || new Date())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Details */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">Settings</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <pre className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-mono">
                    {JSON.stringify(parseSettings(selectedOrganization.settings), null, 2)}
                  </pre>
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Permissions</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {parseSettings(selectedOrganization.settings).permissions?.length || 0}
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Max Users</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {parseSettings(selectedOrganization.settings).rules?.maxUsers || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Allowed Domains</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {parseSettings(selectedOrganization.settings).rules?.allowedDomains?.length || 0}
                    </p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Theme</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {parseSettings(selectedOrganization.settings).preferences?.theme || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Organization */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {selectedOrganization ? 'Edit Organization' : 'Add New Organization'}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white"
                  placeholder="Enter organization name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Settings <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Settings File</span>
                      </div>
                    </label>
                  </div>
                  <textarea
                    name="settings"
                    value={formData.settings}
                    onChange={handleInputChange}
                    rows="8"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white font-mono text-sm"
                    placeholder='Enter settings as JSON, e.g., {"permissions": ["read", "write"], "rules": {"maxUsers": 50}}'
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter JSON settings or upload a JSON/TXT file containing permissions, rules, and preferences
                </p>
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
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {selectedOrganization ? 'Update' : 'Save'}
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
              Are you sure you want to delete the organization "<span className="font-semibold">{selectedOrganization?.name}</span>"? This action cannot be undone.
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
  );
};

export default Superadmin;