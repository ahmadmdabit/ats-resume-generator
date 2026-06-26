import { IResumeParser, IResumeGenerator } from '../core/interfaces';

// Dependency Inversion Principle (DIP): Depends on abstractions
export class ResumeService {
    constructor(
        private readonly parser: IResumeParser,
        private readonly generator: IResumeGenerator
    ) {}

    async process(input: string, outputPath: string): Promise<void> {
        const data = this.parser.parse(input);
        await this.generator.generate(data, outputPath);
    }
}