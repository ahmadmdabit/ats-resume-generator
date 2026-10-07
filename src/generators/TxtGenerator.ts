import * as fs from 'fs';
import { GeneratorOptions, ILayoutGenerator, LANG } from '../core/interfaces.js';
import { LayoutLine, ResumeLayout } from '../core/models.js';
import { getLocale } from '../i18n/locales.js';

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
            ? this.localizeHeading(this.toUpperTr(this.stripInline(line.text), lang), lang)
            : this.stripInline(line.text);
        return `${pad}${text}`;
    }

    // Turkish-aware toUpperCase. JS toUpperCase() maps 'i'→'I' (not 'İ'),
    // so 'Teknik Beceriler' becomes 'TEKNIK BECERILER' instead of 'TEKNİK BECERİLER'.
    // Only apply Turkish replacements for Turkish headings; English headings
    // like 'PROFESSIONAL SUMMARY' must not be affected.
    // We detect Turkish headings by checking if the uppercase version (with
    // Turkish chars restored) matches a known Turkish heading.
    private toUpperTr(text: string, lang: LANG): string {
        const locale = getLocale(lang);
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
        if (locale.trHeadingsUpper.has(trUpper)) return trUpper;
        return text.toUpperCase();
    }

    private localizeHeading(heading: string, lang: LANG): string {
        const locale = getLocale(lang);
        if (lang === 'tr' && locale.sectionHeadings[heading]) {
            return locale.sectionHeadings[heading];
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
