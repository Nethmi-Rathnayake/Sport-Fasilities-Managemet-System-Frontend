import axios from "axios";

// Central axios instance for talking to the Laravel backend.
// withCredentials is REQUIRED: the OTP -> registration flow relies on the
// Laravel session cookie, which only travels when credentials are enabled
// (and the backend has CORS supports_credentials=true).
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export default api;
