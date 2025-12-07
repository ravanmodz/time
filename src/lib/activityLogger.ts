import dbConnect from '@/lib/mongodb';
import { ActivityLog } from '@/models/ActivityLog';

export type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other';

interface LogActivityParams {
    action: string;
    actionType: ActionType;
    userId: string;
    userName: string;
    userRole: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    details?: string;
}

export async function logActivity(params: LogActivityParams) {
    try {
        await dbConnect();
        await ActivityLog.create(params);
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - activity logging should not break main functionality
    }
}

// Shorthand functions for common actions
export const logCreate = (
    userName: string,
    userRole: string,
    userId: string,
    targetType: string,
    targetName: string,
    details?: string
) => logActivity({
    action: `Created new ${targetType}: ${targetName}`,
    actionType: 'create',
    userId,
    userName,
    userRole,
    targetType,
    targetName,
    details
});

export const logUpdate = (
    userName: string,
    userRole: string,
    userId: string,
    targetType: string,
    targetName: string,
    details?: string
) => logActivity({
    action: `Updated ${targetType}: ${targetName}`,
    actionType: 'update',
    userId,
    userName,
    userRole,
    targetType,
    targetName,
    details
});

export const logDelete = (
    userName: string,
    userRole: string,
    userId: string,
    targetType: string,
    targetName: string,
    details?: string
) => logActivity({
    action: `Deleted ${targetType}: ${targetName}`,
    actionType: 'delete',
    userId,
    userName,
    userRole,
    targetType,
    targetName,
    details
});

export const logLogin = (
    userName: string,
    userRole: string,
    userId: string
) => logActivity({
    action: `${userName} logged in as ${userRole}`,
    actionType: 'login',
    userId,
    userName,
    userRole
});

export const logLogout = (
    userName: string,
    userRole: string,
    userId: string
) => logActivity({
    action: `${userName} logged out`,
    actionType: 'logout',
    userId,
    userName,
    userRole
});
