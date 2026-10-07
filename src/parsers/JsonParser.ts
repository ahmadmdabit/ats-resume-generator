import { ILayoutParser, IResumeParser } from '../core/interfaces.js';
import { LayoutLine, ResumeData, ResumeLayout } from '../core/models.js';

export class JsonParser implements IResumeParser, ILayoutParser {
    parse(input: string): ResumeData {
        try { return JSON.parse(input) as ResumeData; }
        catch { throw new Error('Invalid JSON format provided.'); }
    }

    // JSON carries no source layout, so synthesize the canonical shape the
    // Markdown templates use. This keeps a single rendering path in the text
    // generators — no fallback branch, no format-specific special casing.
    parseLayout(input: string): ResumeLayout {
        const data = this.parse(input);
        const lines: LayoutLine[] = [];

        const push = (kind: LayoutLine['kind'], text: string, indent = 0) =>
            lines.push({ kind, text, indent });
        const blank = () => push('blank', '');

        // Header
        push('title', data.header.name);
        const contact: string[] = [];
        if (data.header.email) contact.push(`E-mail: ${data.header.email}`);
        if (data.header.phone) contact.push(`Phone: ${data.header.phone}`);
        if (contact.length) push('contact', contact.join(' - '));
        if (data.header.address) push('contact', `Address: ${data.header.address}`);
        const web: string[] = [];
        if (data.header.website) web.push(`Website: ${data.header.website}`);
        if (data.header.linkedin) web.push(`LinkedIn: ${data.header.linkedin}`);
        if (web.length) push('contact', web.join(' - '));
        blank();

        // Summary
        push('section', 'PROFESSIONAL SUMMARY');
        data.summary.forEach(s => push('plain', s));
        blank();

        // Skills
        push('section', 'TECHNICAL SKILLS');
        data.skills.forEach(s => push('bullet', `- ${s.category}: ${s.items}`));
        blank();

        // Experience
        push('section', 'PROFESSIONAL EXPERIENCE');
        if (data.experienceOverview) { push('plain', data.experienceOverview); blank(); }
        data.experience.forEach(job => {
            push('entry', `${job.title} - ${job.company} - ${job.location}`);
            push('date', job.date);
            job.bullets.forEach(b => push('bullet', `- ${b}`));
            blank();
        });

        // Projects
        push('section', 'PROJECTS');
        if (data.projectsIntro) { push('plain', data.projectsIntro); blank(); }
        data.projects.forEach(proj => {
            push('entry', proj.title);
            if (proj.link) push('plain', proj.link);
            if (proj.subtitle) push('plain', proj.subtitle);
            push('labeled', `- Technologies: ${proj.tech}`);
            proj.bullets.forEach(b => push('bullet', `- ${b}`));
            blank();
        });

        // Education
        push('section', 'EDUCATION');
        if (data.education.overview) { push('plain', data.education.overview); blank(); }
        push('entry', data.education.degree);
        push('date', data.education.date);
        if (data.education.institution) push('bullet', `- ${data.education.institution}`);
        if (data.education.detail) push('bullet', `- ${data.education.detail}`);
        blank();

        // Certifications
        push('section', 'CERTIFICATIONS');
        data.certifications.forEach(cert => {
            push('bullet', `- ${cert.text}`);
            if (cert.link) push('reference', `Reference: ${cert.link}`, 2);
        });
        blank();

        // Languages
        push('section', 'LANGUAGES');
        data.languages.forEach(l => push('bullet', `- ${l}`));

        return { lines };
    }
}
