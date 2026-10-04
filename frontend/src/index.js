import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { api } from "./api"; 

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "dummy_client_id_for_dev";

function AxiosInterceptor({ children }) {
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(requestInterceptor);
  }, []);

  return children;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AxiosInterceptor>
          <App />
        </AxiosInterceptor>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);