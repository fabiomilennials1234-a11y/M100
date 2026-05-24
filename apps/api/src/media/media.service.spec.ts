import { MediaService } from './media.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
jest.mock('pdf-parse', () => jest.fn());
jest.mock('mammoth', () => ({ extractRawText: jest.fn() }));
jest.mock('xlsx', () => ({ read: jest.fn(), utils: { sheet_to_csv: jest.fn() } }));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    const configService = { get: jest.fn((key: string) => {
      if (key === 'OPENROUTER_API_KEY') return 'test-key';
      return undefined;
    }) } as unknown as ConfigService;

    service = new MediaService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('audio processing', () => {
    it('transcribes audio via OpenRouter Whisper', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { text: 'Olá, preciso de ajuda com meu pedido' },
      });

      const audioBuffer = Buffer.from('fake-ogg-audio');
      const result = await service.processMedia('audio', audioBuffer);

      expect(result).toBe('Olá, preciso de ajuda com meu pedido');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/audio/transcriptions'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      );
    });

    it('transcribes video by extracting audio', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { text: 'Conteúdo do vídeo transcrito' },
      });

      const videoBuffer = Buffer.from('fake-video');
      const result = await service.processMedia('video', videoBuffer);

      expect(result).toBe('Conteúdo do vídeo transcrito');
    });

    it('returns null for sticker type', async () => {
      const result = await service.processMedia('sticker', Buffer.from('sticker'));
      expect(result).toBeNull();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('image processing', () => {
    it('describes image via OpenRouter vision', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Uma foto de um produto eletrônico' } }],
        },
      });

      const imgBuffer = Buffer.from('fake-png-image');
      const result = await service.processMedia('image', imgBuffer);

      expect(result).toBe('Uma foto de um produto eletrônico');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        }),
        expect.any(Object),
      );
    });
  });

  describe('document processing', () => {
    it('extracts text from PDF via pdf-parse', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({ text: 'Conteúdo do contrato de serviço' });

      const pdfBuffer = Buffer.from('fake-pdf');
      const result = await service.processMedia('document', pdfBuffer, 'application/pdf');

      expect(result).toBe('Conteúdo do contrato de serviço');
    });

    it('extracts text from DOCX via mammoth', async () => {
      const mammoth = require('mammoth');
      mammoth.extractRawText.mockResolvedValueOnce({ value: 'Texto do documento Word' });

      const docxBuffer = Buffer.from('fake-docx');
      const result = await service.processMedia('document', docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      expect(result).toBe('Texto do documento Word');
    });

    it('extracts text from XLSX via xlsx', async () => {
      const XLSX = require('xlsx');
      const mockSheet = { A1: { v: 'Nome' }, B1: { v: 'Valor' }, A2: { v: 'Item1' }, B2: { v: '100' }, '!ref': 'A1:B2' };
      XLSX.read.mockReturnValueOnce({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: mockSheet },
      });
      XLSX.utils.sheet_to_csv.mockReturnValueOnce('Nome,Valor\nItem1,100');

      const xlsxBuffer = Buffer.from('fake-xlsx');
      const result = await service.processMedia('document', xlsxBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      expect(result).toBe('Nome,Valor\nItem1,100');
    });

    it('routes scanned PDF to vision when text extraction is empty', async () => {
      const pdfParse = require('pdf-parse');
      pdfParse.mockResolvedValueOnce({ text: '   ' });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Texto extraído por OCR do PDF' } }],
        },
      });

      const pdfBuffer = Buffer.from('fake-scanned-pdf');
      const result = await service.processMedia('document', pdfBuffer, 'application/pdf');

      expect(result).toBe('Texto extraído por OCR do PDF');
    });
  });
});
