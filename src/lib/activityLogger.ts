import dbConnect from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

interface LogActivityParams {
    action: string;
    actionType: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';
    userId: string;
    userName: string;
    userRole: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
    try {
        await dbConnect();
        await ActivityLog.create(params);
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging failure shouldn't break the main operation
    }
}
