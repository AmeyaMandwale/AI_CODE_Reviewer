// src/pages/OrganisationAnalytics.jsx
import React, { useState } from "react";
import AnalyticsFilters from "../components/AnalyticsFilters";
import QualityTrendChart from "../components/QualityTrendChart";

const OrganisationAnalytics = ({ repositories }) => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const DUMMY_ANALYTICS = [
    { date: "2025-01-01", codeIssues: 42, securityIssues: 6, coverage: 65 },
    { date: "2025-01-08", codeIssues: 35, securityIssues: 5, coverage: 68 },
    { date: "2025-01-15", codeIssues: 28, securityIssues: 4, coverage: 72 },
  ];

  const loadAnalytics = ({ repoId }) => {
    if (!repoId) return;

    setLoading(true);
    setTimeout(() => {
      setAnalyticsData(DUMMY_ANALYTICS);
      setLoading(false);
    }, 500);
  };

  return (
    <>
      <AnalyticsFilters repositories={repositories} onApply={loadAnalytics} />

      {loading ? (
        <p className="text-slate-500 mt-4">Loading analytics...</p>
      ) : (
        <QualityTrendChart data={analyticsData} />
      )}
    </>
  );
};

export default OrganisationAnalytics;
