import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export async function signup({ name, email, password, role }) {
  try {
    const { data } = await api.post("/auth/signup", {
      name,
      email,
      password,
      role,
    });
    return data;
  } catch (error) {
    throw new Error(error.message || "Signup failed");
  }
}

export async function login({ email, password }) {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  } catch (error) {
    throw new Error(error.message || "Invalid credentials");
  }
}

export async function createComplaint(formData) {
  try {
    const token = getToken();
    const { data } = await axios.post("/api/complaints", formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to create complaint"
    );
  }
}

export async function getComplaints() {
  try {
    const { data } = await api.get("/complaints");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch complaints");
  }
}

export async function getComplaint(id) {
  try {
    const { data } = await api.get(`/complaints/${id}`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch complaint");
  }
}

export async function updateComplaint(id, complaintData) {
  try {
    const { data } = await api.put(`/complaints/${id}`, complaintData);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to update complaint");
  }
}

export async function withdrawComplaint(id) {
  try {
    const { data } = await api.post(`/complaints/${id}/withdraw`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to withdraw complaint");
  }
}

export async function updateComplaintStatus(id, status, adminNotes) {
  try {
    const { data } = await api.post(`/complaints/${id}/status`, {
      status,
      adminNotes,
    });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to update status");
  }
}

export function saveToken(token) {
  localStorage.setItem("auth_token", token);
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

export function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Corrupt data; clear and return null to avoid runtime crashes
    try {
      localStorage.removeItem("user");
    } catch {}
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem("user");
}

export async function getOfficers() {
  try {
    const { data } = await api.get("/complaints/officers");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch officers");
  }
}

export async function assignOfficer(
  complaintId,
  officerId,
  targetResolutionDate
) {
  try {
    const { data } = await api.post(`/complaints/${complaintId}/assign`, {
      officerId,
      targetResolutionDate,
    });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to assign officer");
  }
}

export async function unassignOfficer(complaintId) {
  try {
    const { data } = await api.post(`/complaints/${complaintId}/unassign`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to unassign officer");
  }
}

export async function addInternalNote(complaintId, content) {
  try {
    const { data } = await api.post(
      `/complaints/${complaintId}/internal-notes`,
      { content }
    );
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to add internal note");
  }
}

export async function getInternalNotes(complaintId) {
  try {
    const { data } = await api.get(`/complaints/${complaintId}/internal-notes`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch internal notes");
  }
}

export async function addPublicUpdate(complaintId, content) {
  try {
    const { data } = await api.post(
      `/complaints/${complaintId}/public-updates`,
      { content }
    );
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to add public update");
  }
}

export async function getPublicUpdates(complaintId) {
  try {
    const token = getToken();
    const { data } = await axios.get(
      `/api/complaints/${complaintId}/public-updates`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch public updates"
    );
  }
}

export async function getAssignedComplaints() {
  try {
    const { data } = await api.get("/complaints/assigned");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch assigned complaints");
  }
}

export async function reopenComplaint(id, feedback) {
  try {
    const { data } = await api.post(`/complaints/${id}/reopen`, { feedback });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to reopen complaint");
  }
}

export async function searchComplaints(params = {}) {
  try {
    const { data } = await api.get("/complaints/search", { params });
    return data;
  } catch (error) {
    throw new Error(error.message || "Search failed");
  }
}

export async function getAdminMetrics() {
  try {
    const { data } = await api.get("/complaints/metrics/admin");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch admin metrics");
  }
}

export async function getOfficerMetrics() {
  try {
    const { data } = await api.get("/complaints/metrics/officer");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch officer metrics");
  }
}

export async function downloadComplaintsCsv(ids = []) {
  try {
    const token = getToken();
    const params = {};
    if (ids && ids.length > 0) {
      params.ids = ids.join(",");
    }
    const response = await axios.get("/api/export/complaints", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || "Failed to download CSV");
      } catch (e) {
        throw new Error("Failed to download CSV: " + text);
      }
    }
    throw new Error(error.message || "Failed to download CSV");
  }
}

export async function downloadComplaintsPdf(ids = []) {
  try {
    const token = getToken();
    const params = {};
    if (ids && ids.length > 0) {
      params.ids = ids.join(",");
    }
    const response = await axios.get("/api/export/complaints-pdf", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params,
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || "Failed to download PDF");
      } catch (e) {
        throw new Error("Failed to download PDF: " + text);
      }
    }
  }
}

// User Profile APIs
export async function getUserProfile() {
  try {
    const { data } = await api.get("/users/profile");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch user profile");
  }
}

export async function updateUserProfile({ name, email }) {
  try {
    const { data } = await api.put("/users/profile", { name, email });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function changePassword({ oldPassword, newPassword }) {
  try {
    const { data } = await api.put("/users/password", {
      oldPassword,
      newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to change password");
  }
}

// OTP APIs for Indian phone number verification
export async function sendOtp(phoneNumber) {
  try {
    const { data } = await api.post("/otp/send", { phoneNumber });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to send OTP");
  }
}

export async function verifyOtp(phoneNumber, otpCode) {
  try {
    const { data } = await api.post("/otp/verify", { phoneNumber, otpCode });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to verify OTP");
  }
}

export async function verifyOtpAndLink(phoneNumber, otpCode) {
  try {
    const { data } = await api.post("/otp/verify-and-link", {
      phoneNumber,
      otpCode,
    });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to verify and link phone number");
  }
}

export async function validatePhoneNumber(phoneNumber) {
  try {
    const { data } = await api.post("/otp/validate", { phoneNumber });
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to validate phone number");
  }
}

// Notification APIs
export async function getNotifications() {
  try {
    const { data } = await api.get("/notifications");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch notifications");
  }
}

export async function getUnreadNotifications() {
  try {
    const { data } = await api.get("/notifications/unread");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch unread notifications");
  }
}

export async function getUnreadNotificationCount() {
  try {
    const { data } = await api.get("/notifications/count");
    return data.count;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch notification count");
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const { data } = await api.post(`/notifications/${notificationId}/read`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { data } = await api.post("/notifications/read-all");
    return data;
  } catch (error) {
    throw new Error(
      error.message || "Failed to mark all notifications as read"
    );
  }
}

export async function deleteNotification(notificationId) {
  try {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to delete notification");
  }
}
