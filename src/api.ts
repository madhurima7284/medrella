const TOKEN_KEY = 'medrella_auth_token';
const USER_KEY = 'medrella_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  const item = localStorage.getItem(USER_KEY);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const clientApi = {
  // Authentication
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  register: (payload: any) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request('/auth/me'),

  logout: () => {
    clearStoredAuth();
    return Promise.resolve();
  },

  // Doctors & Directory
  getDoctors: (params: { search?: string; specialtyId?: string; status?: string; city?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.specialtyId) query.append('specialtyId', params.specialtyId);
    if (params.status) query.append('status', params.status);
    if (params.city && params.city !== 'ALL') query.append('city', params.city);
    const qs = query.toString();
    return request(`/doctors${qs ? `?${qs}` : ''}`);
  },

  getDoctor: (id: string) => request(`/doctors/${id}`),

  getDoctorAvailability: (id: string, date: string) =>
    request(`/doctors/${id}/availability?date=${date}`),

  updateDoctorProfile: (data: any) =>
    request('/doctors/me/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  updateDoctorSchedule: (schedules: any[]) =>
    request('/doctors/me/availability', { method: 'PATCH', body: JSON.stringify({ schedules }) }),

  // Specialties
  getSpecialties: () => request('/specialties'),

  createSpecialty: (payload: { name: string; description?: string; iconName?: string }) =>
    request('/admin/specialties', { method: 'POST', body: JSON.stringify(payload) }),

  updateSpecialty: (id: string, payload: { name?: string; description?: string; iconName?: string }) =>
    request(`/admin/specialties/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  deleteSpecialty: (id: string) =>
    request(`/admin/specialties/${id}`, { method: 'DELETE' }),

  // Appointments
  bookAppointment: (payload: { doctorId: string; startAt: string; reasonForVisit?: string }) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),

  getMyPatientAppointments: () => request('/appointments/my'),

  getMyDoctorAppointments: () => request('/appointments/doctor'),

  getAppointment: (id: string) => request(`/appointments/${id}`),

  updateAppointmentStatus: (id: string, status: string, cancellationReason?: string) =>
    request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    }),

  cancelAppointment: (id: string, reason: string) =>
    request(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  // Administration
  getAdminDashboard: () => request('/admin/dashboard'),

  getAdminDoctors: () => request('/admin/doctors'),

  updateDoctorApproval: (id: string, approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED') =>
    request(`/admin/doctors/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus }),
    }),

  getAdminPatients: () => request('/admin/patients'),

  toggleUserActive: (id: string) =>
    request(`/admin/users/${id}/toggle-active`, { method: 'PATCH' }),

  getAdminAppointments: () => request('/admin/appointments'),

  resetDatabase: () => request('/dev/reset-database', { method: 'POST' }),
};
