import { IResumeParser } from '../core/interfaces';
import { ResumeData } from '../core/models';

export class JsonParser implements IResumeParser {
    parse(input: string): ResumeData {
        try { return JSON.parse(input) as ResumeData; } 
        catch { throw new Error('Invalid JSON format provided.'); }
    }
}