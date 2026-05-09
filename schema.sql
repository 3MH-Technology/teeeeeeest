CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    
    max_bots INTEGER DEFAULT 3,
    max_cpu_shares INTEGER DEFAULT 1024,
    max_memory_mb INTEGER DEFAULT 512,
    max_deploys_per_hour INTEGER DEFAULT 10,
    
    
    account_fingerprint VARCHAR(64),
    
    
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    
    
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bots (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'CREATING',
    encrypted_env TEXT DEFAULT '{}',
    container_id VARCHAR(100),
    current_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS bot_versions (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(50) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    version_num INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, 
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bot_usage_metrics (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(50) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    cpu_seconds Float NOT NULL,
    memory_mb Float NOT NULL,
    uptime_seconds INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bot_deployments (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(50) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    trace_id VARCHAR(100) NOT NULL,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    logs TEXT
);

CREATE TABLE IF NOT EXISTS bot_logs (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(50) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    log_level VARCHAR(10) DEFAULT 'INFO',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    bot_id VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abuse_flags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'low', 
    metadata JSONB DEFAULT '{}',
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_templates (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    type VARCHAR(20) NOT NULL, 
    category VARCHAR(50) DEFAULT 'utility', 
    code_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bots_user_id ON bots(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bot_logs_bot_id ON bot_logs(bot_id);
CREATE INDEX idx_bot_deployments_bot_id ON bot_deployments(bot_id);
CREATE INDEX idx_audit_logs_bot_id ON audit_logs(bot_id);
CREATE INDEX idx_bot_usage_metrics_bot_id ON bot_usage_metrics(bot_id, timestamp);
CREATE INDEX idx_abuse_flags_user_id ON abuse_flags(user_id);
CREATE INDEX idx_abuse_flags_severity ON abuse_flags(severity) WHERE reviewed = FALSE;
CREATE INDEX idx_community_templates_category ON community_templates(category);
CREATE INDEX idx_users_fingerprint ON users(account_fingerprint);
