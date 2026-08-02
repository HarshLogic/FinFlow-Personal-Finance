import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { ClerkProvider, useAuth } from "@clerk/clerk-react"; // REMOVED SignedIn from here
import { api } from "./api"; 

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function AxiosInterceptor({ children }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      if (isSignedIn) {
        const token = await getToken(); 
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => api.interceptors.request.eject(requestInterceptor);
  }, [getToken, isSignedIn]);

  return children;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AxiosInterceptor>
        <App />
      </AxiosInterceptor>
    </ClerkProvider>
  </React.StrictMode>
);