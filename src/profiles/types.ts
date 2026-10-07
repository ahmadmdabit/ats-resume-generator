/**
 * ResumeProfile — per-language grammar configuration.
 *
 * This module defines the schema for language-specific parsing heuristics.
 * Each profile encapsulates the regex patterns, keyword lists, and label
 * arrays that were previously hardcoded in MarkdownParser and JsonParser.
 *
 * Adding a new language = creating a new profile file + registering it in
 * src/profiles/index.ts. No parser or generator code changes needed.
 */

export interface ResumeProfile {
    /** Section alias map: normalized heading → canonical key (re-exported from locale) */
    sectionAliases: Record<string, string>;

    /** Header field labels for extractHeaderField */
    headerLabels: {
        email: string[];
        phone: string[];
        address: string[];
        website: string[];
        linkedin: string[];
    };

    /** Date patterns for job dates, education dates */
    datePatterns: RegExp[];

    /** Institution keywords for education parsing */
    institutionKeywords: string[];

    /** Job title separator patterns */
    jobTitlePatterns: RegExp[];

    /** Project field labels */
    projectLabels: {
        tech: string[];
        link: string[];
    };

    /** Certification reference labels */
    certReferenceLabels: string[];

    /** Layout heading patterns (for parseLayout) */
    layoutPatterns: {
        date: RegExp;
        reference: RegExp;
        labeled: RegExp;
    };
}

/**
 * Type guard: validates that an unknown value conforms to ResumeProfile.
 * Used for runtime validation when profiles are loaded from external sources.
 */
export function isResumeProfile(value: unknown): value is ResumeProfile {
    if (typeof value !== 'object' || value === null) return false;
    const p = value as Record<string, unknown>;

    return (
        typeof p.sectionAliases === 'object' && p.sectionAliases !== null &&
        typeof p.headerLabels === 'object' && p.headerLabels !== null &&
        Array.isArray(p.datePatterns) &&
        Array.isArray(p.institutionKeywords) &&
        Array.isArray(p.jobTitlePatterns) &&
        typeof p.projectLabels === 'object' && p.projectLabels !== null &&
        Array.isArray(p.certReferenceLabels) &&
        typeof p.layoutPatterns === 'object' && p.layoutPatterns !== null
    );
}
