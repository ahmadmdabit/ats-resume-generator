import * as fs from 'fs';
import * as pdf from 'pdfjs';
import { IResumeGenerator } from '../core/interfaces';
import { ResumeData } from '../core/models';

const helvetica = require('pdfjs/font/Helvetica');
const helveticaBold = require('pdfjs/font/Helvetica-Bold');
const helveticaOblique = require('pdfjs/font/Helvetica-Oblique');

export class PdfGenerator implements IResumeGenerator {
    async generate(data: ResumeData, outputPath: string): Promise<void> {
        const doc = new pdf.Document({ font: helvetica, padding: 36, lineHeight: 1.15 }); // 36pt = 0.5 inch
        doc.pipe(fs.createWriteStream(outputPath));

        const addHeading1 = (text: string) => {
            const cell = doc.cell({ backgroundColor: 0xD9F2D0, padding: 5 });
            cell.text(text, { font: helveticaBold, fontSize: 20, color: 0x3A7C22, alignment: 'center' });
            doc.text('');
        };
        const addHeading2 = (text: string) => {
            const cell = doc.cell({ backgroundColor: 0xD9F2D0, padding: 5 });
            cell.text(text, { font: helveticaBold, fontSize: 16, color: 0x4EA72E });
            doc.text('');
        };
        const addHeading3 = (text: string) => {
            const cell = doc.cell({ backgroundColor: 0xB3E5A1, padding: 4 });
            cell.text(text, { font: helveticaBold, fontSize: 14, color: 0x3A7C22 });
        };
        const addBullet = (text: string) => doc.text(`    - ${text}`, { fontSize: 11 });

        addHeading1(data.header.name);
        const hText = doc.text({ alignment: 'center', fontSize: 11 });
        hText.add('E-mail: ', { font: helveticaBold }).add(data.header.email).br();
        hText.add('Phone: ', { font: helveticaBold }).add(data.header.phone).br();
        hText.add('Address: ', { font: helveticaBold }).add(data.header.address).br();
        hText.add('Website: ', { font: helveticaBold }).add(data.header.website, { link: data.header.website, color: 0x0563C1, underline: true });
        doc.text('');

        addHeading2('PROFESSIONAL SUMMARY');
        data.summary.forEach(s => doc.text(s, { fontSize: 11 }));
        doc.text('');

        addHeading2('TECHNICAL SKILLS');
        data.skills.forEach(s => {
            const t = doc.text({ fontSize: 11 });
            t.add('- ').add(`${s.category}:`, { color: 0x4EA72E, font: helveticaBold }).add(` ${s.items}`);
        });
        doc.text('');

        addHeading2('PROFESSIONAL EXPERIENCE');
        data.experience.forEach(job => {
            const jH = doc.cell({ backgroundColor: 0xB3E5A1, padding: 4 });
            const jT = jH.text({ font: helveticaBold, fontSize: 14, color: 0x3A7C22 });
            jT.add(`${job.title} - `).add(job.company, { color: 0x4EA72E }).add(`, ${job.location}`);
            doc.text(job.date, { fontSize: 11, font: helveticaOblique, alignment: 'right' });
            job.bullets.forEach(b => addBullet(b));
            doc.text('');
        });

        addHeading2('PROJECTS');
        doc.text(data.projectsIntro, { fontSize: 11 }); doc.text('');
        data.projects.forEach(proj => {
            const pH = doc.cell({ backgroundColor: 0xB3E5A1, padding: 4 });
            const pT = pH.text({ font: helveticaBold, fontSize: 14, color: 0x3A7C22 });
            pT.add(`${proj.title} - `).add(proj.link, { link: proj.link, color: 0x0563C1, underline: true });
            if (proj.subtitle) doc.text(proj.subtitle, { fontSize: 12, font: helveticaBold });
            const techT = doc.text({ fontSize: 11 });
            techT.add('- ').add('Technologies:', { font: helveticaBold }).add(` ${proj.tech}`);
            proj.bullets.forEach(b => addBullet(b));
            doc.text('');
        });

        addHeading2('EDUCATION');
        addHeading3(data.education.degree);
        doc.text(data.education.date, { fontSize: 11, font: helveticaOblique, alignment: 'right' });
        addBullet(data.education.institution); doc.text('');

        addHeading2('CERTIFICATIONS');
        data.certifications.forEach(cert => {
            const t = doc.text({ fontSize: 11 }); t.add('- ');
            cert.text.split(/(\(.*?\)|- \d{4}|- Reference)/).forEach(p => {
                if (p.match(/^\(.*?\)$/) || p.match(/^- \d{4}$/) || p === '- Reference') t.add(p);
                else t.add(p, { font: helveticaBold });
            });
            if (cert.link) t.add(' - ').add('Reference', { link: cert.link, color: 0x0563C1, underline: true });
        });
        doc.text('');

        addHeading2('LANGUAGES');
        data.languages.forEach(lang => doc.text(`- ${lang}`, { fontSize: 11 }));

        await doc.end();
    }
}