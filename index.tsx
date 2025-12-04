
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AlertTriangle, WifiOff } from 'lucide-react';

// --- Safe Environment Loading ---
// Helper to get env vars from either Vite (import.meta.env) or Node/Webpack (process.env)
const getEnv = (key: string, viteKey: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      const val = import.meta.env[viteKey];
      // Filter out common invalid placeholder values
      if (val && val !== '/' && val !== 'undefined' && val !== 'null') return val;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        const val = process.env[key];
        if (val && val !== '/' && val !== 'undefined' && val !== 'null') return val;
    }
  } catch (e) {}

  return fallback;
};

// Configuration with Fallbacks
const CLERK_PUBLISHABLE_KEY = getEnv("CLERK_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY", "pk_test_ZWxlZ2FudC1ncm91cGVyLTY1LmNsZXJrLmFjY291bnRzLmRldiQ");
// Default mock URL if environment is missing - ensures app doesn't crash on init
let CONVEX_URL_RAW = getEnv("CONVEX_URL", "VITE_CONVEX_URL", "https://happy-otter-123.convex.cloud");

let convexClient: ConvexReactClient | null = null;
let initError: string | null = null;

// Strict URL Validation
try {
    if (!CONVEX_URL_RAW || !CONVEX_URL_RAW.startsWith('http')) {
        throw new Error(`Invalid CONVEX_URL: "${CONVEX_URL_RAW}". Must be an absolute URL starting with http/https.`);
    }
    convexClient = new ConvexReactClient(CONVEX_URL_RAW);
} catch (e: any) {
    console.error("CRITICAL: Convex Client Init Failed", e);
    initError = e.message || "Failed to initialize database connection";
    // Fallback to null client, we will handle this in the provider wrapper
}

if (!CLERK_PUBLISHABLE_KEY) {
  initError = "Missing Clerk Publishable Key";
}

const ConvexClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!convexClient) return;
    
    if (isSignedIn) {
      // Configure Convex Auth with Clerk
      convexClient.setAuth(async () => {
        try {
          return await getToken({ template: "convex" });
        } catch (error) {
          console.error("Auth Error: Failed to retrieve Clerk token.", error);
          return null;
        }
      });
    } else {
      convexClient.clearAuth();
    }
    setIsReady(true);
  }, [getToken, isSignedIn]);

  if (!convexClient) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
              <div className="max-w-md bg-white border-2 border-red-500 p-6 shadow-xl">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                      <AlertTriangle size={32} />
                      <h1 className="text-xl font-bold uppercase">Configuration Error</h1>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                      The application cannot connect to the backend. This is likely a missing or invalid environment variable.
                  </p>
                  <div className="bg-zinc-100 p-3 text-xs font-mono border rounded overflow-x-auto">
                      {initError || "Unknown Error"}
                  </div>
              </div>
          </div>
      );
  }

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
