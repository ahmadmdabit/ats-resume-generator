import { ResumeData } from './models.js';

export type LANG = 'en' | 'tr';

// Interface Segregation Principle (ISP)
export interface IResumeParser {
    parse(input: string): ResumeData;
}

export interface IResumeGenerator {
    generate(data: ResumeData, outputPath: string, lang: LANG): Promise<void>;
}