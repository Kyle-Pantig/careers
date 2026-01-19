const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DashboardStats {
  overview: {
    jobs: {
      total: number;
      published: number;
      draft: number;
      expired: number;
    };
    applications: {
      total: number;
      pending: number;
      reviewed: number;
      shortlisted: number;
      rejected: number;
      hired: number;
    };
    users: {
      total: number;
      byRole: { role: string; count: number }[];
    };
    industries: {
      total: number;
      active: number;
    };
    views: number;
  };
  recentApplications: {
    id: string;
    applicantName: string;
    email: string;
    status: string;
    jobTitle: string;
    jobNumber: string;
    createdAt: string;
  }[];
  recentJobs: {
    id: string;
    title: string;
    jobNumber: string;
    industry: string;
    location: string;
    isPublished: boolean;
    applicationsCount: number;
    viewsCount: number;
    createdAt: string;
  }[];
  charts: {
    applicationsByMonth: { month: string; count: number }[];
    jobsByIndustry: { name: string; count: number }[];
    applicationsByIndustry: { industry: string; count: number }[];
    dailyActivity: { date: string; views: number; applications: number }[];
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/dashboard/stats`, {
    credentials: 'include',
  });

  const result = await res.json();

  if (!res.ok || result.error) {
    throw new Error(result.error || 'Failed to fetch dashboard stats');
  }

  return result;
}
