// src/pages/DeveloperAnalytics.jsx
import React, { useEffect, useState } from "react";
import QualityTrendChart from "../components/QualityTrendChart";

const DeveloperAnalytics = () => {
  const [developers, setDevelopers] = useState([]);
  const [selectedDev, setSelectedDev] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dummy developers
  const DUMMY_DEVELOPERS = [
    { id: "u1", name: "Pankaj Shahare" },
    { id: "u2", name: "Rahul Patil" },
    { id: "u3", name: "Sneha Kulkarni" },
  ];

  // Dummy issue analytics per developer
  const DUMMY_DEV_ISSUES = [
    { date: "2025-01-01", issues: 6 },
    { date: "2025-01-08", issues: 4 },
    { date: "2025-01-15", issues: 2 },
  ];

  useEffect(() => {
    // later → API: /api/org/developers
    setDevelopers(DUMMY_DEVELOPERS);
  }, []);

  const loadDeveloperAnalytics = () => {
    if (!selectedDev) return;

    setLoading(true);
    setTimeout(() => {
      setAnalyticsData(DUMMY_DEV_ISSUES);
      setLoading(false);
    }, 500);
  };

  return (
    <>
      {/* 🔹 Developer Selector */}
      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Developer</label>
          <select
            value={selectedDev}
            onChange={(e) => setSelectedDev(e.target.value)}
            className="w-64 px-3 py-2 border rounded-md"
          >
            <option value="">Select developer</option>
            {developers.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadDeveloperAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Apply
        </button>
      </div>

      {/* 🔹 Chart */}
      {loading ? (
        <p className="text-slate-500">Loading developer issues...</p>
      ) : (
        <QualityTrendChart data={analyticsData} />
      )}
    </>
  );
};

export default DeveloperAnalytics;
