import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Shift from '@/models/Shift';
import { authenticate } from '@/lib/auth';
import { calculateHours, calculateMinutes } from '@/lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await authenticate(req, res, ['employee', 'admin', 'hr']);
    if (!auth) return;

    await connectDB();

    const { location, photo } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: auth.userId,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: 'Please check in first' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkOutTime = new Date();
    const totalHours = calculateHours(attendance.checkIn.time, checkOutTime);
    let overtime = 0;

    // Calculate overtime based on shift
    const User = (await import('@/models/User')).default;
    const user = await User.findById(auth.userId);
    if (user?.shiftId) {
      const shift = await Shift.findById(user.shiftId);
      if (shift) {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        const shiftEnd = new Date(today);
        shiftEnd.setHours(endHour, endMinute, 0, 0);

        const expectedHours = calculateHours(shiftStart, shiftEnd);
        if (totalHours > expectedHours) {
          overtime = calculateMinutes(shiftEnd, checkOutTime);
        }
      }
    }

    attendance.checkOut = {
      time: checkOutTime,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address || `${location.lat}, ${location.lng}`,
      },
      photo,
    };
    attendance.totalHours = totalHours;
    attendance.overtime = overtime > 0 ? overtime : undefined;

    // Update status if half-day
    if (totalHours < 4) {
      attendance.status = 'half-day';
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      attendance: {
        id: attendance._id,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours,
        overtime: attendance.overtime,
        status: attendance.status,
      },
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

