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

// Renders the layout model back to Markdown: emits the raw source text
// verbatim. The layout model stores the original syntax, so the output is an
// exact round-trip of the source. No reconstruction, no syntax guessing.
export class MarkdownGenerator implements ILayoutGenerator {
    async generateFromLayout(layout: ResumeLayout, outputPath: string, lang: LANG = 'en', options?: GeneratorOptions): Promise<void> {
        void options;
        const out = layout.lines.map(line => this.render(line, lang)).join('\n');
        fs.writeFileSync(outputPath, out, 'utf-8');
    }

    private render(line: LayoutLine, lang: LANG): string {
        if (line.kind === 'blank') return '';
        const pad = ' '.repeat(line.indent);
        if (line.kind === 'section') {
            // Emit H2 heading verbatim (no uppercasing) for exact .md round-trip.
            // Turkish localization: translate the heading text for TR output.
            const raw = line.text.replace(/^##\s+/, '');
            const localized = lang === 'tr' && SectionTranslations[raw.toUpperCase()]
                ? SectionTranslations[raw.toUpperCase()]
                : raw;
            return `${pad}## ${localized}`;
        }
        return `${pad}${line.text}`;
    }
}
