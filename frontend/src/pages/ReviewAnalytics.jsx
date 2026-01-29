import React, { useEffect, useState } from "react";
import OrganisationAnalytics from "./OrganisationAnalytics";
import DeveloperAnalytics from "./DeveloperAnalytics";

const VIEW_MODES = {
  ORG: "org",
  DEV: "dev",
};

const ReviewAnalytics = () => {
  const [repositories, setRepositories] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.ORG);

  const orgId = localStorage.getItem("OrgId");
  const provider = localStorage.getItem("provider");

  useEffect(() => {
    loadRepositories();
  }, [orgId, provider]);

  const loadRepositories = async () => {
    if (!orgId || !provider) return;

    try {
      if (provider === "github") {
        await fetch(`/api/Repository/sync?orgId=${orgId}`, {
          method: "POST",
        });
      }

      const res = await fetch(
        `/api/Repository?orgId=${orgId}&provider=${provider}`
      );

      const data = await res.json();
      if (Array.isArray(data)) {
        setRepositories(data);
      }
    } catch (err) {
      console.error("Failed to load repositories", err);
    }
  };

  return (
    <div className="p-6">
      {/* 🔹 Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Developer Repository Metrics
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Analytics dashboard
          </p>
        </div>

        {/* 🔹 View Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(VIEW_MODES.ORG)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition
              ${
                viewMode === VIEW_MODES.ORG
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
          >
            Organisation View
          </button>

          <button
            onClick={() => setViewMode(VIEW_MODES.DEV)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition
              ${
                viewMode === VIEW_MODES.DEV
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
          >
            Developer View
          </button>
        </div>
      </div>

      {/* 🔹 Content */}
      <div className="mt-4">
        {viewMode === VIEW_MODES.ORG ? (
          <OrganisationAnalytics repositories={repositories} />
        ) : (
          <DeveloperAnalytics />
        )}
      </div>
    </div>
  );
};

export default ReviewAnalytics;
