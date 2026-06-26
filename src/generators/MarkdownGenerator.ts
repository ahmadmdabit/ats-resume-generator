import * as fs from 'fs';
import { IResumeGenerator } from '../core/interfaces';
import { ResumeData } from '../core/models';

export class MarkdownGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string): Promise<void> {
        let md = `${data.header.name}\nE-mail: ${data.header.email}\nPhone: ${data.header.phone}\nAddress: ${data.header.address}\nWebsite: ${data.header.website}\n\n`;
        md += `## PROFESSIONAL SUMMARY\n${data.summary.join('\n')}\n\n`;
        md += `## TECHNICAL SKILLS\n${data.skills.map(s => `- ${s.category}: ${s.items}`).join('\n')}\n\n`;
        md += `## PROFESSIONAL EXPERIENCE\n`;
        data.experience.forEach(job => { md += `${job.title} - ${job.company}, ${job.location}\n${job.date}\n${job.bullets.map(b => `- ${b}`).join('\n')}\n\n`; });
        md += `## PROJECTS\n${data.projectsIntro}\n\n`;
        data.projects.forEach(proj => { md += `[${proj.title}](${proj.link})\n${proj.subtitle ? proj.subtitle + '\n' : ''}Technologies: ${proj.tech}\n${proj.bullets.map(b => `- ${b}`).join('\n')}\n\n`; });
        md += `## EDUCATION\n${data.education.degree}\n${data.education.date}\n${data.education.institution}\n\n`;
        md += `## CERTIFICATIONS\n${data.certifications.map(c => c.link ? `- ${c.text} - [Reference](${c.link})` : `- ${c.text}`).join('\n')}\n\n`;
        md += `## LANGUAGES\n${data.languages.map(l => `- ${l}`).join('\n')}`;
        fs.writeFileSync(outputPath, md, 'utf-8');
    }
}