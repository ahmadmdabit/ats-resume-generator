import * as fs from 'fs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, ShadingType, convertInchesToTwip, UnderlineType } from "docx";
import { IResumeGenerator } from '../core/interfaces';
import { ResumeData } from '../core/models';

export class DocxGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string): Promise<void> {

        const doc = new Document({
            styles: {
                characterStyles: [
                    {
                        id: "Hyperlink",
                        name: "Hyperlink",
                        run: { color: "4EA72E", underline: { type: UnderlineType.NONE } }
                    }
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
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "E-mail: ", bold: true }), new ExternalHyperlink({ link: `mailto:${data.header.email}`, children: [new TextRun({ text: data.header.email, style: "Hyperlink" })] })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Phone: ", bold: true }), new ExternalHyperlink({ link: `tel:${data.header.phone.replace(/\s/g, '')}`, children: [new TextRun({ text: data.header.phone, style: "Hyperlink" })] })] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Address: ", bold: true }), new TextRun(data.header.address)] }),
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Website: ", bold: true }), new ExternalHyperlink({ link: data.header.website, children: [new TextRun({ text: data.header.website, style: "Hyperlink" })] })] }),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROFESSIONAL SUMMARY")] }),
                    ...data.summary.map(line => {
                        const runs = line.split(/(Senior Software Developer and Software Architect|Microsoft Certified,)/).map(part =>
                            (part === "Senior Software Developer and Software Architect" || part === "Microsoft Certified,")
                                ? new TextRun({ text: part, bold: true })
                                : new TextRun(part)
                        );
                        return new Paragraph({ spacing: { after: 120 }, children: runs });
                    }),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("TECHNICAL SKILLS")] }),
                    ...data.skills.map(s => new Paragraph({ spacing: { after: 40 }, children: [new TextRun("- "), new TextRun({ text: `${s.category}:`, color: "4EA72E", bold: true }), new TextRun(` ${s.items}`)] })),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROFESSIONAL EXPERIENCE")] }),
                    ...data.experience.flatMap(job => [
                        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(`${job.title} - `), new TextRun({ text: job.company, color: "4EA72E" }), new TextRun(`, ${job.location}`)] }),
                        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: job.date, italics: true })] }),
                        ...job.bullets.map(b => new Paragraph({ children: [new TextRun(`- ${b}`)], spacing: { after: 40 } }))
                    ]),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("PROJECTS")] }),
                    new Paragraph({ children: (() => { const r: (TextRun | ExternalHyperlink)[] = []; const re = /\[([^\]]+)\]\(([^)]+)\)/g; let l = 0, m: RegExpExecArray | null; while ((m = re.exec(data.projectsIntro)) !== null) { if (m.index > l) r.push(new TextRun(data.projectsIntro.slice(l, m.index))); r.push(new ExternalHyperlink({ link: m[2], children: [new TextRun({ text: m[1], style: "Hyperlink" })] })); l = re.lastIndex; } if (l < data.projectsIntro.length) r.push(new TextRun(data.projectsIntro.slice(l))); return r; })() }),
                    ...data.projects.flatMap(proj => [
                        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(`${proj.title} - `), new ExternalHyperlink({ link: proj.link, children: [new TextRun({ text: proj.link, style: "Hyperlink" })] })] }),
                        ...(proj.subtitle ? [new Paragraph({ children: [new TextRun({ text: proj.subtitle, italics: true })] })] : []),
                        new Paragraph({ spacing: { after: 40 }, children: [new TextRun("- "), new TextRun({ text: "Technologies:", bold: true }), new TextRun(` ${proj.tech}`)] }),
                        ...proj.bullets.map(b => new Paragraph({ children: [new TextRun(`- ${b}`)], spacing: { after: 40 } }))
                    ]),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 0 }, children: [new TextRun("EDUCATION")] }),
                    new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(data.education.degree)] }),
                    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 80 }, children: [new TextRun({ text: data.education.date, italics: true })] }),
                    new Paragraph({ children: [new TextRun(`- ${data.education.institution}`)] }),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("CERTIFICATIONS")] }),
                    ...data.certifications.map(cert => {
                        const cleanText = cert.link ? cert.text.replace(/\s*-\s*$/, '') : cert.text;
                        const parts = cleanText.split(/(\(.*?\)|- \d{4}|- Reference)/);
                        const children = [new TextRun("- "), ...parts.map(p => (p.match(/^\(.*?\)$/) || p.match(/^- \d{4}$/) || p === '- Reference') ? new TextRun(p) : new TextRun({ text: p, bold: true }))];
                        if (cert.link) {
                            children.push(
                                new TextRun(" - "),
                                new ExternalHyperlink({ link: cert.link, children: [new TextRun({ text: "Reference", style: "Hyperlink" })] }) as unknown as TextRun
                            );
                        }
                        return new Paragraph({ style: "Compact", children });
                    }),

                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("LANGUAGES")] }),
                    ...data.languages.map(lang => new Paragraph({ style: "Compact", children: [new TextRun(`- ${lang}`)] })),
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);
    }
}