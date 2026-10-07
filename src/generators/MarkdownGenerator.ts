import * as fs from 'fs';
import { GeneratorOptions, ILayoutGenerator, LANG } from '../core/interfaces.js';
import { LayoutLine, ResumeLayout } from '../core/models.js';
import { getLocale } from '../i18n/locales.js';

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
            const locale = getLocale(lang);
            const localized = lang === 'tr' && locale.sectionHeadings[raw.toUpperCase()]
                ? locale.sectionHeadings[raw.toUpperCase()]
                : raw;
            return `${pad}## ${localized}`;
        }
        return `${pad}${line.text}`;
    }
}
