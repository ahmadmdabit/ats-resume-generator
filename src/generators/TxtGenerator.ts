import * as fs from 'fs';
import { IResumeGenerator } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';

export class TxtGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string): Promise<void> {
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
                .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
                .trim();
        };

        // Header
        lines.push(data.header.name.toUpperCase());
        const headerDetails = [
            data.header.email,
            data.header.phone,
            data.header.address,
            data.header.website
        ].filter(Boolean).map(stripMarkdown);
        lines.push(headerDetails.join(' | '));
        lines.push('');

        // Summary
        lines.push('PROFESSIONAL SUMMARY');
        data.summary.forEach(line => {
            lines.push(stripMarkdown(line));
            lines.push('');
        });

        // Skills
        lines.push('TECHNICAL SKILLS');
        data.skills.forEach(s => {
            lines.push(`${stripMarkdown(s.category)}: ${stripMarkdown(s.items)}`);
        });
        lines.push('');

        // Experience
        lines.push('PROFESSIONAL EXPERIENCE');
        data.experience.forEach(job => {
            lines.push(`${stripMarkdown(job.title)} - ${stripMarkdown(job.company)}, ${stripMarkdown(job.location)}`);
            lines.push(stripMarkdown(job.date));
            job.bullets.forEach(b => {
                const cleanBullet = stripMarkdown(b).replace(/^[-*+]\s*/, '');
                lines.push(`- ${cleanBullet}`);
            });
            lines.push('');
        });

        // Projects
        lines.push('PROJECTS');
        if (data.projectsIntro) {
            lines.push(stripMarkdown(data.projectsIntro));
            lines.push('');
        }
        data.projects.forEach(proj => {
            let projHeader = stripMarkdown(proj.title);
            if (proj.link) projHeader += ` (${stripMarkdown(proj.link)})`;
            lines.push(projHeader);
            if (proj.subtitle) lines.push(stripMarkdown(proj.subtitle));
            lines.push(`Technologies: ${stripMarkdown(proj.tech)}`);
            proj.bullets.forEach(b => {
                const cleanBullet = stripMarkdown(b).replace(/^[-*+]\s*/, '');
                lines.push(`- ${cleanBullet}`);
            });
            lines.push('');
        });

        // Education
        lines.push('EDUCATION');
        lines.push(stripMarkdown(data.education.degree));
        lines.push(stripMarkdown(data.education.date));
        lines.push(`- ${stripMarkdown(data.education.institution)}`);
        lines.push('');

        // Certifications
        lines.push('CERTIFICATIONS');
        data.certifications.forEach(cert => {
            let text = stripMarkdown(cert.text);
            if (cert.link) {
                text += ` (${stripMarkdown(cert.link)})`;
            }
            lines.push(`- ${text}`);
        });
        lines.push('');

        // Languages
        lines.push('LANGUAGES');
        data.languages.forEach(lang => {
            lines.push(`- ${stripMarkdown(lang)}`);
        });

        const content = lines.join('\n');
        fs.writeFileSync(outputPath, content, 'utf-8');
    }
}