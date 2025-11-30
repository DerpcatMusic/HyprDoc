/**
 * @fileoverview External integration type definitions
 * @description Types for third-party service integrations and connections
 */

/**
 * Integration type categories
 * Defines different types of external services that can be integrated
 */
export type IntegrationType = 'crm' | 'storage' | 'sso';

/**
 * External integration interface
 * Represents a connection to an external service or platform
 */
export interface Integration {
  /** Unique integration identifier */
  id: string;
  /** Integration name */
  name: string;
  /** Type of integration */
  type: IntegrationType;
  /** Whether the integration is currently connected */
  connected: boolean;
  /** Integration icon (icon name or URL) */
  icon?: string;
}