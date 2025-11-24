import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiClock, FiMapPin, FiCamera } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [photo, setPhoto] = useState<string>('');

  useEffect(() => {
    fetchStatus();
    getLocation();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/attendance/status');
      setStatus(res.data);
    } catch (error) {
      toast.error('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Simple reverse geocoding (you can use OpenCage API for better results)
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_OPENCAGE_KEY || ''}`
            );
            const data = await response.json();
            const address = data.results?.[0]?.formatted || `${lat}, ${lng}`;
            setLocation({ lat, lng, address });
          } catch {
            setLocation({ lat, lng, address: `${lat}, ${lng}` });
          }
        },
        () => {
          toast.error('Location access denied');
        }
      );
    }
  };

  const capturePhoto = () => {
    return new Promise<string>((resolve) => {
      const video = document.createElement('video');
      video.style.display = 'none';
      document.body.appendChild(video);

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          video.play();

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0);
            stream.getTracks().forEach((track) => track.stop());
            document.body.removeChild(video);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          });
        })
        .catch(() => {
          // Fallback to file input
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          };
          input.click();
        });
    });
  };

  const handleCheckIn = async () => {
    if (!location) {
      toast.error('Please allow location access');
      return;
    }

    setChecking(true);
    try {
      const photoData = await capturePhoto();
      setPhoto(photoData);

      const deviceInfo = navigator.userAgent;
      const ip = 'Unknown'; // Will be captured server-side

      await axios.post('/api/attendance/checkin', {
        location,
        photo: photoData,
        deviceInfo,
        ip,
      });

      toast.success('Checked in successfully!');
      fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      toast.error('Please allow location access');
      return;
    }

    setChecking(true);
    try {
      const photoData = photo || await capturePhoto();

      await axios.post('/api/attendance/checkout', {
        location,
        photo: photoData,
      });

      toast.success('Checked out successfully!');
      fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Check-out failed');
    } finally {
      setChecking(false);
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

  const currentStatus = status?.status || 'not_checked_in';
  const attendance = status?.attendance;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Status</h2>
          <div className="flex items-center space-x-4">
            <div
              className={`w-4 h-4 rounded-full ${
                currentStatus === 'present'
                  ? 'bg-green-500'
                  : currentStatus === 'checked_out'
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-lg font-semibold capitalize">
              {currentStatus.replace('_', ' ')}
            </span>
          </div>

          {attendance?.checkIn && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-gray-600">
                <FiClock className="mr-2" />
                Check-in: {new Date(attendance.checkIn.time).toLocaleTimeString()}
              </div>
              {attendance.checkOut && (
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2" />
                  Check-out: {new Date(attendance.checkOut.time).toLocaleTimeString()}
                </div>
              )}
              {attendance.totalHours && (
                <div className="text-lg font-semibold text-primary-600">
                  Total Hours: {attendance.totalHours.toFixed(2)} hrs
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentStatus === 'not_checked_in' && (
              <button
                onClick={handleCheckIn}
                disabled={checking || !location}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiCamera className="w-5 h-5" />
                <span>{checking ? 'Checking in...' : 'Check In'}</span>
              </button>
            )}

            {currentStatus === 'present' && (
              <button
                onClick={handleCheckOut}
                disabled={checking || !location}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiClock className="w-5 h-5" />
                <span>{checking ? 'Checking out...' : 'Check Out'}</span>
              </button>
            )}

            <div className="flex items-center space-x-2 text-gray-600">
              <FiMapPin className="w-5 h-5" />
              <span className="text-sm">
                {location ? location.address : 'Getting location...'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">This Month</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">--</p>
            <p className="text-sm text-gray-500">Days Present</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {attendance?.totalHours?.toFixed(1) || '0.0'}
            </p>
            <p className="text-sm text-gray-500">Today</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Overtime</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {attendance?.overtime ? `${Math.round(attendance.overtime / 60)}h` : '0h'}
            </p>
            <p className="text-sm text-gray-500">This Month</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

