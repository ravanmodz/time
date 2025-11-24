import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { authenticate } from '@/lib/auth';
import XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await authenticate(req, res, ['admin', 'hr', 'super_admin']);
  if (!auth) return;

  await connectDB();

  try {
    const { startDate, endDate, userId, department, format } = req.query;

    const query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    if (userId) {
      query.userId = userId;
    } else if (department) {
      const users = await User.find({ department }).select('_id');
      query.userId = { $in: users.map((u) => u._id) };
    }

    const attendances = await Attendance.find(query)
      .populate('userId', 'name email department designation')
      .sort({ date: -1 });

    const data = attendances.map((att) => ({
      'Employee ID': att.userId?._id || '',
      'Employee Name': att.userId?.name || '',
      'Email': att.userId?.email || '',
      'Department': att.userId?.department || '',
      'Date': att.date.toISOString().split('T')[0],
      'Check-in Time': att.checkIn?.time ? new Date(att.checkIn.time).toLocaleTimeString() : 'N/A',
      'Check-out Time': att.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString() : 'N/A',
      'Total Hours': att.totalHours?.toFixed(2) || '0',
      'Late By (min)': att.lateBy || '0',
      'Overtime (min)': att.overtime || '0',
      'Status': att.status,
      'Location': att.checkIn?.location?.address || 'N/A',
    }));

    if (format === 'csv' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.xlsx`);
      return res.send(buffer);
    } else {
      return res.status(200).json({
        success: true,
        data,
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

