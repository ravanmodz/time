import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUsers, FiCheckCircle, FiXCircle, FiClock, FiMapPin } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [currentlyWorking, setCurrentlyWorking] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data.stats);
      setCurrentlyWorking(res.data.currentlyWorking);
      setTrends(res.data.trends);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalEmployees || 0}</p>
              </div>
              <FiUsers className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Present Today</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{stats?.presentToday || 0}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Absent Today</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{stats?.absentToday || 0}</p>
              </div>
              <FiXCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Late Entries</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{stats?.lateEntries || 0}</p>
              </div>
              <FiClock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Trends (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" name="Present" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Currently Working */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Currently Working ({currentlyWorking.length})
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {currentlyWorking.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No one is currently working</p>
              ) : (
                currentlyWorking.map((item: any) => (
                  <div key={item.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{item.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {item.checkIn
                            ? new Date(item.checkIn.time).toLocaleTimeString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {item.location && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <FiMapPin className="mr-1" />
                        {item.location.address?.substring(0, 40)}...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

