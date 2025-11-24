import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(400).json({ error: 'Database already seeded' });
    }

    // Create default users
    const users = [
      {
        name: 'Super Admin',
        email: 'admin@smarttrack.com',
        phone: '+1234567890',
        password: 'admin123',
        role: 'super_admin',
        status: 'active',
      },
      {
        name: 'HR Manager',
        email: 'hr@smarttrack.com',
        phone: '+1234567891',
        password: 'hr123',
        role: 'hr',
        department: 'Human Resources',
        designation: 'HR Manager',
        status: 'active',
      },
      {
        name: 'John Doe',
        email: 'employee@smarttrack.com',
        phone: '+1234567892',
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Software Developer',
        status: 'active',
      },
    ];

    await User.insertMany(users);

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      users: users.map((u) => ({ email: u.email, role: u.role })),
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

