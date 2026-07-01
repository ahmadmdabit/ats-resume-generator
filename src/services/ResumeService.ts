import { IResumeParser, IResumeGenerator, LANG } from '../core/interfaces.js';

// Dependency Inversion Principle (DIP): Depends on abstractions
export class ResumeService {
    constructor(
        private readonly parser: IResumeParser,
        private readonly generator: IResumeGenerator
    ) {}

    async process(input: string, outputPath: string, lang: LANG = 'en'): Promise<void> {
        const data = this.parser.parse(input);
        await this.generator.generate(data, outputPath, lang);
    }
}