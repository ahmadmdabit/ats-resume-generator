/**
 * Single source of truth for all localization data.
 *
 * This module replaces the 4+ divergent copies of section headings,
 * field labels, and section aliases that were previously scattered
 * across TxtGenerator, MarkdownGenerator, DocxGenerator, and MarkdownParser.
 *
 * TypeScript module (not JSON) — embedded by `bun build --compile`,
 * no `resolveJsonModule` change, no runtime fs reads.
 */

export interface LocaleBundle {
    /** Section headings: canonical English → localized */
    sectionHeadings: Record<string, string>;
    /** Field labels for header contact info */
    fieldLabels: {
        email: string;
        phone: string;
        address: string;
        website: string;
        linkedin: string;
    };
    /** Section alias map: normalized heading → canonical key */
    sectionAliases: Record<string, string>;
    /** Turkish uppercase heading set (for TxtGenerator) */
    trHeadingsUpper: Set<string>;
}

const en: LocaleBundle = {
    sectionHeadings: {
        'PROFESSIONAL SUMMARY': 'PROFESSIONAL SUMMARY',
        'TECHNICAL SKILLS': 'TECHNICAL SKILLS',
        'PROFESSIONAL EXPERIENCE': 'PROFESSIONAL EXPERIENCE',
        'PROJECTS': 'PROJECTS',
        'EDUCATION': 'EDUCATION',
        'CERTIFICATIONS': 'CERTIFICATIONS',
        'LANGUAGES': 'LANGUAGES',
    },
    fieldLabels: {
        email: 'E-mail',
        phone: 'Phone',
        address: 'Address',
        website: 'Website',
        linkedin: 'LinkedIn',
    },
    sectionAliases: {
        'PROFESSIONAL SUMMARY': 'SUMMARY',
        'PROFESYONEL OZET': 'SUMMARY',
        'TECHNICAL SKILLS': 'SKILLS',
        'TEKNIK BECERILER': 'SKILLS',
        'PROFESSIONAL EXPERIENCE': 'EXPERIENCE',
        'PROFESYONEL DENEYIM': 'EXPERIENCE',
        'IS DENEYIMI': 'EXPERIENCE',
        'PROJECTS': 'PROJECTS',
        'PROJELER': 'PROJECTS',
        'EDUCATION': 'EDUCATION',
        'EGITIM': 'EDUCATION',
        'CERTIFICATIONS': 'CERTIFICATIONS',
        'SERTIFIKALAR': 'CERTIFICATIONS',
        'SERTIFIKALAR VE LISANSLAR': 'CERTIFICATIONS',
        'LANGUAGES': 'LANGUAGES',
        'DILLER': 'LANGUAGES',
    },
    trHeadingsUpper: new Set([
        'PROFESYONEL ÖZET',
        'TEKNİK BECERİLER',
        'PROFESYONEL DENEYİM',
        'PROJELER',
        'EĞİTİM',
        'SERTİFİKALAR',
        'DİLLER',
    ]),
};

const tr: LocaleBundle = {
    sectionHeadings: {
        'PROFESSIONAL SUMMARY': 'PROFESYONEL ÖZET',
        'TECHNICAL SKILLS': 'TEKNİK BECERİLER',
        'PROFESSIONAL EXPERIENCE': 'PROFESYONEL DENEYİM',
        'PROJECTS': 'PROJELER',
        'EDUCATION': 'EĞİTİM',
        'CERTIFICATIONS': 'SERTİFİKALAR',
        'LANGUAGES': 'DİLLER',
    },
    fieldLabels: {
        email: 'E-posta',
        phone: 'Telefon',
        address: 'Adres',
        website: 'Web Sitesi',
        linkedin: 'LinkedIn',
    },
    sectionAliases: en.sectionAliases, // Same alias map for both languages
    trHeadingsUpper: en.trHeadingsUpper, // Same set for both languages
};

export const locales: Record<string, LocaleBundle> = { en, tr };

export function getLocale(lang: string): LocaleBundle {
    return locales[lang] ?? locales.en;
}
