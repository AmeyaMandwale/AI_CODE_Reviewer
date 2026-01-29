import React, { useState } from "react";

const AnalyticsFilters = ({ repositories, onApply }) => {
  const [repoId, setRepoId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end">
      <div>
        <label className="block text-sm mb-1">Repository</label>
        <select
          className="border px-3 py-2 rounded"
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
        >
          <option value="">Select Repository</option>
          {repositories.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">From</label>
        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">To</label>
        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button
        onClick={() => onApply({ repoId, from, to })}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default AnalyticsFilters;
