import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
import { authenticate } from '@/lib/auth';
import { calculateMinutes } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res, ['employee', 'admin', 'hr']);
    if (!auth) return;

    await connectDB();

    const { location, photo, deviceInfo, ip } = req.body;

    if (!location || !photo) {
      return res.status(400).json({ error: 'Location and photo are required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      userId: auth.userId,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const checkInTime = new Date();
    let status = 'present';
    let lateBy = 0;

    // Get user's shift to check if late
    const User = (await import('@/models/User')).default;
    const user = await User.findById(auth.userId);
    if (user?.shiftId) {
      const shift = await Shift.findById(user.shiftId);
      if (shift) {
        const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(shiftHour, shiftMinute, 0, 0);

        if (checkInTime > shiftStart) {
          lateBy = calculateMinutes(shiftStart, checkInTime);
          if (lateBy > shift.graceTime) {
            status = 'late';
          }
        }
      }
    }

    const attendance = existingAttendance || new Attendance({
      userId: auth.userId,
      date: today,
    });

    attendance.checkIn = {
      time: checkInTime,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address || `${location.lat}, ${location.lng}`,
      },
      photo,
      deviceInfo: deviceInfo || 'Unknown',
      ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
    };
    attendance.status = status;
    attendance.lateBy = lateBy > 0 ? lateBy : undefined;

    await attendance.save();

    return res.status(200).json({
      success: true,
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        status: attendance.status,
        lateBy: attendance.lateBy,
      },
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

