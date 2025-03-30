'use client';

import { Metadata } from '../lib/types';

interface DashboardMetricsProps {
  metadata: Metadata;
}

export default function DashboardMetrics({ metadata }: DashboardMetricsProps) {
  if (!metadata) {
    return null;
  }
  
  const formattedDate = metadata.last_updated 
    ? new Date(metadata.last_updated).toLocaleString()
    : 'Unknown';
  
  const safetyPercentage = metadata.total_papers > 0
    ? ((metadata.safety_papers_count / metadata.total_papers) * 100).toFixed(1)
    : '0';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card bg-blue-50">
        <h3 className="text-lg font-medium text-blue-900">Total Papers</h3>
        <p className="text-3xl font-bold text-blue-700 mt-2">{metadata.total_papers}</p>
        <p className="text-sm text-blue-600 mt-1">across {metadata.categories?.length || 0} arXiv categories</p>
      </div>
      
      <div className="card bg-green-50">
        <h3 className="text-lg font-medium text-green-900">Safety Papers</h3>
        <p className="text-3xl font-bold text-green-700 mt-2">{metadata.safety_papers_count}</p>
        <p className="text-sm text-green-600 mt-1">{safetyPercentage}% of total papers</p>
      </div>
      
      <div className="card bg-purple-50">
        <h3 className="text-lg font-medium text-purple-900">Last Updated</h3>
        <p className="text-xl font-bold text-purple-700 mt-2">{formattedDate}</p>
        <p className="text-sm text-purple-600 mt-1">Automatic daily updates</p>
      </div>
    </div>
  );
}