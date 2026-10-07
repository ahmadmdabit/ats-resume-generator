/**
 * English profile — grammar configuration for English output.
 *
 * Parsing patterns handle both English and Turkish input (the parser is
 * language-agnostic for input). Output headings are English.
 */

import { ResumeProfile } from './types.js';
import { getLocale } from '../i18n/locales.js';

export const enProfile: ResumeProfile = {
    sectionAliases: getLocale('en').sectionAliases,

    headerLabels: {
        email: ['E-mail', 'E-posta', 'Email'],
        phone: ['Phone', 'Telefon'],
        address: ['Address', 'Adres'],
        website: ['Website', 'Web Sitesi'],
        linkedin: ['LinkedIn', 'Linkedin'],
    },

    datePatterns: [
        /^\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)$/i,
        /^\d{4}\.?$/,
        /(\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)|\b(?:19|20)\d{2}\b\.?)\s*$/i,
    ],

    institutionKeywords: [
        'University', 'College', 'Institute', 'School',
        'Üniversite', 'Fakülte', 'Lise',
    ],

    jobTitlePatterns: [
        /^(.+?)\s+[-–]\s+(.+?)\s+[-–]\s+(.+)$/,
        /^(.+?)\s+[-–]\s+(.+?),\s*(.+)$/,
    ],

    projectLabels: {
        tech: ['Technologies', 'Teknolojiler'],
        link: ['Link', 'Bağlantı'],
    },

    certReferenceLabels: ['Reference', 'Referans'],

    layoutPatterns: {
        date: /^\*{0,2}\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)\*{0,2}$/i,
        reference: /^(?:\*{0,2})?(?:Reference|Referans):/i,
        labeled: /^(?:Link|Bağlantı|Technologies|Teknolojiler):/i,
    },
};
