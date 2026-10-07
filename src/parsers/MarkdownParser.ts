import { marked, Tokens } from 'marked';
import { ILayoutParser, IResumeParser } from '../core/interfaces.js';
import { LayoutLine, ResumeData, ResumeJob, ResumeLayout, ResumeProject } from '../core/models.js';
import { getLocale } from '../i18n/locales.js';

export class MarkdownParser implements IResumeParser, ILayoutParser {
    constructor(private readonly verbose: boolean = false) {}
    // Section alias map from shared locale module.
    // Keys are pre-normalized (Turkish chars folded, uppercased) so that
    // Title Case headings ("Teknik Beceriler") match reliably.
    private readonly SectionMap: Record<string, string> = getLocale('en').sectionAliases;

    private stripInline(text: string): string {
        return text
            .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // bold / italic
            .replace(/`([^`]+)`/g, '$1')               // inline code
            .trim();
    }

    // Turkish-aware uppercasing. JS toUpperCase() maps 'i' -> 'I' (not 'İ'),
    // so 'Teknik Beceriler' becomes 'TEKNIK BECERILER' and never matches the
    // 'TEKNİK BECERİLER' map key. Normalize both sides before comparing.
    private normalizeHeader(text: string): string {
        return text
            .replace(/İ/g, 'I').replace(/ı/g, 'i')
            .replace(/Ş/g, 'S').replace(/ş/g, 's')
            .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
            .replace(/Ü/g, 'U').replace(/ü/g, 'u')
            .replace(/Ö/g, 'O').replace(/ö/g, 'o')
            .replace(/Ç/g, 'C').replace(/ç/g, 'c')
            .toUpperCase();
    }

    // Extracts a labeled field value from a header line. Header lines may pack
    // multiple fields separated by " - " and/or soft line breaks (marked keeps
    // trailing-double-space breaks as "\n" inside one paragraph token).
    private extractHeaderField(text: string, labels: string[]): string {
        const labelAlt = labels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        // Value runs until the next " - <Label>:" or a line break followed by "<Label>:" or end.
        const re = new RegExp(
            `(?:${labelAlt}):\\*{0,2}\\s*([\\s\\S]+?)(?=\\s+-\\s+\\*{0,2}[^:\\n]+:|\\s*\\n\\s*\\*{0,2}[^:\\n]+:|$)`,
            'i'
        );
        const m = text.match(re);
        return m ? m[1].replace(/\s+/g, ' ').trim() : '';
    }

    // -----------------------------------------------------------------------
    // Layout parsing — describes HOW the source was laid out.
    //
    // This is deliberately independent of parse(): it walks the raw source
    // line by line rather than the marked token stream, because tokens have
    // already lost the layout facts we need (which fields shared a line,
    // where indentation sat, whether a blank line separated entries).
    //
    // The transformation is mechanical: remove Markdown syntax, change nothing
    // else. H2 section headings are uppercased; every other line keeps its
    // original text, grouping, indentation, and blank lines.
    // -----------------------------------------------------------------------
    parseLayout(input: string): ResumeLayout {
        const lines: LayoutLine[] = [];
        const raw = input.replace(/\r\n/g, '\n').split('\n');

        let inHeader = true;

        for (const source of raw) {
            // Preserve blank lines verbatim.
            if (source.trim() === '') {
                lines.push({ kind: 'blank', text: '', indent: 0 });
                continue;
            }

            const indent = source.length - source.trimStart().length;
            // Preserve trailing spaces (Markdown soft-break: "  \n" = two trailing spaces).
            // Do NOT call trimEnd() — it would strip the soft-break marker.
            const trimmed = source;

            // H1 — document title
            if (/^#\s+/.test(trimmed)) {
                lines.push({ kind: 'title', text: trimmed, indent: 0 });
                continue;
            }

            // H2 — section heading, raw text (MarkdownGenerator emits verbatim;
            // TxtGenerator uppercases for .txt output)
            if (/^##\s+/.test(trimmed)) {
                inHeader = false;
                lines.push({ kind: 'section', text: trimmed, indent: 0 });
                continue;
            }

            // H3 — entry title (job / project / education), source case
            if (/^###\s+/.test(trimmed)) {
                lines.push({ kind: 'entry', text: trimmed, indent: 0 });
                continue;
            }

            // Header field lines — may pack several fields on one line.
            if (inHeader && /^\*{0,2}[^:\n]+:\*{0,2}/.test(trimmed)) {
                lines.push({ kind: 'contact', text: trimmed, indent: 0 });
                continue;
            }

            // Indented "Reference: url" line (certifications)
            if (indent > 0 && /^(?:\*{0,2})?(?:Reference|Referans):/i.test(trimmed)) {
                lines.push({ kind: 'reference', text: trimmed, indent });
                continue;
            }

            // List items
            if (/^[-*+]\s+/.test(trimmed)) {
                const body = trimmed.replace(/^[-*+]\s+/, '');
                // "- Link: url" / "- Technologies: …" keep their label
                const kind = /^(?:Link|Bağlantı|Technologies|Teknolojiler):/i.test(body) ? 'labeled' : 'bullet';
                lines.push({ kind, text: `- ${body}`, indent: 0 });
                continue;
            }

            // Date / year line
            if (/^\*{0,2}\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)\*{0,2}$/i.test(trimmed)
                || /^\*{0,2}(?:19|20)\d{2}\.?$/i.test(trimmed)) {
                lines.push({ kind: 'date', text: trimmed, indent: 0 });
                continue;
            }

            // Anything else is body text
            lines.push({ kind: 'plain', text: trimmed, indent: 0 });
        }

        return { lines };
    }

    parse(input: string): ResumeData {
        const tokens = marked.lexer(input);
        const data: ResumeData = {
            header: { name: '', email: '', phone: '', address: '', website: '', linkedin: '' },
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
            // 1. Extract Date (most reliable pattern) — may arrive as a paragraph or a list item
            const dateRegex = /^\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)$/i;
            const dateIdx = eduParagraphs.findIndex(p => dateRegex.test(p));
            if (dateIdx !== -1) {
                data.education.date = eduParagraphs[dateIdx];
                eduParagraphs.splice(dateIdx, 1);
            }
            // A bare year paragraph (e.g. "2014") is the date when no range was found
            if (!data.education.date) {
                const yearIdx = eduParagraphs.findIndex(p => /^\d{4}\.?$/.test(p.trim()));
                if (yearIdx !== -1) {
                    data.education.date = eduParagraphs[yearIdx].trim().replace(/\.$/, '');
                    eduParagraphs.splice(yearIdx, 1);
                }
            }

            if (eduParagraphs.length === 0 && !eduInstitutionFromList) return;

            // 2. Check if Institution was provided as a list item (Common in English template)
            const hasListInstitution = Boolean(eduInstitutionFromList);
            if (hasListInstitution) {
                data.education.institution = eduInstitutionFromList;
            }

            // 3. Assign remaining paragraphs based on structural context
            // A degree captured from a "###" heading must not be overwritten by the buffer.
            const degreeFromHeading = Boolean(data.education.degree);
            if (hasListInstitution) {
                // If institution was a list, remaining paragraphs are strictly [Overview, Degree] or just [Degree]
                if (eduParagraphs.length === 2) {
                    data.education.overview = eduParagraphs[0];
                    if (!degreeFromHeading) data.education.degree = eduParagraphs[1];
                } else if (eduParagraphs.length === 1) {
                    if (!degreeFromHeading) data.education.degree = eduParagraphs[0];
                }
            } else {
                // If institution was a paragraph (Common in Turkish template), we have up to 3 paragraphs: [Overview, Degree, Institution]
                if (eduParagraphs.length === 3) {
                    data.education.overview = eduParagraphs[0];
                    if (!degreeFromHeading) data.education.degree = eduParagraphs[1];
                    data.education.institution = eduParagraphs[2];
                } else if (eduParagraphs.length === 2) {
                    // Could be [Overview, Degree] OR [Degree, Institution]
                    // Heuristic: Institution usually contains "University", "College", "Üniversite", "Fakülte"
                    const isInstitution = (text: string) => /(University|College|Institute|School|Üniversite|Fakülte|Lise)/i.test(text);
                    if (isInstitution(eduParagraphs[1])) {
                        if (!degreeFromHeading) data.education.degree = eduParagraphs[0];
                        data.education.institution = eduParagraphs[1];
                    } else {
                        data.education.overview = eduParagraphs[0];
                        if (!degreeFromHeading) data.education.degree = eduParagraphs[1];
                    }
                } else if (eduParagraphs.length === 1) {
                    if (!degreeFromHeading) data.education.degree = eduParagraphs[0];
                }
            }

            // Reset buffer
            eduParagraphs = [];
            eduInstitutionFromList = '';
        };

        // Splits a single-line education entry such as
        // "University of Aleppo - Faculty of Electrical and Electronics Engineering - Aleppo, Syria - 2014."
        // into institution / detail / date parts. Returns null when the line is not such a record.
        // `detail` carries the remaining middle segments (faculty, city) so no source text is lost.
        const parseInlineEducation = (line: string): { institution: string; detail: string; date: string } | null => {
            const dateMatch = line.match(/(\d{2}\/\d{4}\s*[–-]\s*(?:\d{2}\/\d{4}|Present|Günümüz|Devam\s+ediyor|Current)|\b(?:19|20)\d{2}\b\.?)\s*$/i);
            if (!dateMatch) return null;
            const withoutDate = line.slice(0, dateMatch.index).replace(/\s*[-–]\s*$/, '').trim();
            if (!withoutDate) return null;

            const parts = withoutDate.split(/\s+[-–]\s+/).map(p => p.trim()).filter(Boolean);
            if (parts.length === 0) return null;

            const isInstitution = (text: string) => /(University|College|Institute|School|Üniversite|Fakülte|Lise)/i.test(text);
            let institution = '';
            let detail = '';
            if (isInstitution(parts[0])) {
                institution = parts[0];
                detail = parts.slice(1).join(' - ');
            } else {
                detail = parts[0];
                institution = parts.slice(1).join(' - ');
            }
            return { institution, detail, date: dateMatch[0].trim().replace(/\.$/, '') };
        };

        for (const token of tokens) {
            const text = (token.type === 'heading' || token.type === 'paragraph' || token.type === 'text') ? token.text.trim() : '';
            const rawText = (token as any).raw?.trim() || '';

            // Check for section headers using the map
            // We check both the cleaned text and the raw text to catch variations
            const upperText = this.normalizeHeader(text);
            const upperRawText = this.normalizeHeader(rawText);

            if (this.SectionMap[upperText] || this.SectionMap[upperRawText]) {
                saveJob();
                saveProject();
                if (section === 'EDUCATION') finalizeEducation(); // Finalize before switching
                section = this.SectionMap[upperText] || this.SectionMap[upperRawText];
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
                        } else if (/^\*{0,2}(?:Link|Bağlantı):\*{0,2}/i.test(item)) {
                            // Current format: "- **Link:** https://..." list item
                            currentProject!.link = item.replace(/^\*{0,2}(?:Link|Bağlantı):\*{0,2}\s*/i, '').trim();
                        } else if (/^https?:\/\/\S+$/.test(this.stripInline(item))) {
                            // Generated .md emits the project URL as a bare list item
                            currentProject!.link = this.stripInline(item);
                        } else {
                            currentProject!.bullets.push(this.stripInline(item));
                        }
                    });
                } else if (section === 'CERTIFICATIONS') {
                    listItems.forEach((item: string) => {
                        // A list item may pack the cert and its "Reference: url" onto one
                        // string joined by a soft line break (marked keeps trailing-double-space
                        // breaks as "\n"). Split those apart before matching.
                        const segments = item.split(/\n+/).map(s => s.trim()).filter(Boolean);
                        for (const seg of segments) {
                            const clean = this.stripInline(seg);
                            // Support both English "Reference" and Turkish "Referans"
                            const certLinkMatch = clean.match(/(.+?)\s*\[(?:Reference|Referans)\]\(([^)]+)\)/i);
                            if (certLinkMatch) {
                                data.certifications.push({ text: certLinkMatch[1].trim().replace(/\s*-\s*$/, ''), link: certLinkMatch[2].trim() });
                                continue;
                            }
                            // Current format: "Reference: https://..." attached to the previous cert
                            const refOnly = clean.match(/^(?:Reference|Referans):\s*(\S+)$/i);
                            if (refOnly && data.certifications.length > 0) {
                                data.certifications[data.certifications.length - 1].link = refOnly[1].trim();
                                continue;
                            }
                            data.certifications.push({ text: clean });
                        }
                    });
                } else if (section === 'LANGUAGES') {
                    data.languages.push(...listItems.map(i => this.stripInline(i)));
                } else if (section === 'EDUCATION') {
                    // Current format: a single list item carrying institution - faculty - city - year.
                    // Generated .md emits institution and detail as separate list items.
                    for (const raw of listItems) {
                        const item = this.stripInline(raw);
                        if (!item) continue;
                        const inline = parseInlineEducation(item);
                        if (inline) {
                            data.education.institution = inline.institution;
                            data.education.detail = inline.detail;
                            data.education.date = inline.date;
                        } else if (!eduInstitutionFromList) {
                            eduInstitutionFromList = item;
                        } else if (!data.education.detail) {
                            data.education.detail = item;
                        }
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
                        } else if (!data.header.name && token.type === 'paragraph') {
                            // Generated .md emits the name as the first line of the header
                            // paragraph, before any labeled field.
                            const firstLine = text.split('\n')[0].trim();
                            if (firstLine && !firstLine.includes(':')) data.header.name = this.stripInline(firstLine);
                        }
                        {
                            // Support English and Turkish labels; fields may share a line separated by " - "
                            const email = this.extractHeaderField(text, ['E-mail', 'E-posta', 'Email']);
                            const phone = this.extractHeaderField(text, ['Phone', 'Telefon']);
                            const address = this.extractHeaderField(text, ['Address', 'Adres']);
                            const website = this.extractHeaderField(text, ['Website', 'Web Sitesi']);
                            const linkedin = this.extractHeaderField(text, ['LinkedIn', 'Linkedin']);

                            if (email) data.header.email = email;
                            if (phone) data.header.phone = phone;
                            if (address) data.header.address = address;
                            if (website) data.header.website = website;
                            if (linkedin) data.header.linkedin = linkedin;
                        }
                        break;
                    case 'SUMMARY':
                        // Store raw text (with ** markers) so generators can parse bold
                        data.summary.push(rawText || text);
                        break;
                    case 'EXPERIENCE':
                        // Support "Present", "Günümüz", "Devam ediyor"
                        // Using /i flag for case-insensitive matching which handles Turkish chars better than toLowerCase()
                        if (cleanText.match(/^\d{2}\/\d{4}\s*[–-]\s*(?:Present|Günümüz|Devam\s+ediyor|\d{2}\/\d{4})$/i)) {
                            if (currentJob) { currentJob.date = cleanText; }
                        } else {
                            // Match: "Title - Company, Location" (legacy) or "Title - Company - Location" (current)
                            const dashMatch = cleanText.match(/^(.+?)\s+[-–]\s+(.+?)\s+[-–]\s+(.+)$/);
                            const commaMatch = cleanText.match(/^(.+?)\s+[-–]\s+(.+?),\s*(.+)$/);
                            const jobMatch = dashMatch || commaMatch;
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
                        if (/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}/i.test(text)) {
                            if (currentProject) currentProject.tech = text.replace(/^\*{0,2}(?:Technologies|Teknolojiler):\*{0,2}\s*/i, '').trim();
                        } else if (/^https?:\/\/\S+$/.test(cleanText) && currentProject && !currentProject.link) {
                            // Generated .md emits the project URL as its own paragraph
                            currentProject.link = cleanText;
                        } else {
                            const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (linkMatch && token.type === 'heading') {
                                // Legacy format: "### [Title](url)"
                                saveProject();
                                currentProject = { title: linkMatch[1].trim(), link: linkMatch[2].trim(), tech: '', bullets: [] };
                            } else if (token.type === 'heading') {
                                // Current format: "### Title" with a separate "- **Link:** url" list item
                                saveProject();
                                currentProject = { title: cleanText, link: '', tech: '', bullets: [] };
                            } else if (!data.projectsIntro) {
                                // Intro paragraph (only before the first project heading).
                                // Store the FULL paragraph text (links are converted by generators).
                                data.projectsIntro = text;
                            } else if (currentProject && !currentProject.tech) {
                                currentProject.subtitle = cleanText;
                            } else if (currentProject) {
                                currentProject.bullets.push(cleanText);
                            }
                        }
                        break;
                    case 'EDUCATION':
                        // A heading inside the section is the degree (source and generated .md
                        // both emit "### <degree>"). Paragraphs are buffered for finalizeEducation.
                        if (token.type === 'heading') {
                            data.education.degree = cleanText;
                        } else {
                            eduParagraphs.push(cleanText);
                        }
                        break;
                    case "CERTIFICATIONS": {
                        // FIX: Handle paragraph-based certs with links (e.g., "- **Cert Name** - [Reference](url)")
                        const cleanCert = this.stripInline(text);
                        // Regex handles optional bold markers around name, optional dash, and [Reference|Referans](link)
                        const certLinkMatch = cleanCert.match(/^\s*-?\s*\*{0,2}(.+?)\*{0,2}\s*[-–]\s*\[(?:Reference|Referans)\]\(([^)]+)\)/i);
                        if (certLinkMatch) {
                            data.certifications.push({ text: certLinkMatch[1].trim(), link: certLinkMatch[2].trim() });
                        } else {
                            // Current format: "Reference: https://..." on its own line, attached to the previous cert
                            const refOnly = cleanCert.match(/^(?:Reference|Referans):\s*(\S+)$/i);
                            if (refOnly && data.certifications.length > 0) {
                                data.certifications[data.certifications.length - 1].link = refOnly[1].trim();
                            } else {
                                // Fallback for plain text certs
                                data.certifications.push({ text: cleanCert.replace(/^-\s*/, "") });
                            }
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
        if (this.verbose) {
            console.log('PARSING RESULT:', JSON.stringify(data, null, 2));
        }
        return data;
    }
}
