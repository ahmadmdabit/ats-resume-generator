import * as fs from 'fs';
import { GeneratorOptions, ILayoutGenerator, LANG } from '../core/interfaces.js';
import { LayoutLine, ResumeLayout } from '../core/models.js';

// Section heading translations: English → Turkish
const SectionTranslations: Record<string, string> = {
    'PROFESSIONAL SUMMARY': 'PROFESYONEL ÖZET',
    'TECHNICAL SKILLS': 'TEKNİK BECERİLER',
    'PROFESSIONAL EXPERIENCE': 'PROFESYONEL DENEYİM',
    'PROJECTS': 'PROJELER',
    'EDUCATION': 'EĞİTİM',
    'CERTIFICATIONS': 'SERTİFİKALAR',
    'LANGUAGES': 'DİLLER',
};

// Renders the layout model as plain text: strips Markdown syntax from the raw
// source text, preserving line structure, indentation, and blank lines.
export class TxtGenerator implements ILayoutGenerator {
    async generateFromLayout(layout: ResumeLayout, outputPath: string, lang: LANG = 'en', options?: GeneratorOptions): Promise<void> {
        void options;
        const out = layout.lines.map(line => this.render(line, lang)).join('\n');
        fs.writeFileSync(outputPath, out, 'utf-8');
    }

    private render(line: LayoutLine, lang: LANG): string {
        if (line.kind === 'blank') return '';
        const pad = ' '.repeat(line.indent);
        const text = line.kind === 'section'
            ? this.localizeHeading(this.toUpperTr(this.stripInline(line.text)), lang)
            : this.stripInline(line.text);
        return `${pad}${text}`;
    }

    // Turkish-aware toUpperCase. JS toUpperCase() maps 'i'→'I' (not 'İ'),
    // so 'Teknik Beceriler' becomes 'TEKNIK BECERILER' instead of 'TEKNİK BECERİLER'.
    // Only apply Turkish replacements for Turkish headings; English headings
    // like 'PROFESSIONAL SUMMARY' must not be affected.
    // We detect Turkish headings by checking if the uppercase version (with
    // Turkish chars restored) matches a known Turkish heading.
    private static readonly TrHeadingsUpper = new Set([
        'PROFESYONEL ÖZET', 'TEKNİK BECERİLER', 'PROFESYONEL DENEYİM',
        'PROJELER', 'EĞİTİM', 'SERTİFİKALAR', 'DİLLER',
    ]);

    private toUpperTr(text: string): string {
        // Apply Turkish-aware uppercase, then check if the result is a known
        // Turkish heading. If not, fall back to plain toUpperCase().
        const trUpper = text
            .replace(/i/g, 'İ')
            .replace(/ı/g, 'I')
            .replace(/ş/g, 'Ş')
            .replace(/ğ/g, 'Ğ')
            .replace(/ü/g, 'Ü')
            .replace(/ö/g, 'Ö')
            .replace(/ç/g, 'Ç')
            .toUpperCase();
        if (TxtGenerator.TrHeadingsUpper.has(trUpper)) return trUpper;
        return text.toUpperCase();
    }

    private localizeHeading(heading: string, lang: LANG): string {
        if (lang === 'tr' && SectionTranslations[heading]) {
            return SectionTranslations[heading];
        }
        return heading;
    }

    private stripInline(text: string): string {
        return text
            .replace(/^#{1,6}\s+/, '')                   // heading markers
            .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')   // bold / italic
            .replace(/`([^`]+)`/g, '$1')                // inline code
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')  // links → text only
            .trimEnd();
    }
}
