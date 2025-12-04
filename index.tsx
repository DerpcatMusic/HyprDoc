import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import './index.css';

// --- Safe Environment Loading ---
const getEnv = (key: string, viteKey: string, fallback: string): string => {
  let val = '';
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      val = import.meta.env[viteKey];
    }
  } catch (e) {}

  if (!val) {
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
          val = process.env[key] || '';
      }
    } catch (e) {}
  }

  // Cleanup
  val = val ? val.trim() : '';
  if (val.length > 1 && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
      val = val.substring(1, val.length - 1);
  }

  // Strict validation
  if (!val || val === '/' || val === 'undefined' || val === 'null' || val === '') {
      return fallback;
  }
  return val;
};

// Configuration with Fallbacks
const DEFAULT_CONVEX_URL = "https://happy-otter-123.convex.cloud";
const CLERK_PUBLISHABLE_KEY = getEnv("CLERK_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY", "pk_test_ZWxlZ2FudC1ncm91cGVyLTY1LmNsZXJrLmFjY291bnRzLmRldiQ");
let CONVEX_URL_RAW = getEnv("CONVEX_URL", "VITE_CONVEX_URL", DEFAULT_CONVEX_URL);

// --- Initialization Logic ---
let convexClient: ConvexReactClient | null = null;
let isOfflineMode = false;

try {
    // Ensure we have a valid URL string before passing to URL constructor inside ConvexReactClient
    if (!CONVEX_URL_RAW || !CONVEX_URL_RAW.startsWith('http')) {
        console.warn(`Invalid CONVEX_URL "${CONVEX_URL_RAW}". Defaulting to Offline Mode.`);
        CONVEX_URL_RAW = DEFAULT_CONVEX_URL;
        isOfflineMode = true;
    }

    // Explicitly check for default URL to set offline flag
    if (CONVEX_URL_RAW === DEFAULT_CONVEX_URL) {
        isOfflineMode = true;
    }

    convexClient = new ConvexReactClient(CONVEX_URL_RAW);
} catch (e) {
    console.error("CRITICAL: Convex Client Init Failed. App will run in Offline Mode.", e);
    // If client init fails, we must be offline.
    // We create a dummy client or just null to prevent crash, 
    // but IS_OFFLINE flag will prevent its usage.
    isOfflineMode = true;
}

// Export the flag for other components
export const IS_OFFLINE = isOfflineMode;

const ConvexClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  
  useEffect(() => {
    // If offline or client failed, do nothing
    if (IS_OFFLINE || !convexClient) return;

    if (isSignedIn) {
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
  }, [getToken, isSignedIn]);

  // If we are offline or client is missing, render children without ConvexProvider
  // The DocumentContext will handle data persistence via LocalStorage
  if (IS_OFFLINE || !convexClient) {
      return <>{children}</>;
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
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);