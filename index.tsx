import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from "convex/react";

// --- Safe Environment Loading ---
// Helper to get env vars from either Vite (import.meta.env) or Node/Webpack (process.env)
const getEnv = (key: string, viteKey: string, fallback: string): string => {
  // 1. Try Vite
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) {}

  // 2. Try Process
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return fallback;
};

// Configuration with Fallbacks
const CLERK_PUBLISHABLE_KEY = getEnv("CLERK_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY", "pk_test_ZWxlZ2FudC1ncm91cGVyLTY1LmNsZXJrLmFjY291bnRzLmRldiQ");
const CONVEX_URL_RAW = getEnv("CONVEX_URL", "VITE_CONVEX_URL", "https://happy-otter-123.convex.cloud");

// Validate Convex URL to prevent "URL constructor" crash
let convexClient: ConvexReactClient;
try {
  // Ensure the URL is valid before instantiating
  new URL(CONVEX_URL_RAW); 
  convexClient = new ConvexReactClient(CONVEX_URL_RAW);
} catch (e) {
  console.error("Invalid CONVEX_URL:", CONVEX_URL_RAW);
  // Fallback to a dummy valid URL to prevent app crash, though data won't load
  convexClient = new ConvexReactClient("https://failed-init.convex.cloud");
}

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key.");
}

const ConvexClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      // Configure Convex Auth with Clerk
      convexClient.setAuth(async () => await getToken({ template: "convex" }) || null);
    } else {
      convexClient.clearAuth();
    }
  }, [getToken, isSignedIn]);

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);