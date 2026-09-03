export const logout = () => {
  localStorage.removeItem("roles");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const handleUnauthorized = (response) => {
  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  return response;
};
