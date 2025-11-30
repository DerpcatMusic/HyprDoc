/**
 * @fileoverview Configuration and settings type definitions
 * @description Types for user settings, document settings, and system configuration
 */

import type { GlobalPaymentSettings, PageMargins } from './block';

/**
 * User global settings and preferences
 * Configuration for user account and preferences
 */
export interface UserGlobalSettings {
  /** API keys for external services */
  apiKeys?: {
    /** OpenAI API key */
    openai?: string;
    /** Stripe publishable key */
    stripePublishable?: string;
    /** Google Maps API key */
    googleMaps?: string;
  };
  /** User profile information */
  profile?: {
    /** Company name */
    companyName?: string;
    /** Company logo URL */
    logoUrl?: string;
  };
}