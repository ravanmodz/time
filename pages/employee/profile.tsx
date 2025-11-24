import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiBriefcase } from 'react-icons/fi';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setProfile(res.data.user);
    } catch (error) {
      toast.error('Failed to fetch profile');
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
                <p className="text-gray-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-3">
                <FiMail className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FiPhone className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{profile?.phone}</p>
                </div>
              </div>

              {profile?.department && (
                <div className="flex items-center space-x-3">
                  <FiBriefcase className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="text-gray-900">{profile.department}</p>
                  </div>
                </div>
              )}

              {profile?.designation && (
                <div className="flex items-center space-x-3">
                  <FiBriefcase className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="text-gray-900">{profile.designation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

