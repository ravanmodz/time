import { useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

export default function AdminReports() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    format: 'excel',
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      const res = await axios.get('/api/reports/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${Date.now()}.${filters.format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Export Reports</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <select
                value={filters.format}
                onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload />
              <span>{loading ? 'Exporting...' : 'Export Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

