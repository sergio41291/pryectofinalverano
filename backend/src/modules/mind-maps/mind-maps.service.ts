import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { MindMap, MindMapStructure } from '../../entities/mind-map.entity';
import { GenerateMindMapDto, MindMapResponseDto } from './dto/mind-map.dto';

@Injectable()
export class MindMapsService {
  private readonly logger = new Logger(MindMapsService.name);
  private readonly client: Anthropic;

  constructor(
    @InjectRepository(MindMap)
    private readonly mindMapRepository: Repository<MindMap>,
  ) {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.warn('ANTHROPIC_API_KEY not set - Mind map features will be disabled');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Generate mind map structure from text using Claude
   */
  async generateMindMapStructure(text: string, language: string = 'es'): Promise<MindMapStructure> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException('Claude API key not configured');
    }

    const systemPrompt = `You are an expert at creating mind maps from text. Extract the main concepts and their relationships.
Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "nodes": [
    {
      "id": "node-1",
      "label": "Main Concept",
      "type": "root",
      "level": 0,
      "position": { "x": 400, "y": 50 }
    },
    {
      "id": "node-2",
      "label": "Sub Concept",
      "type": "branch",
      "level": 1,
      "position": { "x": 200, "y": 200 }
    },
    {
      "id": "node-3",
      "label": "Another Sub",
      "type": "branch",
      "level": 1,
      "position": { "x": 600, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}

CRITICAL POSITIONING RULES:
1. Root node (level 0): Center it at x=400, y=50
2. Level 1 nodes (branches): Spread horizontally 300-400px apart, y=200
   Example: If 3 branches: x=100, x=400, x=700 (all y=200)
3. Level 2 nodes (leaves): Under their parent ±150px horizontally, y=350
   Example: Children of node at x=400: place at x=250, x=400, x=550
4. Ensure NO overlapping: minimum 250px horizontal gap between siblings
5. Vertical spacing: 150px between levels

Rules:
1. Always start with ONE root node (level 0) centered
2. Create hierarchical structure (root → branches → leaves)
3. Use meaningful labels in ${language}
4. Limit to 15 nodes maximum for clarity
5. Each edge must connect existing node IDs
6. Return ONLY the JSON object, nothing else`;

    const userPrompt = `Create a mind map from this text in ${language}:

${text}

Remember: Return ONLY the JSON structure, no explanations.`;

    try {
      this.logger.log(`Generating mind map for ${text.length} chars`);

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      let jsonText = content.text.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse and validate structure
      const structure = JSON.parse(jsonText) as MindMapStructure;

      if (!structure.nodes || !Array.isArray(structure.nodes) || structure.nodes.length === 0) {
        throw new Error('Invalid mind map structure: missing or empty nodes array');
      }

      if (!structure.edges || !Array.isArray(structure.edges)) {
        throw new Error('Invalid mind map structure: missing or invalid edges array');
      }

      // Add metadata
      structure.metadata = {
        totalNodes: structure.nodes.length,
        totalEdges: structure.edges.length,
        maxLevel: Math.max(...structure.nodes.map(n => n.level || 0)),
        generatedAt: new Date(),
      };

      this.logger.log(`Mind map generated: ${structure.nodes.length} nodes, ${structure.edges.length} edges`);

      return structure;
    } catch (error: any) {
      this.logger.error(`Error generating mind map: ${error.message}`);
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Failed to parse mind map structure from AI response');
      }
      throw error;
    }
  }

  /**
   * Generate and save mind map
   */
  async generateMindMap(userId: string, dto: GenerateMindMapDto): Promise<MindMapResponseDto> {
    const structure = await this.generateMindMapStructure(dto.text, dto.language || 'es');

    const title = dto.title || this.extractTitleFromText(dto.text);

    const mindMap = this.mindMapRepository.create({
      userId,
      title,
      sourceText: dto.text,
      structure,
      language: dto.language || 'es',
      sourceCharCount: dto.text.length,
      nodeCount: structure.nodes.length,
    });

    const saved = await this.mindMapRepository.save(mindMap);
    return this.mapToResponse(saved);
  }

  /**
   * Get all mind maps for user with pagination
   */
  async getMindMaps(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: MindMapResponseDto[]; total: number }> {
    const [mindMaps, total] = await this.mindMapRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: mindMaps.map(mm => this.mapToResponse(mm)),
      total,
    };
  }

  /**
   * Get specific mind map
   */
  async getMindMap(id: string, userId: string): Promise<MindMapResponseDto> {
    const mindMap = await this.mindMapRepository.findOne({
      where: { id, userId },
    });

    if (!mindMap) {
      throw new NotFoundException('Mind map not found');
    }

    return this.mapToResponse(mindMap);
  }

  /**
   * Delete mind map
   */
  async deleteMindMap(id: string, userId: string): Promise<void> {
    const mindMap = await this.mindMapRepository.findOne({
      where: { id, userId },
    });

    if (!mindMap) {
      throw new NotFoundException('Mind map not found');
    }

    await this.mindMapRepository.delete(id);
  }

  /**
   * Get mind map content for download
   */
  async getMindMapDownload(id: string, userId: string): Promise<{ content: string; fileName: string }> {
    const mindMap = await this.getMindMap(id, userId);

    const fileName = `${mindMap.title.replace(/\s+/g, '_')}_mindmap_${new Date().toISOString().slice(0, 10)}.json`;
    const content = JSON.stringify(mindMap.structure, null, 2);

    return { content, fileName };
  }

  /**
   * Extract title from text (first sentence or first 50 chars)
   */
  private extractTitleFromText(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length > 0 && firstSentence.length <= 100) {
      return firstSentence.trim();
    }
    return text.slice(0, 50).trim() + '...';
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponse(mindMap: MindMap): MindMapResponseDto {
    return {
      id: mindMap.id,
      title: mindMap.title,
      language: mindMap.language,
      sourceCharCount: mindMap.sourceCharCount || 0,
      nodeCount: mindMap.nodeCount || 0,
      structure: mindMap.structure,
      createdAt: mindMap.createdAt,
      updatedAt: mindMap.updatedAt,
    };
  }
}
