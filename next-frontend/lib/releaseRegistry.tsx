import { FC } from "react";

/**
 * Central registry of all available releases.
 * Add new releases here to make them available in the admin portal.
 */
const RELEASE_REGISTRY: Record<string, FC> = {};

export function getAvailableReleases() {
  return Object.entries(RELEASE_REGISTRY);
}

export function getAvailableReleaseVersions() {
  return Object.keys(RELEASE_REGISTRY);
}

export function getReleaseComponent(version: string): FC {
  const release = RELEASE_REGISTRY[version];
  if (!release) {
    throw new Error(`Release ${version} not found`);
  }
  return release;
}
