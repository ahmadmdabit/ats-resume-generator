import { ResumeData, ResumeLayout } from './models.js';

export type LANG = 'en' | 'tr';

// Interface Segregation Principle (ISP)
export interface IResumeParser {
    parse(input: string): ResumeData;
}

// Separate concern: layout fidelity. A parser that can report HOW the source was
// laid out implements this alongside IResumeParser. Consumers that only need the
// semantic model are unaffected.
export interface ILayoutParser {
    parseLayout(input: string): ResumeLayout;
}

// Options that control generator output behavior.
export interface GeneratorOptions {
    noBlankLines?: boolean;
}

export interface IResumeGenerator {
    generate(data: ResumeData, outputPath: string, lang: LANG, options?: GeneratorOptions): Promise<void>;
}

// Text generators render the layout model so output shape matches the source.
export interface ILayoutGenerator {
    generateFromLayout(layout: ResumeLayout, outputPath: string, lang: LANG, options?: GeneratorOptions): Promise<void>;
}