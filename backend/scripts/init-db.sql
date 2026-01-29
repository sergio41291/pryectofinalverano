-- ============================================
-- LearnMind AI - Inicialización PostgreSQL
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear schema
CREATE SCHEMA IF NOT EXISTS learpmind;

-- Comentarios del schema
COMMENT ON SCHEMA learpmind IS 'Schema principal para LearnMind AI';

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS learpmind.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT email_not_empty CHECK (email != '')
);

CREATE INDEX idx_users_email ON learpmind.users(email);
CREATE INDEX idx_users_is_active ON learpmind.users(is_active);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS learpmind.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10, 2),
  docs_per_month INT,
  max_file_size BIGINT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de suscripciones de usuario
CREATE TABLE IF NOT EXISTS learpmind.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  subscription_tier_id UUID NOT NULL REFERENCES learpmind.subscription_tiers(id),
  documents_used INT DEFAULT 0,
  renewal_date TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_subscriptions_user_id ON learpmind.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON learpmind.user_subscriptions(is_active);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS learpmind.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(10),
  icon VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON learpmind.categories(user_id);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS learpmind.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES learpmind.categories(id) ON DELETE SET NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_key VARCHAR(500) UNIQUE NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  original_url VARCHAR(1000),
  storage_location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'archived'))
);

CREATE INDEX idx_documents_user_id ON learpmind.documents(user_id);
CREATE INDEX idx_documents_category_id ON learpmind.documents(category_id);
CREATE INDEX idx_documents_status ON learpmind.documents(status);
CREATE INDEX idx_documents_created_at ON learpmind.documents(created_at);

-- Tabla de resultados de procesamiento
CREATE TABLE IF NOT EXISTS learpmind.processing_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES learpmind.documents(id) ON DELETE CASCADE,
  result_type VARCHAR(50) NOT NULL,
  result_data JSONB,
  tokens_used INT,
  processing_time_ms INT,
  error_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_result_type CHECK (result_type IN ('ocr', 'summary', 'mindmap', 'conceptmap', 'translate', 'tts')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_processing_results_document_id ON learpmind.processing_results(document_id);
CREATE INDEX idx_processing_results_type ON learpmind.processing_results(result_type);
CREATE INDEX idx_processing_results_status ON learpmind.processing_results(status);

-- Tabla de grupos
CREATE TABLE IF NOT EXISTS learpmind.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url VARCHAR(500),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_groups_owner_id ON learpmind.groups(owner_id);

-- Tabla de miembros del grupo
CREATE TABLE IF NOT EXISTS learpmind.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES learpmind.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(group_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE INDEX idx_group_members_group_id ON learpmind.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON learpmind.group_members(user_id);

-- Tabla de documentos compartidos en grupo
CREATE TABLE IF NOT EXISTS learpmind.group_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES learpmind.groups(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES learpmind.documents(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES learpmind.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(group_id, document_id)
);

CREATE INDEX idx_group_documents_group_id ON learpmind.group_documents(group_id);
CREATE INDEX idx_group_documents_document_id ON learpmind.group_documents(document_id);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS learpmind.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES learpmind.users(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  subscription_tier_id UUID REFERENCES learpmind.subscription_tiers(id),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded'))
);

CREATE INDEX idx_payments_user_id ON learpmind.payments(user_id);
CREATE INDEX idx_payments_status ON learpmind.payments(status);
CREATE INDEX idx_payments_stripe_id ON learpmind.payments(stripe_payment_id);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS learpmind.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES learpmind.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON learpmind.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON learpmind.audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON learpmind.audit_logs(entity_type, entity_id);

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Insertar tiers de suscripción
INSERT INTO learpmind.subscription_tiers (id, name, display_name, description, monthly_price, docs_per_month, max_file_size, features, is_active)
VALUES 
  (uuid_generate_v4(), 'FREE', 'Gratis', 'Plan gratuito para comenzar', 0, 5, 10485760, '{"ocr": true, "summary": true, "groups": false, "tts": false}', true),
  (uuid_generate_v4(), 'PRO', 'Pro', 'Plan para estudiantes serios', 9.99, 100, 104857600, '{"ocr": true, "summary": true, "mindmap": true, "conceptmap": true, "translate": true, "tts": true, "groups": 3}', true),
  (uuid_generate_v4(), 'BUSINESS', 'Negocios', 'Plan para instituciones', 49.99, 999999, 1073741824, '{"ocr": true, "summary": true, "mindmap": true, "conceptmap": true, "translate": true, "tts": true, "groups": 999999, "api": true}', true)
ON CONFLICT DO NOTHING;

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION learpmind.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER users_update_updated_at BEFORE UPDATE ON learpmind.users
    FOR EACH ROW EXECUTE FUNCTION learpmind.update_updated_at_column();

CREATE TRIGGER categories_update_updated_at BEFORE UPDATE ON learpmind.categories
    FOR EACH ROW EXECUTE FUNCTION learpmind.update_updated_at_column();

CREATE TRIGGER documents_update_updated_at BEFORE UPDATE ON learpmind.documents
    FOR EACH ROW EXECUTE FUNCTION learpmind.update_updated_at_column();

CREATE TRIGGER groups_update_updated_at BEFORE UPDATE ON learpmind.groups
    FOR EACH ROW EXECUTE FUNCTION learpmind.update_updated_at_column();

-- ============================================
-- FULL TEXT SEARCH INDICES
-- ============================================

CREATE INDEX idx_documents_search ON learpmind.documents USING GIN (to_tsvector('spanish', original_filename));
CREATE INDEX idx_categories_search ON learpmind.categories USING GIN (to_tsvector('spanish', name));
