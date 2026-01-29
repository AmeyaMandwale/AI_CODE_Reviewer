import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const QualityTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-slate-500">No analytics data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />

        <Line type="monotone" dataKey="codeIssues" stroke="#ef4444" />
        <Line type="monotone" dataKey="securityIssues" stroke="#f59e0b" />
        <Line type="monotone" dataKey="coverage" stroke="#22c55e" />
        <Line type="monotone" dataKey="reviewScore" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default QualityTrendChart;
