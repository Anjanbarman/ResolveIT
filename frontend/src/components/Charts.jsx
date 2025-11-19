import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#08a708ff",
  "#944c05ff",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#EF4444",
];

export function StatusDistributionChart({ complaints }) {
  const data = Object.entries(
    complaints.reduce((acc, c) => {
      const key = c.status === "COMPLETED" ? "IN_PROGRESS" : c.status; // mask completed
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  if (!data.length) return <p className="text-sm text-gray-500">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ complaints }) {
  const data = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  if (!data.length) return <p className="text-sm text-gray-500">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#4B5563" />
        <YAxis stroke="#4B5563" />
        <Tooltip />
        <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PriorityBarChart({ complaints }) {
  const order = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const counts = complaints.reduce((acc, c) => {
    acc[c.priority] = (acc[c.priority] || 0) + 1;
    return acc;
  }, {});
  const data = order
    .filter((p) => counts[p])
    .map((p) => ({ name: p, count: counts[p] }));
  if (!data.length) return <p className="text-sm text-gray-500">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#4B5563" />
        <YAxis stroke="#4B5563" />
        <Tooltip />
        <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResolutionTimeEstimate({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="p-4 bg-indigo-50 rounded-lg h-full flex flex-col justify-center">
      <h3 className="text-sm font-semibold text-indigo-700 mb-2">
        Avg Resolution (Hours)
      </h3>
      <p className="text-3xl font-bold text-indigo-900">
        {Math.round(metrics.averageResolutionHours || 0)}
      </p>
      <p className="text-xs text-indigo-600 mt-2">
        Based on resolved complaints.
      </p>
    </div>
  );
}
