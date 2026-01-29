import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './src/components/ProtectedRoute.jsx';

import Home from './src/pages/Home.jsx';
import Superadmin from './src/pages/Superadmin.jsx';
import Tools from './src/pages/Tools.jsx';
import Reports from './src/pages/Reports.jsx';
import Billing from './src/pages/Billing.jsx';
import Settings from './src/pages/Settings.jsx';
import Support from './src/pages/Support.jsx';
import NotFound from './src/pages/NotFound.jsx';
import SignIn from './src/pages/SignIn.jsx';
import SignUp from './src/pages/SignUp.jsx';
// import SelectRepo from './src/pages/SelectRepo.jsx';
// Code Overview Pages

import RepositoriesDashboard from './src/pages/RepositoriesDashboard.jsx';
import RepositoryDetail from "./src/pages/RepositoryDetail";
import ReviewAnalytics from './src/pages/ReviewAnalytics.jsx';

// Guidelines & Policies Pages


import CustomGuidelinesBuilder from './src/pages/CustomGuidelinesBuilder.jsx'; 


export default function App() {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <Router>
        <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
          <Routes>
            
            <Route path="/superadmin" element={<Superadmin/>} />
            <Route path="/tools/*" element={<Tools />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />

             <Route path="/signin" element={<SignIn />} /> 
             <Route path="/signup" element={<SignUp />} />
        
              {/* Code Overview Routes */}
           
            <Route path="/code-overview/repositories" element={<RepositoriesDashboard />} />
             <Route path="/code-overview/repositories/:repoId" element={<RepositoryDetail />} />
            <Route path="/code-overview/analytics" element={<ReviewAnalytics />} />

            {/* Guidelines & Policies Routes */}
            
        
            <Route path="/guidelines/builder" element={<CustomGuidelinesBuilder />} /> {/* Add this route */}
            
            <Route path="*" element={<NotFound />} />
              {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </main>
      </Router>
    </Theme>
  );
}