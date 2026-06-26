import { ResumeData } from './models';

// Interface Segregation Principle (ISP)
export interface IResumeParser {
    parse(input: string): ResumeData;
}

export interface IResumeGenerator {
    generate(data: ResumeData, outputPath: string): Promise<void>;
}