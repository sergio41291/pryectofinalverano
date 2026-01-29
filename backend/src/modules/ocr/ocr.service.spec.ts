import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { OcrService } from './ocr.service';
import { OcrResult } from './entities/ocr-result.entity';
import { OcrCacheService } from './ocr-cache.service';

describe('OcrService', () => {
  let service: OcrService;
  let mockOcrResultRepository: any;
  let mockOcrQueue: any;
  let mockCacheService: any;

  beforeEach(async () => {
    // Mock repository
    mockOcrResultRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
    };

    // Mock queue
    mockOcrQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    // Mock cache service
    mockCacheService = {
      calculateFileHash: jest.fn(() => 'mocked-hash-123'),
      getCachedResult: jest.fn(() => null),
      saveCachedResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        {
          provide: getRepositoryToken(OcrResult),
          useValue: mockOcrResultRepository,
        },
        {
          provide: getQueueToken('ocr'),
          useValue: mockOcrQueue,
        },
        {
          provide: OcrCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateOcrProcessing', () => {
    it('should create OCR result and queue job', async () => {
      const dto = {
        uploadId: 'upload-123',
        userId: 'user-456',
        language: 'es',
      };

      const mockOcrResult = {
        id: 'ocr-789',
        uploadId: dto.uploadId,
        userId: dto.userId,
        status: 'pending',
      };

      const mockJob = {
        id: 'job-001',
      };

      mockOcrResultRepository.create.mockReturnValue(mockOcrResult);
      mockOcrResultRepository.save.mockResolvedValue(mockOcrResult);
      mockOcrQueue.add.mockResolvedValue(mockJob);

      const result = await service.initiateOcrProcessing(dto);

      expect(result).toEqual(mockOcrResult);
      expect(mockOcrResultRepository.create).toHaveBeenCalledWith({
        uploadId: dto.uploadId,
        userId: dto.userId,
        status: 'pending',
      });
      expect(mockOcrQueue.add).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      const dto = {
        uploadId: 'upload-123',
        userId: 'user-456',
      };

      mockOcrResultRepository.create.mockReturnValue({});
      mockOcrResultRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.initiateOcrProcessing(dto)).rejects.toThrow();
    });
  });

  describe('getOcrResult', () => {
    it('should return OCR result by uploadId', async () => {
      const mockResult = {
        id: 'ocr-789',
        uploadId: 'upload-123',
        userId: 'user-456',
        status: 'completed',
        extractedText: {
          text: 'Sample text',
          confidence: 0.95,
          language: 'es',
        },
      };

      mockOcrResultRepository.findOne.mockResolvedValue(mockResult);

      const result = await service.getOcrResult('user-456', 'upload-123');

      expect(result).toEqual(mockResult);
      expect(mockOcrResultRepository.findOne).toHaveBeenCalledWith({
        where: {
          uploadId: 'upload-123',
          userId: 'user-456',
        },
      });
    });

    it('should throw NotFoundException when result not found', async () => {
      mockOcrResultRepository.findOne.mockResolvedValue(null);

      await expect(service.getOcrResult('user-456', 'upload-123')).rejects.toThrow(
        'OCR result not found',
      );
    });
  });

  describe('getOcrResultById', () => {
    it('should return OCR result by ID', async () => {
      const mockResult = {
        id: 'ocr-789',
        uploadId: 'upload-123',
        userId: 'user-456',
        status: 'completed',
      };

      mockOcrResultRepository.findOne.mockResolvedValue(mockResult);

      const result = await service.getOcrResultById('ocr-789', 'user-456');

      expect(result).toEqual(mockResult);
      expect(mockOcrResultRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'ocr-789',
          userId: 'user-456',
        },
      });
    });
  });

  describe('listUserOcrResults', () => {
    it('should return paginated OCR results', async () => {
      const mockResults = [
        { id: 'ocr-1', uploadId: 'upload-1', status: 'completed' },
        { id: 'ocr-2', uploadId: 'upload-2', status: 'processing' },
      ];

      mockOcrResultRepository.findAndCount.mockResolvedValue([mockResults, 2]);

      const result = await service.listUserOcrResults('user-456', 20, 0);

      expect(result.results).toEqual(mockResults);
      expect(result.total).toBe(2);
      expect(mockOcrResultRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('updateOcrResult', () => {
    it('should update OCR result', async () => {
      const mockUpdatedResult = {
        id: 'ocr-789',
        status: 'completed',
      };

      mockOcrResultRepository.update.mockResolvedValue({});
      mockOcrResultRepository.findOneBy.mockResolvedValue(mockUpdatedResult);

      const result = await service.updateOcrResult('ocr-789', { status: 'completed' });

      expect(result).toEqual(mockUpdatedResult);
      expect(mockOcrResultRepository.update).toHaveBeenCalledWith('ocr-789', {
        status: 'completed',
      });
    });

    it('should throw NotFoundException when updating non-existent result', async () => {
      mockOcrResultRepository.update.mockResolvedValue({});
      mockOcrResultRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateOcrResult('non-existent', { status: 'completed' }),
      ).rejects.toThrow('OCR result not found');
    });
  });
});
