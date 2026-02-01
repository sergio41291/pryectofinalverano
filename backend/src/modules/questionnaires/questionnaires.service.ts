import { Injectable, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Questionnaire } from '../../entities/questionnaire.entity';
import { QuestionnaireResponse } from '../../entities/questionnaire-response.entity';
import { QuestionnaireShare } from '../../entities/questionnaire-share.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { CreateQuestionnaireShareDto } from './dto/create-questionnaire-share.dto';
import { SubmitQuestionnaireResponseDto } from './dto/submit-questionnaire-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(QuestionnaireResponse)
    private responseRepository: Repository<QuestionnaireResponse>,
    @InjectRepository(QuestionnaireShare)
    private shareRepository: Repository<QuestionnaireShare>,
  ) {}

  async create(userId: string, createQuestionnaireDto: CreateQuestionnaireDto) {
    const questionnaire = this.questionnaireRepository.create({
      ...createQuestionnaireDto,
      userId,
      status: createQuestionnaireDto.status || 'draft',
    });

    return this.questionnaireRepository.save(questionnaire);
  }

  async findAllByUser(userId: string) {
    return this.questionnaireRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id },
      relations: ['responses'],
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    return questionnaire;
  }

  async update(id: string, userId: string, updateDto: Partial<CreateQuestionnaireDto>) {
    const questionnaire = await this.findById(id);

    if (questionnaire.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this questionnaire');
    }

    Object.assign(questionnaire, updateDto);
    return this.questionnaireRepository.save(questionnaire);
  }

  async delete(id: string, userId: string) {
    const questionnaire = await this.findById(id);

    if (questionnaire.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this questionnaire');
    }

    await this.questionnaireRepository.delete(id);
  }

  async submitResponse(
    questionnaireId: string,
    submitDto: SubmitQuestionnaireResponseDto,
    shareToken: string | null,
    ipAddress: string,
    userAgent: string,
  ) {
    const questionnaire = await this.findById(questionnaireId);

    // Validate access if shareToken is provided
    if (shareToken) {
      const shareConfig = await this.shareRepository.findOne({
        where: { shareToken },
      });

      if (!shareConfig) {
        throw new ForbiddenException('Invalid share token');
      }

      // Check if share is still valid - compare ISO strings
      const now = new Date().toISOString().slice(0, 19);
      
      if (shareConfig.validUntil && now > shareConfig.validUntil) {
        throw new ForbiddenException('This questionnaire is no longer available');
      }

      if (shareConfig.validFrom && now < shareConfig.validFrom) {
        throw new ForbiddenException('This questionnaire is not yet available');
      }
    }

    // Calculate score and add isCorrect flag to each answer
    let correctAnswers = 0;
    const answersWithCorrectFlag = submitDto.answers.map((answer) => {
      const question = questionnaire.questions.find((q) => q.id === answer.questionId);
      const isCorrect = question && answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) {
        correctAnswers++;
      }
      return {
        questionId: answer.questionId,
        selectedIndex: answer.selectedAnswer,
        isCorrect: !!isCorrect,
      };
    });

    const score = (correctAnswers / questionnaire.questions.length) * 100;

    // Save response
    const response = this.responseRepository.create({
      questionnaireId,
      respondentName: submitDto.respondentName,
      respondentEmail: submitDto.respondentEmail,
      answers: answersWithCorrectFlag,
      totalQuestions: questionnaire.questions.length,
      correctAnswers,
      score,
      ipAddress,
      userAgent,
    });

    const savedResponse = await this.responseRepository.save(response);

    // Update questionnaire statistics
    await this.updateQuestionnaireStats(questionnaireId);

    return savedResponse;
  }

  async updateQuestionnaireStats(questionnaireId: string) {
    const responses = await this.responseRepository.find({
      where: { questionnaireId },
    });

    const questionnaire = await this.findById(questionnaireId);
    questionnaire.totalResponses = responses.length;
    questionnaire.averageScore = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.score, 0) / responses.length 
      : 0;

    await this.questionnaireRepository.save(questionnaire);
  }

  async getStats(id: string, userId: string) {
    const questionnaire = await this.findById(id);

    if (questionnaire.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view these statistics');
    }

    const responses = await this.responseRepository.find({
      where: { questionnaireId: id },
    });

    const questionStats = questionnaire.questions.map((question, questionIndex) => {
      const correctCount = responses.filter(r => {
        const answer = r.answers.find(a => a.questionId === question.id);
        if (!answer) return false;
        
        // Handle both new format (with isCorrect) and old format (without it)
        if (answer.isCorrect !== undefined) {
          return answer.isCorrect;
        }
        
        // For legacy answers without isCorrect, calculate it
        // Check if selectedIndex OR selectedAnswer matches the correct answer
        const selectedValue = (answer as any).selectedIndex !== undefined 
          ? (answer as any).selectedIndex 
          : (answer as any).selectedAnswer;
        
        return selectedValue === question.correctAnswer;
      }).length;

      return {
        questionIndex,
        questionText: question.question,
        accuracy: responses.length > 0 ? (correctCount / responses.length) * 100 : 0,
        correctCount,
        totalResponses: responses.length,
      };
    });

    const scores = responses.map(r => parseFloat(String(r.score)) || 0);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      totalResponses: responses.length,
      averageScore: questionnaire.averageScore || 0,
      highestScore,
      lowestScore,
      questionStats,
      responses: responses.map(r => ({
        respondentName: r.respondentName,
        respondentEmail: r.respondentEmail,
        score: r.score,
        submittedAt: r.answeredAt,
      })),
    };
  }

  async configureShare(id: string, userId: string, shareDto: CreateQuestionnaireShareDto) {
    const questionnaire = await this.findById(id);

    if (questionnaire.userId !== userId) {
      throw new ForbiddenException('You do not have permission to share this questionnaire');
    }

    // Check if there's an existing share config
    const existingConfig = await this.shareRepository.findOne({
      where: { questionnaireId: id },
    });

    const shareToken = existingConfig?.shareToken || uuidv4();
    
    // Update or create share config - store dates as strings
    const shareConfig = this.shareRepository.create({
      ...(existingConfig && { id: existingConfig.id }), // Keep the same config if exists
      questionnaireId: id,
      shareType: shareDto.shareType,
      sharePassword: shareDto.sharePassword || undefined,
      allowedEmails: shareDto.allowedEmails || undefined,
      validFrom: shareDto.validFrom || undefined, // Store as string
      validUntil: shareDto.validUntil || undefined, // Store as string
      shareToken,
    } as any);

    return this.shareRepository.save(shareConfig);
  }

  async getShareConfig(id: string, userId: string) {
    const questionnaire = await this.findById(id);

    if (questionnaire.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this share configuration');
    }

    const config = await this.shareRepository.findOne({
      where: { questionnaireId: id },
    });

    if (!config) {
      throw new NotFoundException('No share configuration found for this questionnaire');
    }

    return config;
  }

  async validateShareAccess(shareToken: string, email?: string) {
    const shareConfig = await this.shareRepository.findOne({
      where: { shareToken },
    });

    if (!shareConfig) {
      throw new NotFoundException('Share token not found');
    }

    // Check time validity - compare ISO strings
    const now = new Date().toISOString().slice(0, 19); // "2026-02-01T10:30:45"
    
    if (shareConfig.validFrom && now < shareConfig.validFrom) {
      throw new HttpException({
        requiresType: 'date',
        message: 'This questionnaire is not yet available',
        availableFrom: shareConfig.validFrom,
      }, 425); // Too Early
    }

    if (shareConfig.validUntil && now > shareConfig.validUntil) {
      throw new HttpException({
        requiresType: 'date',
        message: 'This questionnaire is no longer available',
        availableUntil: shareConfig.validUntil,
      }, 410); // Gone
    }

    // Check share type
    if (shareConfig.shareType === 'password') {
      throw new BadRequestException({ requiresType: 'password', message: 'This questionnaire is password protected' });
    }

    if (shareConfig.shareType === 'email') {
      if (!email || !shareConfig.allowedEmails.includes(email)) {
        throw new BadRequestException({ requiresType: 'email', message: 'Your email is not authorized to access this questionnaire' });
      }
    }

    if (shareConfig.shareType === 'private') {
      throw new ForbiddenException('This questionnaire is private and not available for public access');
    }

    // Increment access count
    shareConfig.accessCount++;
    await this.shareRepository.save(shareConfig);

    return await this.findById(shareConfig.questionnaireId);
  }

  async authenticateShare(shareToken: string, password?: string, email?: string) {
    const shareConfig = await this.shareRepository.findOne({
      where: { shareToken },
    });

    if (!shareConfig) {
      throw new NotFoundException('Share token not found');
    }

    // Verify password if needed
    if (shareConfig.shareType === 'password') {
      if (!password || password !== shareConfig.sharePassword) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Verify email if needed
    if (shareConfig.shareType === 'email') {
      if (!email || !shareConfig.allowedEmails.includes(email)) {
        throw new ForbiddenException('Your email is not authorized to access this questionnaire');
      }
    }

    // Increment access count
    shareConfig.accessCount++;
    await this.shareRepository.save(shareConfig);

    const questionnaire = await this.findById(shareConfig.questionnaireId);

    return {
      questionnaire,
      shareToken,
    };
  }
}
