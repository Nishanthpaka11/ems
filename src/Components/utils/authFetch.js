// src/Components/utils/authFetch.js

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return null;
  }

  const isFormData = options.body instanceof FormData;

  // Set up headers only if not FormData
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

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return null;
    }

    return response;
  } catch (error) {
    console.error('authFetch error:', error);
    window.location.href = '/';
    return null;
  }
};
