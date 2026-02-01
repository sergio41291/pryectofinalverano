import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { MindMapsService } from './mind-maps.service';
import { GenerateMindMapDto } from './dto/mind-map.dto';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('mind-maps')
@UseGuards(AuthGuard('jwt'))
export class MindMapsController {
  private readonly logger = new Logger(MindMapsController.name);

  constructor(private readonly mindMapsService: MindMapsService) {}

  /**
   * Generate mind map from text
   * POST /api/mind-maps/generate
   */
  @Post('generate')
  async generateMindMap(@Body() dto: GenerateMindMapDto, @Req() req: AuthRequest) {
    try {
      this.logger.log(`User ${req.user.id} generating mind map from ${dto.text.length} chars`);
      
      const mindMap = await this.mindMapsService.generateMindMap(req.user.id, dto);
      
      return {
        success: true,
        data: mindMap,
      };
    } catch (error: any) {
      this.logger.error(`Generate mind map error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all my mind maps
   * GET /api/mind-maps?page=1&limit=10
   */
  @Get()
  async getMindMaps(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: AuthRequest,
  ) {
    try {
      const result = await this.mindMapsService.getMindMaps(req.user.id, page, limit);
      
      return {
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      };
    } catch (error: any) {
      this.logger.error(`Get mind maps error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specific mind map
   * GET /api/mind-maps/:id
   */
  @Get(':id')
  async getMindMap(@Param('id') id: string, @Req() req: AuthRequest) {
    try {
      const mindMap = await this.mindMapsService.getMindMap(id, req.user.id);
      
      return {
        success: true,
        data: mindMap,
      };
    } catch (error: any) {
      this.logger.error(`Get mind map error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download mind map as JSON
   * GET /api/mind-maps/:id/download
   */
  @Get(':id/download')
  async downloadMindMap(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    try {
      const { content, fileName } = await this.mindMapsService.getMindMapDownload(id, req.user.id);

      res.set({
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/json',
      });

      res.send(content);
    } catch (error: any) {
      this.logger.error(`Download mind map error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete mind map
   * DELETE /api/mind-maps/:id
   */
  @Delete(':id')
  async deleteMindMap(@Param('id') id: string, @Req() req: AuthRequest) {
    try {
      await this.mindMapsService.deleteMindMap(id, req.user.id);
      
      return {
        success: true,
        message: 'Mind map deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Delete mind map error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update node positions
   * PUT /api/mind-maps/:id/positions
   */
  @Put(':id/positions')
  async updatePositions(
    @Param('id') id: string,
    @Body() body: { nodes: any[] },
    @Req() req: AuthRequest,
  ) {
    try {
      const mindMap = await this.mindMapsService.updateMindMapPositions(
        id,
        req.user.id,
        body.nodes,
      );
      
      return {
        success: true,
        data: mindMap,
      };
    } catch (error: any) {
      this.logger.error(`Update positions error: ${error.message}`);
      throw error;
    }
  }
}
