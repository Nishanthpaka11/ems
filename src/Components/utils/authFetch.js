// src/Components/utils/authFetch.js

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return null;
  }

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 🔴 Logout ONLY if token is invalid
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return null;
    }

    return response;
  } catch (error) {
    // 🟢 DO NOT logout on network/server errors
    console.error('authFetch network error:', error);
    throw error; // let component handle it
  }
};
