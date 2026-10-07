/**
 * Profile registry — maps language codes to ResumeProfile instances.
 *
 * Adding a new language:
 * 1. Create a new profile file (e.g., `de.ts`)
 * 2. Add an entry to the `profiles` record below
 * 3. Add the language to `src/i18n/locales.ts`
 *
 * No parser or generator code changes needed.
 */

import { ResumeProfile } from './types.js';
import { enProfile } from './en.js';
import { trProfile } from './tr.js';

const profiles: Record<string, ResumeProfile> = {
    en: enProfile,
    tr: trProfile,
};

/**
 * Returns the profile for the given language code.
 * Falls back to English if the language is not registered.
 */
export function getProfile(lang: string): ResumeProfile {
    return profiles[lang] ?? profiles.en;
}

/**
 * Returns all registered language codes.
 */
export function getAvailableLanguages(): string[] {
    return Object.keys(profiles);
}
