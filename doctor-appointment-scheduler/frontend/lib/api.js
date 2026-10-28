const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('medrella_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || 'Network request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    me: () => fetchApi('/auth/me'),
  },
  doctors: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return fetchApi(`/doctors${qs ? `?${qs}` : ''}`);
    },
    get: (id) => fetchApi(`/doctors/${id}`),
    availability: (id, date) => fetchApi(`/doctors/${id}/availability?date=${date}`),
    updateProfile: (profileData) => fetchApi('/doctors/me/profile', { method: 'PATCH', body: JSON.stringify(profileData) }),
    updateSchedule: (schedules) => fetchApi('/doctors/me/availability', { method: 'PATCH', body: JSON.stringify({ schedules }) }),
  },
  specialties: {
    list: () => fetchApi('/specialties'),
  },
  appointments: {
    book: (bookingData) => fetchApi('/appointments', { method: 'POST', body: JSON.stringify(bookingData) }),
    my: () => fetchApi('/appointments/my'),
    doctor: () => fetchApi('/appointments/doctor'),
    get: (id) => fetchApi(`/appointments/${id}`),
    updateStatus: (id, status) => fetchApi(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    cancel: (id, reason) => fetchApi(`/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ cancellationReason: reason }) }),
  },
  admin: {
    dashboard: () => fetchApi('/admin/dashboard'),
    doctors: () => fetchApi('/admin/doctors'),
    updateApproval: (id, status) => fetchApi(`/admin/doctors/${id}/approval`, { method: 'PATCH', body: JSON.stringify({ approvalStatus: status }) }),
    patients: () => fetchApi('/admin/patients'),
    toggleUser: (id) => fetchApi(`/admin/users/${id}/toggle-active`, { method: 'PATCH' }),
    appointments: () => fetchApi('/admin/appointments'),
  },
};
