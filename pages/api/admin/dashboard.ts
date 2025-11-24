import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import { authenticate } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await authenticate(req, res, ['super_admin', 'admin', 'hr']);
  if (!auth) return;

  await connectDB();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total employees
    const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });

    // Today's attendance stats
    const todayAttendances = await Attendance.find({ date: today }).populate('userId', 'name email');

    const presentToday = todayAttendances.filter((a) => a.status === 'present' || a.status === 'late').length;
    const absentToday = totalEmployees - presentToday;
    const lateEntries = todayAttendances.filter((a) => a.status === 'late').length;

    // Currently working (checked in but not checked out)
    const currentlyWorking = todayAttendances.filter(
      (a) => a.checkIn && !a.checkOut
    );

    // Get attendance trends (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttendances = await Attendance.find({
      date: { $gte: sevenDaysAgo, $lte: today },
    });

    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayAttendances = recentAttendances.filter(
        (a) => a.date.toDateString() === date.toDateString()
      );
      trends.push({
        date: date.toISOString().split('T')[0],
        present: dayAttendances.filter((a) => a.status === 'present' || a.status === 'late').length,
        absent: dayAttendances.filter((a) => a.status === 'absent').length,
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        lateEntries,
        currentlyWorking: currentlyWorking.length,
      },
      currentlyWorking: currentlyWorking.map((a) => ({
        id: a._id,
        user: a.userId,
        checkIn: a.checkIn,
        location: a.checkIn.location,
      })),
      trends,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

