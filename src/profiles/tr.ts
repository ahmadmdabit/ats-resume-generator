/**
 * Turkish profile — grammar configuration for Turkish output.
 *
 * Parsing patterns handle both English and Turkish input (the parser is
 * language-agnostic for input). Output headings are Turkish.
 */

import { ResumeProfile } from './types.js';
import { getLocale } from '../i18n/locales.js';

export const trProfile: ResumeProfile = {
    sectionAliases: getLocale('tr').sectionAliases,

    headerLabels: {
        email: ['E-posta', 'E-mail', 'Email'],
        phone: ['Telefon', 'Phone'],
        address: ['Adres', 'Address'],
        website: ['Web Sitesi', 'Website'],
        linkedin: ['LinkedIn', 'Linkedin'],
    },

    datePatterns: [
        /^\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Günümüz|Devam\s+ediyor|Present|Current)$/i,
        /^\d{4}\.?$/,
        /(\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Günümüz|Devam\s+ediyor|Present|Current)|\b(?:19|20)\d{2}\b\.?)\s*$/i,
    ],

    institutionKeywords: [
        'Üniversite', 'Fakülte', 'Lise',
        'University', 'College', 'Institute', 'School',
    ],

    jobTitlePatterns: [
        /^(.+?)\s+[-–]\s+(.+?)\s+[-–]\s+(.+)$/,
        /^(.+?)\s+[-–]\s+(.+?),\s*(.+)$/,
    ],

    projectLabels: {
        tech: ['Teknolojiler', 'Technologies'],
        link: ['Bağlantı', 'Link'],
    },

    certReferenceLabels: ['Referans', 'Reference'],

    layoutPatterns: {
        date: /^\*{0,2}\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Günümüz|Devam\s+ediyor|Present|Current)\*{0,2}$/i,
        reference: /^(?:\*{0,2})?(?:Referans|Reference):/i,
        labeled: /^(?:Bağlantı|Link|Teknolojiler|Technologies):/i,
    },
};
