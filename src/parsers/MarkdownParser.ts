import { marked, Tokens } from 'marked';
import { IResumeParser } from '../core/interfaces.js';
import { ResumeData, ResumeJob, ResumeProject } from '../core/models.js';

export class MarkdownParser implements IResumeParser {
    // Map both English and Turkish headers to internal canonical keys
    private readonly SECTION_MAP: Record<string, string> = {
        'PROFESSIONAL SUMMARY': 'SUMMARY', 'PROFESYONEL ÖZET': 'SUMMARY',
        'TECHNICAL SKILLS': 'SKILLS', 'TEKNİK BECERİLER': 'SKILLS',
        'PROFESSIONAL EXPERIENCE': 'EXPERIENCE', 'PROFESYONEL DENEYİM': 'EXPERIENCE', 'İŞ DENEYİMİ': 'EXPERIENCE',
        'PROJECTS': 'PROJECTS', 'PROJELER': 'PROJECTS',
        'EDUCATION': 'EDUCATION', 'EĞİTİM': 'EDUCATION',
        'CERTIFICATIONS': 'CERTIFICATIONS', 'SERTİFİKALAR': 'CERTIFICATIONS',
        'LANGUAGES': 'LANGUAGES', 'DİLLER': 'LANGUAGES'
    };

    private stripInline(text: string): string {
        return text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim();
    }

    parse(input: string): ResumeData {
        const tokens = marked.lexer(input);
        const data: ResumeData = {
            header: { name: '', email: '', phone: '', address: '', website: '' },
            summary: [], experienceOverview: '', skills: [], experience: [], projectsIntro: '', projects: [],
            education: { degree: '', date: '', institution: '' }, certifications: [], languages: []
        };

        let section = 'HEADER';
        let currentJob: ResumeJob | null = null;
        let currentProject: ResumeProject | null = null;

        // Buffer for Education section to handle order-independent parsing
        let eduParagraphs: string[] = [];
        let eduInstitutionFromList: string = '';

        const saveJob = () => { if (currentJob) { data.experience.push(currentJob); currentJob = null; } };
        const saveProject = () => { if (currentProject) { data.projects.push(currentProject); currentProject = null; } };

        const finalizeEducation = () => {
            if (eduParagraphs.length === 0 && !eduInstitutionFromList) return;

            // 1. Extract Date (most reliable pattern)
            const dateRegex = /^\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)$/i;
            const dateIdx = eduParagraphs.findIndex(p => dateRegex.test(p));
            if (dateIdx !== -1) {
                data.education.date = eduParagraphs[dateIdx];
                eduParagraphs.splice(dateIdx, 1);
            }

            // 2. Check if Institution was provided as a list item (Common in English template)
            const hasListInstitution = Boolean(eduInstitutionFromList);
            if (hasListInstitution) {
                data.education.institution = eduInstitutionFromList;
            }

            // 3. Assign remaining paragraphs based on structural context
            if (hasListInstitution) {
                // If institution was a list, remaining paragraphs are strictly [Overview, Degree] or just [Degree]
                if (eduParagraphs.length === 2) {
                    data.education.overview = eduParagraphs[0];
                    data.education.degree = eduParagraphs[1];
                } else if (eduParagraphs.length === 1) {
                    data.education.degree = eduParagraphs[0];
                }
            } else {
                // If institution was a paragraph (Common in Turkish template), we have up to 3 paragraphs: [Overview, Degree, Institution]
                if (eduParagraphs.length === 3) {
                    data.education.overview = eduParagraphs[0];
                    data.education.degree = eduParagraphs[1];
                    data.education.institution = eduParagraphs[2];
                } else if (eduParagraphs.length === 2) {
                    // Could be [Overview, Degree] OR [Degree, Institution]
                    // Heuristic: Institution usually contains "University", "College", "Üniversite", "Fakülte"
                    const isInstitution = (text: string) => /(University|College|Institute|School|Üniversite|Fakülte|Lise)/i.test(text);
                    if (isInstitution(eduParagraphs[1])) {
                        data.education.degree = eduParagraphs[0];
                        data.education.institution = eduParagraphs[1];
                    } else {
                        data.education.overview = eduParagraphs[0];
                        data.education.degree = eduParagraphs[1];
                    }
                } else if (eduParagraphs.length === 1) {
                    data.education.degree = eduParagraphs[0];
                }
            }

            // Reset buffer
            eduParagraphs = [];
            eduInstitutionFromList = '';
        };

        for (const token of tokens) {
            const text = (token.type === 'heading' || token.type === 'paragraph' || token.type === 'text') ? token.text.trim() : '';
            const rawText = (token as any).raw?.trim() || '';

            // Check for section headers using the map
            // We check both the cleaned text and the raw text to catch variations
            const upperText = text.toUpperCase();
            const upperRawText = rawText.toUpperCase();

            if (this.SECTION_MAP[upperText] || this.SECTION_MAP[upperRawText]) {
                saveJob();
                saveProject();
                if (section === 'EDUCATION') finalizeEducation(); // Finalize before switching
                section = this.SECTION_MAP[upperText] || this.SECTION_MAP[upperRawText];
                continue;
            }

            if (token.type === 'list') {
                const listItems = token.items.map((item: Tokens.ListItem) => item.text.trim()) as string[];

                if (section === 'SKILLS') {
                    listItems.forEach((item: string) => {
                        const clean = this.stripInline(item);
                        // Matches "Category: Item" or "Kategori: Öğe"
                        const match = clean.match(/^([^:]+):\s*(.+)/);
                        if (match) data.skills.push({ category: match[1].trim(), items: match[2].trim() });
                    });
                } else if (section === 'EXPERIENCE' && currentJob) {
                    currentJob.bullets.push(...listItems.map(i => this.stripInline(i)));
                } else if (section === 'PROJECTS' && currentProject) {
                    listItems.forEach((item: string) => {
                        // Support both English "Technologies:" and Turkish "Teknolojiler:"
                        if (/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}/i.test(item)) {
                            currentProject!.tech = item.replace(/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}\s*/i, '').trim();
                        } else {
                            currentProject!.bullets.push(this.stripInline(item));
                        }
                    });
                } else if (section === 'CERTIFICATIONS') {
                    listItems.forEach((item: string) => {
                        const clean = this.stripInline(item);
                        // Support both English "Reference" and Turkish "Referans"
                        const certLinkMatch = clean.match(/(.+?)\s*\[(?:Reference|Referans)\]\(([^)]+)\)/i);
                        data.certifications.push(certLinkMatch
                            ? { text: certLinkMatch[1].trim().replace(/\s*-\s*$/, ''), link: certLinkMatch[2].trim() }
                            : { text: clean });
                    });
                } else if (section === 'LANGUAGES') {
                    data.languages.push(...listItems.map(i => this.stripInline(i)));
                } else if (section === 'EDUCATION') {
                    if (!eduInstitutionFromList) {
                        eduInstitutionFromList = this.stripInline(listItems[0] || '');
                    }
                }
                continue;
            }

            if (['paragraph', 'text', 'heading'].includes(token.type)) {
                const cleanText = this.stripInline(text);

                switch (section) {
                    case 'HEADER':
                        if (!data.header.name && !text.includes(':')) {
                            data.header.name = cleanText;
                        } else {
                            // Support English and Turkish labels
                            // E-mail / E-posta
                            const emailMatch = text.match(/(?:E-mail|E-posta):\*{0,2}\s*(\S+)/i);
                            // Phone / Telefon
                            const phoneMatch = text.match(/(?:Phone|Telefon):\*{0,2}\s*([^\n]+)/i);
                            // Address / Adres
                            const addressMatch = text.match(/(?:Address|Adres):\*{0,2}\s*([^\n]+)/i);
                            // Website / Web Sitesi
                            const websiteMatch = text.match(/(?:Website|Web Sitesi|Web sitesi):\*{0,2}\s*([^\n]+)/i);

                            if (emailMatch) data.header.email = emailMatch[1].trim();
                            if (phoneMatch) data.header.phone = phoneMatch[1].trim();
                            if (addressMatch) data.header.address = addressMatch[1].trim();
                            if (websiteMatch) data.header.website = websiteMatch[1].trim();
                        }
                        break;
                    case 'SUMMARY':
                        data.summary.push(cleanText);
                        break;
                    case 'EXPERIENCE':
                        // Support "Present", "Günümüz", "Devam ediyor"
                        // Using /i flag for case-insensitive matching which handles Turkish chars better than toLowerCase()    
                        if (cleanText.match(/^\d{2}\/\d{4}\s*[–-]\s*(?:Present|Günümüz|Devam\s+ediyor|\d{2}\/\d{4})$/i)) {
                            if (currentJob) { currentJob.date = cleanText; }
                        } else {
                            // Match: Title - Company, Location
                            const jobMatch = cleanText.match(/^(.+)\s*-\s*(.+?),\s*(.+)$/);
                            if (jobMatch) {
                                saveJob();
                                currentJob = {
                                    title: jobMatch[1].trim(),
                                    company: jobMatch[2].trim(),
                                    location: jobMatch[3].trim(),
                                    date: '',
                                    bullets: []
                                };
                            } else if (currentJob) {
                                currentJob.bullets.push(cleanText);
                            } else if (!data.experienceOverview) {
                                data.experienceOverview = cleanText;
                            }
                        }
                        break;
                    case 'PROJECTS':
                        if (!data.projectsIntro) {
                            // Store the FULL paragraph text (links will be converted by generators).
                            // Do NOT strip to just link text.
                            data.projectsIntro = text;
                        } else if (/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}/i.test(text)) {
                            if (currentProject) currentProject.tech = text.replace(/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}\s*/i, '').trim();
                        } else {
                            const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (linkMatch) {
                                saveProject();
                                currentProject = { title: linkMatch[1].trim(), link: linkMatch[2].trim(), tech: '', bullets: [] };
                            } else if (currentProject && !currentProject.tech) {
                                currentProject.subtitle = cleanText;
                            } else if (currentProject) {
                                currentProject.bullets.push(cleanText);
                            }
                        }
                        break;
                    case 'EDUCATION':
                        // Buffer paragraphs to be processed intelligently at the end of the section
                        eduParagraphs.push(cleanText);
                        break;
                    case "CERTIFICATIONS": {
                        // FIX: Handle paragraph-based certs with links (e.g., "- **Cert Name** - [Reference](url)")
                        const cleanCert = this.stripInline(text);
                        // Regex handles optional bold markers around name, optional dash, and [Reference|Referans](link)
                        const certLinkMatch = cleanCert.match(/^\s*-?\s*\*{0,2}(.+?)\*{0,2}\s*-\s*\[(?:Reference|Referans)\]\(([^)]+)\)/i);
                        if (certLinkMatch) {
                            data.certifications.push({ text: certLinkMatch[1].trim(), link: certLinkMatch[2].trim() });
                        } else {
                            // Fallback for plain text certs
                            data.certifications.push({ text: cleanCert.replace(/^-\s*/, "") });
                        }
                        break;
                    }
                    case "LANGUAGES": {
                        // FIX: Handle paragraph-based languages (e.g., "- **Turkish** (Professional)")
                        // Strip leading dash/bullet if present
                        const langText = cleanText.replace(/^-\s*/, "");
                        if (langText) data.languages.push(langText);
                        break;
                    }
                }
            }
        }
        saveJob();
        saveProject();
        if (section === 'EDUCATION') finalizeEducation(); // Finalize if file ends on Education
        console.log('PARSING RESULT:', JSON.stringify(data, null, 2));
        return data;
    }
}