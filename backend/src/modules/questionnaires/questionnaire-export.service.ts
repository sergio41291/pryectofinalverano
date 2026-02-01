import { Injectable } from '@nestjs/common';
import { Questionnaire } from '../../entities/questionnaire.entity';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { Readable } from 'stream';

@Injectable()
export class QuestionnaireExportService {
  exportToJSON(questionnaire: Questionnaire): Buffer {
    const data = {
      name: questionnaire.name,
      description: questionnaire.description,
      status: questionnaire.status,
      createdAt: questionnaire.createdAt,
      totalQuestions: questionnaire.questions.length,
      questions: questionnaire.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };

    return Buffer.from(JSON.stringify(data, null, 2));
  }

  exportToPDF(questionnaire: Questionnaire): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text(questionnaire.name, { align: 'center' });
      doc.moveDown();

      // Description
      if (questionnaire.description) {
        doc.fontSize(11).font('Helvetica').text(questionnaire.description, { align: 'left' });
        doc.moveDown();
      }

      // Metadata
      doc.fontSize(10).font('Helvetica').text(`Created: ${questionnaire.createdAt.toLocaleDateString()}`, { align: 'left' });
      doc.text(`Total Questions: ${questionnaire.questions.length}`);
      doc.moveDown();

      // Questions
      questionnaire.questions.forEach((question, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Question ${index + 1}: ${question.question}`);
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica');
        question.options.forEach((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctAnswer ? ' (Correct)' : '';
          doc.text(`${String.fromCharCode(65 + optionIndex)}. ${option}${isCorrect}`);
        });

        doc.fontSize(10).font('Helvetica-Oblique').text(`Explanation: ${question.explanation}`);
        doc.moveDown();
      });

      doc.end();
    });
  }

  async exportToCSV(questionnaire: Questionnaire): Promise<Buffer> {
    const csvData = questionnaire.questions.map((question, index) => ({
      'Question #': index + 1,
      'Question Text': question.question,
      'Option A': question.options[0] || '',
      'Option B': question.options[1] || '',
      'Option C': question.options[2] || '',
      'Option D': question.options[3] || '',
      'Correct Answer': String.fromCharCode(65 + question.correctAnswer),
      'Explanation': question.explanation,
    }));

    // Create CSV string manually since csv-writer requires file path
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: Record<string, any>) => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    return Buffer.from(csvContent);
  }
}
