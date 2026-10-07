import { GeneratorOptions, ILayoutGenerator, ILayoutParser, IResumeGenerator, IResumeParser, LANG } from '../core/interfaces.js';

// Dependency Inversion Principle (DIP): Depends on abstractions.
//
// Two processing paths, one per concern:
//   ResumeService.process()       — semantic: parse to ResumeData, generate (DOCX/PDF)
//   LayoutResumeService.process() — layout:   parse to ResumeLayout, generate (TXT/MD)
export class ResumeService {
    constructor(
        private readonly parser: IResumeParser,
        private readonly generator: IResumeGenerator
    ) {}

    async process(input: string, outputPath: string, lang: LANG = 'en', options?: GeneratorOptions): Promise<void> {
        const data = this.parser.parse(input);
        await this.generator.generate(data, outputPath, lang, options);
    }
}

export class LayoutResumeService {
    constructor(
        private readonly parser: ILayoutParser,
        private readonly generator: ILayoutGenerator
    ) {}

    async process(input: string, outputPath: string, lang: LANG = 'en', options?: GeneratorOptions): Promise<void> {
        const layout = this.parser.parseLayout(input);
        await this.generator.generateFromLayout(layout, outputPath, lang, options);
    }
}
