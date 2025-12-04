// Pure functional migration logic for config versions
// Handles backward compatibility when config schema changes

import type { ExtensionConfig } from '../config'

/**
 * Pure migration function from old config to new config format
 * Migration adds urlPatterns if missing (backward compatibility)
 */
export const migrateConfig = (oldConfig: any): ExtensionConfig => {
  if (!oldConfig || typeof oldConfig !== 'object') {
    // Return default config if old config is invalid
    return {
      websocketPort: 3333,
      urlPatterns: ['*://app.diagrams.net/*']
    }
  }

  // Check if migration needed (urlPatterns exist)
  if (oldConfig.urlPatterns && Array.isArray(oldConfig.urlPatterns)) {
    return oldConfig as ExtensionConfig
  }

  // Perform migration: add default urlPatterns
  console.info('[config-migration] Migrating config: adding default urlPatterns')
  return {
    ...oldConfig,
    urlPatterns: ['*://app.diagrams.net/*']
  }
}

/**
 * Pure function to validate migrated config integrity
 */
export const validateMigratedConfig = (config: ExtensionConfig): boolean => {
  return (
    typeof config.websocketPort === 'number' &&
    config.websocketPort >= 1024 &&
    config.websocketPort <= 65535 &&
    Array.isArray(config.urlPatterns) &&
    config.urlPatterns.length > 0 &&
    config.urlPatterns.every(pattern => typeof pattern === 'string')
  )
}

/**
 * Apply migration and validate result
 * Returns migrated config or throws on validation failure
 */
export const safeMigrateConfig = (oldConfig: any): ExtensionConfig => {
  const migrated = migrateConfig(oldConfig)

  if (!validateMigratedConfig(migrated)) {
    throw new Error('Config migration failed validation')
  }

  return migrated
}
