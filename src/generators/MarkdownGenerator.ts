import * as fs from 'fs';
import { IResumeGenerator, LANG } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';

export class MarkdownGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string, lang: LANG = 'en'): Promise<void> {
        const t = lang === 'tr' ? {
            email: 'E-posta', phone: 'Telefon', address: 'Adres', website: 'Web Sitesi',
            summary: 'PROFESYONEL ÖZET', skills: 'TEKNİK BECERİLER',
            experience: 'İŞ DENEYİMİ', projects: 'PROJELER',
            education: 'EĞİTİM', certifications: 'SERTİFİKALAR', languages: 'DİLLER',
            technologies: 'Teknolojiler', reference: 'Referans'
        } : {
            email: 'E-mail', phone: 'Phone', address: 'Address', website: 'Website',
            summary: 'PROFESSIONAL SUMMARY', skills: 'TECHNICAL SKILLS',
            experience: 'PROFESSIONAL EXPERIENCE', projects: 'PROJECTS',
            education: 'EDUCATION', certifications: 'CERTIFICATIONS', languages: 'LANGUAGES',
            technologies: 'Technologies', reference: 'Reference'
        };

        let md = `${data.header.name}\n${t.email}: ${data.header.email}\n${t.phone}: ${data.header.phone}\n${t.address}: ${data.header.address}\n${t.website}: ${data.header.website}\n\n`;

        md += `## ${t.summary}\n${data.summary.join('\n')}\n\n`;
        md += `## ${t.skills}\n${data.skills.map(s => `- ${s.category}: ${s.items}`).join('\n')}\n\n`;

        md += `## ${t.experience}\n`;
        if (data.experienceOverview) md += `*${data.experienceOverview}*\n\n`;
        data.experience.forEach(job => {
            md += `${job.title} - ${job.company}, ${job.location}\n${job.date}\n${job.bullets.map(b => `- ${b}`).join('\n')}\n\n`;
        });

        md += `## ${t.projects}\n${data.projectsIntro}\n\n`;
        data.projects.forEach(proj => {
            md += `[${proj.title}](${proj.link})\n${proj.subtitle ? proj.subtitle + '\n' : ''}${t.technologies}: ${proj.tech}\n${proj.bullets.map(b => `- ${b}`).join('\n')}\n\n`;
        });

        // Enforcing correct order: Overview -> Degree -> Date -> Institution
        md += `## ${t.education}\n`;
        if (data.education.overview) md += `${data.education.overview}\n\n`;
        md += `${data.education.degree}\n${data.education.date}\n`;
        if (data.education.institution) md += `- ${data.education.institution}\n`;
        md += `\n`;

        md += `## ${t.certifications}\n${data.certifications.map(c => c.link ? `- ${c.text} - [${t.reference}](${c.link})` : `- ${c.text}`).join('\n')}\n\n`;
        md += `## ${t.languages}\n${data.languages.map(l => `- ${l}`).join('\n')}`;

        fs.writeFileSync(outputPath, md, 'utf-8');
    }
}