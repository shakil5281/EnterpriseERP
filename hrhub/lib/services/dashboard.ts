import api from '@/lib/api';

export interface DashboardSummary {
  totalWorkforce: number;
  presentToday: number;
  onLeaveToday: number;
  openPositions: number;
  workforceGrowth: number;
  attendanceTrend: number;
}

export interface AttendanceStat {
  date: string;
  presentCount: number;
  targetCount: number;
}

export interface DepartmentStat {
  departmentName: string;
  employeeCount: number;
  color: string;
}

export interface RecentHire {
  name: string;
  position: string;
  department: string;
  joinDate: string;
  imageUrl: string;
}

export interface UpcomingEvent {
  name: string;
  eventType: string;
  date: string;
  color: string;
}

export const getDashboardSummary = async () => {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
};

export const getAttendanceStats = async () => {
  const response = await api.get<AttendanceStat[]>('/dashboard/attendance-stats');
  return response.data;
};

export const getDepartmentStats = async () => {
  const response = await api.get<DepartmentStat[]>('/dashboard/department-stats');
  return response.data;
};

export const getRecentHires = async () => {
  const response = await api.get<RecentHire[]>('/dashboard/recent-hires');
  return response.data;
};

export const getUpcomingEvents = async () => {
  const response = await api.get<UpcomingEvent[]>('/dashboard/upcoming-events');
  return response.data;
};
