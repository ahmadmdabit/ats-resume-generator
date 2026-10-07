import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, ShadingType, convertInchesToTwip, UnderlineType } from "docx";
import { GeneratorOptions, IResumeGenerator, LANG } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';
import { getLocale } from '../i18n/locales.js';

export class DocxGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string, lang: LANG = 'en', options?: GeneratorOptions): Promise<void> {
        // Localization from shared locale module
        const locale = getLocale(lang);
        const t = {
            email: locale.fieldLabels.email,
            phone: locale.fieldLabels.phone,
            address: locale.fieldLabels.address,
            website: locale.fieldLabels.website,
            linkedin: locale.fieldLabels.linkedin,
            summary: locale.sectionHeadings['PROFESSIONAL SUMMARY'],
            skills: locale.sectionHeadings['TECHNICAL SKILLS'],
            experience: locale.sectionHeadings['PROFESSIONAL EXPERIENCE'],
            projects: locale.sectionHeadings['PROJECTS'],
            education: locale.sectionHeadings['EDUCATION'],
            certifications: locale.sectionHeadings['CERTIFICATIONS'],
            languages: locale.sectionHeadings['LANGUAGES'],
            technologies: lang === 'tr' ? 'Teknolojiler' : 'Technologies',
            reference: lang === 'tr' ? 'Referans' : 'Reference',
        };

        // C1: blank paragraph to mirror source blank lines (skipped when --no-blank-lines)
        const blank = (): Paragraph[] => options?.noBlankLines ? [] : [new Paragraph({ children: [new TextRun('')] })];

        const doc = new Document({
            styles: {
                characterStyles: [
                    { id: "Hyperlink", name: "Hyperlink", run: { color: "4EA72E", underline: { type: UnderlineType.NONE } } }
                ],
                default: {
                    document: { run: { font: "Calibri", size: 24 } },
                    heading1: { run: { font: "Calibri", size: 40, color: "3A7C22" }, paragraph: { spacing: { before: 360, after: 80 }, shading: { type: ShadingType.CLEAR, fill: "D9F2D0", color: "auto" }, alignment: AlignmentType.CENTER } },
                    heading2: { run: { font: "Calibri", size: 32, color: "4EA72E" }, paragraph: { spacing: { before: 160, after: 80 }, shading: { type: ShadingType.CLEAR, fill: "D9F2D0", color: "auto" } } },
                    heading3: { run: { font: "Calibri", size: 28, color: "3A7C22", bold: true }, paragraph: { spacing: { before: 160, after: 80 }, shading: { type: ShadingType.CLEAR, fill: "B3E5A1", color: "auto" } } },
                },
                paragraphStyles: [{ id: "Compact", name: "Compact", basedOn: "Normal", next: "Normal", run: { font: "Calibri", size: 24 }, paragraph: { spacing: { before: 36, after: 36 } } }],
            },
            sections: [{
                properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: convertInchesToTwip(0.5), right: convertInchesToTwip(0.5), bottom: convertInchesToTwip(0.5), left: convertInchesToTwip(0.5) } } },
                children: [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(data.header.name)] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${t.email}: `, bold: true }), new ExternalHyperlink({ link: `mailto:${data.header.email}`, children: [new TextRun({ text: data.header.email, style: "Hyperlink" })] }), new TextRun(' - '), new TextRun({ text: `${t.phone}: `, bold: true }), new ExternalHyperlink({ link: `tel:${data.header.phone.replace(/\s/g, '')}`, children: [new TextRun({ text: data.header.phone, style: "Hyperlink" })] })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${t.address}: `, bold: true }), new TextRun(data.header.address)] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${t.website}: `, bold: true }), new ExternalHyperlink({ link: data.header.website, children: [new TextRun({ text: data.header.website, style: "Hyperlink" })] }), ...(data.header.linkedin ? [new TextRun(' - '), new TextRun({ text: `${t.linkedin}: `, bold: true }), new ExternalHyperlink({ link: data.header.linkedin, children: [new TextRun({ text: data.header.linkedin, style: "Hyperlink" })] })] : [])] }),
                    ...blank(),

                    // Summary
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.summary)] }),
                    ...blank(),
                    ...data.summary.map(line => {
                        // Parse **bold** markers from source text
                        const runs: TextRun[] = [];
                        const boldRe = /\*\*([^*]+)\*\*/g;
                        let last = 0;
                        let m: RegExpExecArray | null;
                        while ((m = boldRe.exec(line)) !== null) {
                            if (m.index > last) runs.push(new TextRun(line.slice(last, m.index)));
                            runs.push(new TextRun({ text: m[1], bold: true }));
                            last = m.index + m[0].length;
                        }
                        if (last < line.length) runs.push(new TextRun(line.slice(last)));
                        return new Paragraph({ spacing: { after: 120 }, children: runs });
                    }),
                    ...blank(),

                    // Skills
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.skills)] }),
                    ...blank(),
                    ...data.skills.map(s => new Paragraph({ spacing: { after: 40 }, children: [new TextRun("- "), new TextRun({ text: `${s.category}:`, color: "4EA72E", bold: true }), new TextRun(` ${s.items}`)] })),
                    ...blank(),

                    // Experience
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.experience)] }),
                    ...blank(),
                    ...(data.experienceOverview ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: data.experienceOverview })] }), ...blank()] : []),
                    ...data.experience.flatMap(job => [
                        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(`${job.title} - `), new TextRun({ text: job.company, color: "4EA72E" }), new TextRun(` - ${job.location}`)] }),
                        ...blank(),
                        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: job.date, bold: true })] }),
                        ...blank(),
                        ...job.bullets.map(b => new Paragraph({ children: [new TextRun(`- ${b}`)], spacing: { after: 40 } })),
                        ...blank(),
                    ]),

                    // Projects
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.projects)] }),
                    ...data.projects.flatMap(proj => [
                        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(proj.title)] }),
                        ...blank(),
                        new Paragraph({ children: [new TextRun("- "), new TextRun({ text: `${t.technologies === 'Teknolojiler' ? 'Bağlantı' : 'Link'}: `, bold: true }), new ExternalHyperlink({ link: proj.link, children: [new TextRun({ text: proj.link, style: "Hyperlink" })] })] }),
                        ...(proj.subtitle ? [new Paragraph({ children: [new TextRun({ text: proj.subtitle, italics: true })] })] : []),
                        new Paragraph({ spacing: { after: 40 }, children: [new TextRun("- "), new TextRun({ text: `${t.technologies}: `, bold: true }), new TextRun(` ${proj.tech}`)] }),
                        ...proj.bullets.map(b => new Paragraph({ children: [new TextRun(`- ${b}`)], spacing: { after: 40 } })),
                        ...blank(),
                    ]),

                    // Education
                    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 0 }, children: [new TextRun(t.education)] }),
                    ...blank(),
                    ...(data.education.overview ? [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: data.education.overview })] }), ...blank()] : []),
                    new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(data.education.degree)] }),
                    ...blank(),
                    ...(() => {
                        const parts: string[] = [];
                        if (data.education.institution) parts.push(data.education.institution);
                        if (data.education.detail) parts.push(data.education.detail);
                        if (data.education.date) parts.push(data.education.date);
                        const line = parts.join(' - ');
                        return line ? [new Paragraph({ children: [new TextRun(`- ${line}`)] }), ...blank()] : [...blank()];
                    })(),

                    // Certifications
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.certifications)] }),
                    ...blank(),
                    ...data.certifications.flatMap(cert => {
                        const children: (TextRun | ExternalHyperlink)[] = [new TextRun("- ")];
                        const cleanText = cert.link ? cert.text.replace(/\s*-\s*$/, '') : cert.text;
                        const parts = cleanText.split(/(\(.*?\)|- \d{4}|- Reference |- Referans)/);
                        for (const p of parts) {
                            if (p.match(/^\(.*?\)$/) || p.match(/^- \d{4}$/) || p === '- Reference' || p === '- Referans') {
                                children.push(new TextRun(p));
                            } else {
                                children.push(new TextRun({ text: p, bold: true }));
                            }
                        }
                        const result: Paragraph[] = [new Paragraph({ style: "Compact", children })];
                        if (cert.link) {
                            result.push(new Paragraph({
                                indent: { left: convertInchesToTwip(0.2) },
                                children: [new TextRun({ text: `${t.reference}: `, bold: true }), new ExternalHyperlink({ link: cert.link, children: [new TextRun({ text: cert.link, style: "Hyperlink" })] })]
                            }));
                        }
                        result.push(...blank());
                        return result;
                    }),

                    // Languages
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t.languages)] }),
                    ...blank(),
                    ...data.languages.map(lang => new Paragraph({ style: "Compact", children: [new TextRun("- "), new TextRun({ text: lang.replace(/\*\*/g, '').replace(/\(([^)]+)\)/, ''), bold: true }), ...(lang.match(/\(([^)]+)\)/) ? [new TextRun(` (${lang.match(/\(([^)]+)\)/)![1]})`)] : [])] })),
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
    }
}
