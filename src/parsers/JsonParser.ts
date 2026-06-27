import { IResumeParser } from '../core/interfaces.js';
import { ResumeData } from '../core/models.js';

export class JsonParser implements IResumeParser {
    parse(input: string): ResumeData {
        try { return JSON.parse(input) as ResumeData; } 
        catch { throw new Error('Invalid JSON format provided.'); }
    }
}