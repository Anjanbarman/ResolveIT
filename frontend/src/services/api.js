export async function signup({ name, email, password, role }) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Signup failed");
  }
  return data;
}

export async function login({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Invalid credentials");
  }
  return data;
}

export async function createComplaint(formData) {
  const token = getToken();
  const res = await fetch("/api/complaints", {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to create complaint");
  }
  return data;
}

export async function getComplaints() {
  const token = getToken();
  const res = await fetch("/api/complaints", {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch complaints");
  }
  return data;
}

export async function getComplaint(id) {
  const token = getToken();
  const res = await fetch(`/api/complaints/${id}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch complaint");
  }
  return data;
}

export async function updateComplaint(id, data) {
  const token = getToken();
  const res = await fetch(`/api/complaints/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result.message || "Failed to update complaint");
  }
  return result;
}

export async function withdrawComplaint(id) {
  const token = getToken();
  const res = await fetch(`/api/complaints/${id}/withdraw`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to withdraw complaint");
  }
  return data;
}

export async function updateComplaintStatus(id, status, adminNotes) {
  const token = getToken();
  const res = await fetch(`/api/complaints/${id}/status`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, adminNotes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to update status");
  }
  return data;
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
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function clearUser() {
  localStorage.removeItem("user");
}
