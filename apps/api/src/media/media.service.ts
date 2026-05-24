import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');

@Injectable()
export class MediaService {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY') ?? '';
  }

  async processMedia(type: string, buffer: Buffer, mimeType?: string): Promise<string | null> {
    switch (type) {
      case 'audio':
        return this.transcribeAudio(buffer);
      case 'video':
        return this.transcribeVideo(buffer);
      case 'image':
        return this.describeImage(buffer);
      case 'document':
        return this.processDocument(buffer, mimeType ?? '');
      case 'sticker':
        return null;
      default:
        return null;
    }
  }

  private async transcribeAudio(buffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), 'audio.ogg');
    formData.append('model', 'whisper-1');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return response.data.text;
  }

  private async transcribeVideo(buffer: Buffer): Promise<string> {
    return this.transcribeAudio(buffer);
  }

  private async describeImage(buffer: Buffer): Promise<string> {
    const base64 = buffer.toString('base64');
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Descreva o conteúdo desta imagem em detalhes. Se houver texto, transcreva-o.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  private async processDocument(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType.includes('pdf')) {
      return this.processPdf(buffer);
    }
    if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) {
      return this.processDocx(buffer);
    }
    if (mimeType.includes('spreadsheetml') || mimeType.includes('xlsx')) {
      return this.processXlsx(buffer);
    }
    return null as unknown as string;
  }

  private async processPdf(buffer: Buffer): Promise<string> {
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();

    if (!text) {
      return this.describeImage(buffer);
    }

    return text;
  }

  private async processDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private async processXlsx(buffer: Buffer): Promise<string> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames
      .map((name: string) => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
      .join('\n');
  }
}
