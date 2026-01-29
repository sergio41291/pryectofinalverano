// ============================================
// LearnMind AI - Inicialización MongoDB
// ============================================

// Cambiar a la base de datos admin
db = db.getSiblingDB('admin');

// Autenticarse con las credenciales root
db.auth('admin', 'mongodb');

// Cambiar a la base de datos de la aplicación
db = db.getSiblingDB('learpmind_dev');

// ============================================
// COLECCIONES
// ============================================

// Colección para almacenar textos OCR extraídos
db.createCollection('ocr_results', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'rawText', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string', description: 'UUID del documento' },
        userId: { bsonType: 'string', description: 'UUID del usuario' },
        rawText: { bsonType: 'string', description: 'Texto extraído sin procesar' },
        cleanedText: { bsonType: 'string', description: 'Texto limpiado y formateado' },
        confidence: { bsonType: 'double', description: 'Nivel de confianza OCR' },
        pages: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              pageNumber: { bsonType: 'int' },
              text: { bsonType: 'string' },
              confidence: { bsonType: 'double' },
              textBoundingBoxes: { bsonType: 'array' }
            }
          }
        },
        processingTimeMs: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para almacenar resúmenes
db.createCollection('summaries', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'summary', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string', description: 'UUID del documento' },
        userId: { bsonType: 'string', description: 'UUID del usuario' },
        summary: { bsonType: 'string', description: 'Resumen completo' },
        summaryShort: { bsonType: 'string', description: 'Resumen corto (1-2 párrafos)' },
        keyPoints: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Puntos clave principales'
        },
        language: { bsonType: 'string', description: 'Idioma del resumen' },
        tokensUsed: { bsonType: 'int', description: 'Tokens usados en Claude API' },
        model: { bsonType: 'string', description: 'Modelo de Claude usado' },
        processingTimeMs: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para mapas mentales
db.createCollection('mindmaps', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'nodes', 'edges', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        nodes: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              id: { bsonType: 'string' },
              label: { bsonType: 'string' },
              level: { bsonType: 'int' },
              description: { bsonType: 'string' },
              color: { bsonType: 'string' }
            }
          },
          description: 'Nodos del mapa mental'
        },
        edges: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              id: { bsonType: 'string' },
              source: { bsonType: 'string' },
              target: { bsonType: 'string' },
              label: { bsonType: 'string' }
            }
          },
          description: 'Conexiones entre nodos'
        },
        layout: { bsonType: 'string', enum: ['radial', 'hierarchical', 'circular'] },
        processingTimeMs: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para mapas conceptuales
db.createCollection('conceptmaps', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'concepts', 'relationships', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        concepts: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              id: { bsonType: 'string' },
              label: { bsonType: 'string' },
              definition: { bsonType: 'string' },
              category: { bsonType: 'string' }
            }
          }
        },
        relationships: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              id: { bsonType: 'string' },
              fromId: { bsonType: 'string' },
              toId: { bsonType: 'string' },
              relationshipType: { bsonType: 'string' },
              label: { bsonType: 'string' }
            }
          }
        },
        processingTimeMs: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para traducciones
db.createCollection('translations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'originalText', 'translatedText', 'targetLanguage'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        originalText: { bsonType: 'string' },
        originalLanguage: { bsonType: 'string' },
        translatedText: { bsonType: 'string' },
        targetLanguage: { bsonType: 'string' },
        provider: { bsonType: 'string', enum: ['google', 'anthropic'] },
        confidence: { bsonType: 'double' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para audios TTS
db.createCollection('text_to_speech', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['documentId', 'text', 'audioUrl', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        documentId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        text: { bsonType: 'string' },
        audioUrl: { bsonType: 'string', description: 'URL en MinIO' },
        audioKey: { bsonType: 'string', description: 'Key en MinIO bucket' },
        audioFormat: { bsonType: 'string' },
        audioSize: { bsonType: 'long' },
        duration: { bsonType: 'double', description: 'Duración en segundos' },
        language: { bsonType: 'string' },
        voice: { bsonType: 'string' },
        provider: { bsonType: 'string', enum: ['elevenlabs', 'google'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Colección para cache de búsquedas
db.createCollection('search_cache', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['query', 'results', 'createdAt'],
      properties: {
        _id: { bsonType: 'objectId' },
        query: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        results: { bsonType: 'array' },
        expiresAt: { bsonType: 'date', description: 'TTL index' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

// ============================================
// ÍNDICES
// ============================================

// OCR Results
db.ocr_results.createIndex({ documentId: 1 });
db.ocr_results.createIndex({ userId: 1 });
db.ocr_results.createIndex({ createdAt: -1 });
db.ocr_results.createIndex({ rawText: 'text', cleanedText: 'text' });

// Summaries
db.summaries.createIndex({ documentId: 1 });
db.summaries.createIndex({ userId: 1 });
db.summaries.createIndex({ createdAt: -1 });
db.summaries.createIndex({ summary: 'text', keyPoints: 'text' });

// Mindmaps
db.mindmaps.createIndex({ documentId: 1 });
db.mindmaps.createIndex({ userId: 1 });
db.mindmaps.createIndex({ createdAt: -1 });

// Conceptmaps
db.conceptmaps.createIndex({ documentId: 1 });
db.conceptmaps.createIndex({ userId: 1 });
db.conceptmaps.createIndex({ createdAt: -1 });

// Translations
db.translations.createIndex({ documentId: 1 });
db.translations.createIndex({ userId: 1 });
db.translations.createIndex({ targetLanguage: 1 });
db.translations.createIndex({ createdAt: -1 });

// Text to Speech
db.text_to_speech.createIndex({ documentId: 1 });
db.text_to_speech.createIndex({ userId: 1 });
db.text_to_speech.createIndex({ createdAt: -1 });

// Search Cache con TTL (expira en 7 días)
db.search_cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.search_cache.createIndex({ userId: 1, query: 1 });

print('✅ MongoDB collections and indices created successfully!');
