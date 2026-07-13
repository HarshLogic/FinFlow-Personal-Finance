import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { ClerkProvider, SignedIn, SignedOut, SignIn, useAuth } from "@clerk/clerk-react";
import { api } from "./api"; 

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function AxiosInterceptor({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken(); 
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => api.interceptors.request.eject(requestInterceptor);
  }, [getToken]);

  return children;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedIn>
        {/* Wrap your App inside the interceptor */}
        <AxiosInterceptor>
          <App />
        </AxiosInterceptor>
      </SignedIn>

      <SignedOut>
        <div style={{ 
          display: "flex", justifyContent: "center", alignItems: "center", 
          minHeight: "100vh", background: "#0D0F14", fontFamily: "'DM Sans',system-ui,sans-serif"
        }}>
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </ClerkProvider>
  </React.StrictMode>
);