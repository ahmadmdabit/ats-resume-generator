import { marked, Tokens } from 'marked';
import { IResumeParser } from '../core/interfaces.js';
import { ResumeData, ResumeJob, ResumeProject } from '../core/models.js';

export class MarkdownParser implements IResumeParser {
    private readonly SECTION_HEADERS = [
        'PROFESSIONAL SUMMARY', 'TECHNICAL SKILLS', 'PROFESSIONAL EXPERIENCE',
        'PROJECTS', 'EDUCATION', 'CERTIFICATIONS', 'LANGUAGES'
    ];

    private stripInline(text: string): string {
        return text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim();
    }

    parse(input: string): ResumeData {
        const tokens = marked.lexer(input);
        const data: ResumeData = {
            header: { name: '', email: '', phone: '', address: '', website: '' },
            summary: [], skills: [], experience: [], projectsIntro: '', projects: [],
            education: { degree: '', date: '', institution: '' }, certifications: [], languages: []
        };

        let section = 'HEADER';
        let currentJob: ResumeJob | null = null;
        let currentProject: ResumeProject | null = null;

        const saveJob = () => { if (currentJob) { data.experience.push(currentJob); currentJob = null; } };
        const saveProject = () => { if (currentProject) { data.projects.push(currentProject); currentProject = null; } };

        for (const token of tokens) {
            const text = (token.type === 'heading' || token.type === 'paragraph' || token.type === 'text') ? token.text.trim() : '';
            const rawText = (token as any).raw?.trim() || '';

            if (this.SECTION_HEADERS.includes(text) || this.SECTION_HEADERS.includes(rawText)) {
                saveJob(); saveProject();
                section = text.replace('PROFESSIONAL ', '').replace('TECHNICAL ', '');
                continue;
            }

            if (token.type === 'list') {
                const listItems = token.items.map((item: Tokens.ListItem) => item.text.trim()) as string[];
                if (section === 'SKILLS') {
                    listItems.forEach((item: string) => {
                        const clean = this.stripInline(item);
                        const match = clean.match(/^([^:]+):\s*(.+)/);
                        if (match) data.skills.push({ category: match[1].trim(), items: match[2].trim() });
                    });
                } else if (section === 'EXPERIENCE' && currentJob) {
                    currentJob.bullets.push(...listItems.map(i => this.stripInline(i)));
                } else if (section === 'PROJECTS' && currentProject) {
                    listItems.forEach((item: string) => {
                        if (/Technologies:/.test(item)) {
                            currentProject!.tech = item.replace(/^\*{0,2}Technologies:\*{0,2}\s*/, '').trim();
                        } else {
                            currentProject!.bullets.push(this.stripInline(item));
                        }
                    });
                } else if (section === 'CERTIFICATIONS') {
                    listItems.forEach((item: string) => {
                        const clean = this.stripInline(item);
                        const certLinkMatch = clean.match(/(.+?)\s*\[Reference\]\(([^)]+)\)/);
                        data.certifications.push(certLinkMatch
                            ? { text: certLinkMatch[1].trim(), link: certLinkMatch[2].trim() }
                            : { text: clean });
                    });
                } else if (section === 'LANGUAGES') {
                    data.languages.push(...listItems.map(i => this.stripInline(i)));
                } else if (section === 'EDUCATION') {
                    data.education.institution = this.stripInline(listItems[0] || '');
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
                            const emailMatch = text.match(/E-mail:\*{0,2}\s*(\S+)/);
                            const phoneMatch = text.match(/Phone:\*{0,2}\s*([^\n]+)/);
                            const addressMatch = text.match(/Address:\*{0,2}\s*([^\n]+)/);
                            const websiteMatch = text.match(/Website:\*{0,2}\s*([^\n]+)/);
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
                        if (cleanText.match(/^\d{2}\/\d{4}\s*–\s*(Present|\d{2}\/\d{4})$/)) {
                            // Bug fix: only set date, do NOT call saveJob() here.
                            // The job must stay alive so the following list token can fill bullets.
                            if (currentJob) { currentJob.date = cleanText; }
                        } else {
                            const jobMatch = cleanText.match(/^(.+?)\s*-\s*(.+?),\s*(.+)$/);
                            if (jobMatch) {
                                saveJob();
                                currentJob = { title: jobMatch[1].trim(), company: jobMatch[2].trim(), location: jobMatch[3].trim(), date: '', bullets: [] };
                            } else if (currentJob) {
                                currentJob.bullets.push(cleanText);
                            }
                        }
                        break;
                    case 'PROJECTS':
                        if (cleanText.toLowerCase().includes('complete portfolio')) {
                            data.projectsIntro = text;
                        } else if (/Technologies:/.test(text)) {
                            if (currentProject) currentProject.tech = text.replace(/^\*{0,2}Technologies:\*{0,2}\s*/, '').trim();
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
                        if (!data.education.degree) {
                            data.education.degree = cleanText;
                        } else if (cleanText.match(/^\d{2}\/\d{4}\s*–\s*\d{2}\/\d{4}$/)) {
                            data.education.date = cleanText;
                        } else {
                            data.education.institution = cleanText;
                        }
                        break;
                    case 'CERTIFICATIONS': {
                        const cleanCert = this.stripInline(text);
                        const certLinkMatch = cleanCert.match(/(.+?)\s*\[Reference\]\(([^)]+)\)/);
                        data.certifications.push(certLinkMatch
                            ? { text: certLinkMatch[1].trim(), link: certLinkMatch[2].trim() }
                            : { text: cleanCert });
                        break;
                    }
                    case 'LANGUAGES':
                        data.languages.push(cleanText);
                        break;
                }
            }
        }
        saveJob(); saveProject();
        return data;
    }
}