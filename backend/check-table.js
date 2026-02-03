const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'learpmind',
  });

  try {
    await client.connect();
    
    // Check if translations table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'translations'
    `);
    
    console.log('Table exists:', result.rows.length > 0);
    
    if (result.rows.length === 0) {
      console.log('Creating translations table...');
      
      // Create the table manually
      await client.query(`
        CREATE TABLE IF NOT EXISTS "translations" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "title" varchar(500) NOT NULL,
          "originalText" text NOT NULL,
          "translatedText" text NOT NULL,
          "sourceLanguage" varchar(10) NOT NULL,
          "targetLanguage" varchar(10) NOT NULL,
          "sourceFileName" varchar(255),
          "originalCharCount" integer,
          "translatedCharCount" integer,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "FK_translations_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
      
      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS "IDX_translations_userId" ON "translations" ("userId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS "IDX_translations_createdAt" ON "translations" ("createdAt")`);
      
      console.log('Translations table created successfully!');
    } else {
      console.log('Translations table already exists');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTable();
