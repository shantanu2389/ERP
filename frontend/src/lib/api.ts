const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export interface UserSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ERP_ADMIN' | 'TEACHER' | 'STUDENT';
    permissions: string[];
    studentProfile?: any;
    teacherProfile?: any;
  };
}

export const DEMO_STUDENTS = [
  {
    name: 'Aarav Patel',
    rollNo: '24CSE1023',
    email: '24cse1023@college.edu',
    password: 'StudentPassword@123',
    details: 'CSE-4A • 84.7% Attendance • Bunk Advisory Active',
  },
  {
    name: 'Priya Sharma',
    rollNo: '24CSE1024',
    email: '24cse1024@college.edu',
    password: 'StudentPassword@123',
    details: 'CSE-4A • 93.3% Attendance • Top Performer',
  },
  {
    name: 'Rohan Verma',
    rollNo: '24CSE1025',
    email: '24cse1025@college.edu',
    password: 'StudentPassword@123',
    details: 'CSE-4A • 72.0% Attendance • Recovery Alert',
  },
];

export const DEMO_TEACHERS = [
  {
    name: 'Prof. Rajesh Sharma',
    employeeId: 'FAC-CSE-101',
    email: 'prof.sharma@college.edu',
    password: 'TeacherPassword@123',
    details: 'Associate Professor • CSE (DSA, OS, Math)',
  },
  {
    name: 'Dr. Ananya Sen',
    employeeId: 'FAC-CSE-102',
    email: 'dr.ananya@college.edu',
    password: 'TeacherPassword@123',
    details: 'Professor & HOD • CSE (DBMS)',
  },
];

export const DEMO_ADMINS = [
  {
    name: 'Suresh Mehta (Admin #102)',
    email: 'erpadmin1@college.edu',
    password: 'AdminPassword@123',
    role: 'ERP_ADMIN',
    details: 'ERP Operations • Approval Queue & Audit Logs',
  },
  {
    name: 'Dr. Arvind Swaminathan',
    email: 'superadmin@college.edu',
    password: 'AdminPassword@123',
    role: 'SUPER_ADMIN',
    details: 'College Director • Master System Privileges',
  },
];

export const PRESET_ACCOUNTS = [
  {
    role: 'STUDENT' as const,
    label: 'Student Portal (Aarav Patel)',
    identifier: '24CSE1023',
    password: 'StudentPassword@123',
    badge: 'Roll: 24CSE1023',
  },
  {
    role: 'TEACHER' as const,
    label: 'Teacher Portal (Prof. Rajesh Sharma)',
    identifier: 'prof.sharma@college.edu',
    password: 'TeacherPassword@123',
    badge: 'Faculty CSE',
  },
  {
    role: 'ERP_ADMIN' as const,
    label: 'ERP Admin #102 (Suresh Mehta)',
    identifier: 'erpadmin1@college.edu',
    password: 'AdminPassword@123',
    badge: 'ERP Operations',
  },
  {
    role: 'SUPER_ADMIN' as const,
    label: 'Super Admin (Dr. Arvind Swaminathan)',
    identifier: 'superadmin@college.edu',
    password: 'AdminPassword@123',
    badge: 'Director / Master',
  },
];

const STORAGE_KEY = 'college_erp_session_v1';

export async function getLoginChallenge(): Promise<{ challengeId: string; question: string }> {
  const res = await fetch(`${API_BASE}/auth/challenge`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error('Unable to load human verification');
  return { challengeId: data.challengeId, question: data.question };
}

export async function login(
  identifier: string,
  password: string,
  expectedRole: 'STUDENT' | 'TEACHER' | 'ADMIN',
  challengeId: string,
  challengeAnswer: string
): Promise<UserSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password, expectedRole, challengeId, challengeAnswer }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Login failed');
  }

  return { token: data.token, user: data.user };
}

export async function fetchWithAuth(endpoint: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export function saveSession(session: UserSession): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function getStoredSession(): UserSession | null {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
  }
  return null;
}

export function clearStoredSession(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to clear session from localStorage', e);
  }
}
