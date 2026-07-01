import * as fs from 'fs';
import { IResumeGenerator, LANG } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';

export class TxtGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string, lang: LANG = 'en'): Promise<void> {
        const t = lang === 'tr' ? {
            email: 'E-posta', phone: 'Telefon', address: 'Adres', website: 'Web Sitesi',
            summary: 'PROFESYONEL ÖZET', skills: 'TEKNİK BECERİLER',
            experience: 'İŞ DENEYİMİ', projects: 'PROJELER',
            education: 'EĞİTİM', certifications: 'SERTİFİKALAR', languages: 'DİLLER',
            technologies: 'Teknolojiler'
        } : {
            email: 'E-mail', phone: 'Phone', address: 'Address', website: 'Website',
            summary: 'PROFESSIONAL SUMMARY', skills: 'TECHNICAL SKILLS',
            experience: 'PROFESSIONAL EXPERIENCE', projects: 'PROJECTS',
            education: 'EDUCATION', certifications: 'CERTIFICATIONS', languages: 'LANGUAGES',
            technologies: 'Technologies'
        };

        const lines: string[] = [];
        const stripMarkdown = (text: string): string => {
            if (!text) return '';
            return text
                .replace(/^#+\s+/gm, '') // Remove heading hashes
                .replace(/\*\*(.*?)\*\*/gs, '$1') // Remove bold **
                .replace(/__(.*?)__/gs, '$1') // Remove bold __
                .replace(/(?<!\w)\*(.*?)\*(?!\w)/gs, '$1') // Remove italic *
                .replace(/(?<!\w)_(.*?)_(?!\w)/gs, '$1') // Remove italic _
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // Convert links to text (url)
                .replace(/`([^`]+)`/g, '$1')  // Remove inline code backticks
                .trim();
        };

        // Header
        lines.push(`${data.header.name}\n${t.email}: ${data.header.email}\n${t.phone}: ${data.header.phone}\n${t.address}: ${data.header.address}\n${t.website}: ${data.header.website}`);
        lines.push('');

        // Summary
        lines.push(t.summary);
        data.summary.forEach(line => {
            lines.push(stripMarkdown(line));
            lines.push('');
        });

        // Skills
        lines.push(t.skills);
        data.skills.forEach(s => {
            lines.push(`${stripMarkdown(s.category)}: ${stripMarkdown(s.items)}`);
        });
        lines.push('');

        // Experience
        lines.push(t.experience);
        if (data.experienceOverview) {
            lines.push(stripMarkdown(data.experienceOverview));
            lines.push('');
        }
        data.experience.forEach(job => {
            lines.push(`${stripMarkdown(job.title)} - ${stripMarkdown(job.company)}, ${stripMarkdown(job.location)}`);
            lines.push(stripMarkdown(job.date));
            job.bullets.forEach(b => { lines.push(`- ${stripMarkdown(b).replace(/^[-*+]\s*/, '')}`); });
            lines.push('');
        });

        // Projects
        lines.push(t.projects);
        if (data.projectsIntro) {
            lines.push(stripMarkdown(data.projectsIntro));
            lines.push('');
        }
        data.projects.forEach(proj => {
            let projHeader = stripMarkdown(proj.title);
            if (proj.link) projHeader += ` (${stripMarkdown(proj.link)})`;
            lines.push(projHeader);
            if (proj.subtitle) lines.push(stripMarkdown(proj.subtitle));
            lines.push(`${t.technologies}: ${stripMarkdown(proj.tech)}`);
            proj.bullets.forEach(b => { lines.push(`- ${stripMarkdown(b).replace(/^[-*+]\s*/, '')}`); });
            lines.push('');
        });

        // Education
        // Enforcing correct order: Overview -> Degree -> Date -> Institution
        lines.push(t.education);
        if (data.education.overview) {
            lines.push(stripMarkdown(data.education.overview));
            lines.push('');
        }
        lines.push(stripMarkdown(data.education.degree));
        lines.push(stripMarkdown(data.education.date));
        if (data.education.institution) { lines.push(`- ${stripMarkdown(data.education.institution)}`); }
        lines.push('');

        // Certifications
        lines.push(t.certifications);
        data.certifications.forEach((cert) => {
            let text = stripMarkdown(cert.text); // stripMarkdown handles link conversion
            if (cert.link) {
                // stripMarkdown already converted [Ref](url) -> Ref (url), but cert.text might not have the link inline.
                // If cert.text is "Cert Name" and link is separate, append it.
                if (!text.includes(cert.link)) text += ` (${stripMarkdown(cert.link)})`;
            }
            lines.push(`- ${text}`);
        });
        lines.push('');

        // Languages
        lines.push(t.languages);
        data.languages.forEach(lang => {
            lines.push(`- ${stripMarkdown(lang)}`);
        });

        fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
    }
}