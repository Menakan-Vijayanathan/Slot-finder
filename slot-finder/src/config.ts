// This file contains configuration values that would normally come from environment variables
// It's committed to version control for development purposes

export const config = {
  googleClientId: '680531297280-i7fm04gn69vsd6n3qfkrrea4c23grggb.apps.googleusercontent.com'
} as const;

export type Config = typeof config;
