import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiMapPin, FiEdit } from 'react-icons/fi';

export default function EmployeeAttendance() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('/api/attendance/history');
      setAttendances(res.data.attendances);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionRequest = async () => {
    if (!correctionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await axios.post('/api/attendance/correction', {
        attendanceId: selectedAttendance._id,
        reason: correctionReason,
      });
      toast.success('Correction request submitted');
      setShowCorrectionModal(false);
      setCorrectionReason('');
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit request');
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendances.map((att) => (
                    <tr key={att._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="mr-2 text-gray-400" />
                          {new Date(att.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.checkIn ? (
                          <div>
                            <div className="flex items-center">
                              <FiClock className="mr-2 text-gray-400" />
                              {new Date(att.checkIn.time).toLocaleTimeString()}
                            </div>
                            {att.checkIn.location && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <FiMapPin className="mr-1" />
                                {att.checkIn.location.address.substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.checkOut ? (
                          <div>
                            <div className="flex items-center">
                              <FiClock className="mr-2 text-gray-400" />
                              {new Date(att.checkOut.time).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.totalHours ? `${att.totalHours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            att.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : att.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : att.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!att.correctionRequest && (
                          <button
                            onClick={() => {
                              setSelectedAttendance(att);
                              setShowCorrectionModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <FiEdit className="mr-1" />
                            Request Correction
                          </button>
                        )}
                        {att.correctionRequest && (
                          <span
                            className={`text-xs ${
                              att.correctionRequest.status === 'approved'
                                ? 'text-green-600'
                                : att.correctionRequest.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {att.correctionRequest.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Request Attendance Correction</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Explain why you need this correction..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCorrectionModal(false);
                    setCorrectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCorrectionRequest}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

