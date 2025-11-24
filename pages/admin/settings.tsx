import Layout from '@/components/Layout';
import { FiClock, FiPlus } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    graceTime: 15,
    halfDayHours: 4,
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await axios.get('/api/shifts/list');
      setShifts(res.data.shifts);
    } catch (error) {
      toast.error('Failed to fetch shifts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/shifts/list', formData);
      toast.success('Shift created');
      setShowModal(false);
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        graceTime: 15,
        halfDayHours: 4,
      });
      fetchShifts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create shift');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <FiPlus />
            <span>Add Shift</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => (
            <div key={shift._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                <FiClock className="text-primary-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Time:</span>
                  <span className="font-medium">{shift.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Time:</span>
                  <span className="font-medium">{shift.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Grace Time:</span>
                  <span className="font-medium">{shift.graceTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Half Day:</span>
                  <span className="font-medium">{shift.halfDayHours} hrs</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Shift Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Create Shift</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shift Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Morning Shift"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grace Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.graceTime}
                    onChange={(e) => setFormData({ ...formData, graceTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Half Day Hours</label>
                  <input
                    type="number"
                    value={formData.halfDayHours}
                    onChange={(e) => setFormData({ ...formData, halfDayHours: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

