const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Experience-API-Version'],
    exposedHeaders: ['X-Experience-API-Version'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// xAPI Version middleware - MUST be before routes
app.use((req, res, next) => {
    // Set xAPI version header on all responses
    res.setHeader('X-Experience-API-Version', '1.0.3');
    
    // For xAPI endpoints, validate version
    if (req.path.startsWith('/xapi/')) {
        const clientVersion = req.headers['x-experience-api-version'];
        
        // Version is required for xAPI endpoints
        if (!clientVersion) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'X-Experience-API-Version header is required'
            });
        }
        
        // Support versions 1.0.0, 1.0.1, 1.0.2, 1.0.3
        const supportedVersions = ['1.0.0', '1.0.1', '1.0.2', '1.0.3'];
        if (!supportedVersions.includes(clientVersion)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `xAPI Version ${clientVersion} is not supported. Supported versions: ${supportedVersions.join(', ')}`
            });
        }
    }
    
    next();
});

// In-memory storage for statements
let statements = [];
let credentials = {
    key: process.env.XAPI_KEY || 'demo-key-' + Math.random().toString(36).substring(7),
    secret: process.env.XAPI_SECRET || 'demo-secret-' + Math.random().toString(36).substring(7)
};

console.log('='.repeat(60));
console.log('🎓 xAPI LRS Server Starting...');
console.log('='.repeat(60));
console.log('Credentials:');
console.log('  Key:', credentials.key);
console.log('  Secret:', credentials.secret);
console.log('='.repeat(60));

// Basic Auth middleware
function validateAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header'
        });
    }

    try {
        const base64Credentials = authHeader.substring(6);
        const credentials_str = Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [key, secret] = credentials_str.split(':');

        if (key !== credentials.key || secret !== credentials.secret) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid Authorization header format'
        });
    }
}

// Validate xAPI statement
function validateXAPIStatement(statement) {
    const errors = [];

    // Required properties
    if (!statement.actor) {
        errors.push("Missing required property: actor");
    } else {
        if (!statement.actor.mbox && !statement.actor.mbox_sha1sum && 
            !statement.actor.openid && !statement.actor.account) {
            errors.push("Actor must have at least one IFI (mbox, mbox_sha1sum, openid, or account)");
        }
    }

    if (!statement.verb) {
        errors.push("Missing required property: verb");
    } else {
        if (!statement.verb.id) {
            errors.push("Verb must have an 'id' property (IRI)");
        }
    }

    if (!statement.object) {
        errors.push("Missing required property: object");
    } else {
        if (statement.object.objectType === "Activity" || !statement.object.objectType) {
            if (!statement.object.id) {
                errors.push("Activity object must have an 'id' property (IRI)");
            }
        }
    }

    // Validate IRI format for verb.id
    if (statement.verb && statement.verb.id) {
        try {
            new URL(statement.verb.id);
        } catch (e) {
            errors.push("Verb id must be a valid IRI (URL)");
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// API Routes

// Handle OPTIONS preflight for CORS
app.options('/xapi/statements', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Experience-API-Version');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('X-Experience-API-Version', '1.0.3');
    res.status(200).end();
});

// Get credentials (for initial setup)
app.get('/api/credentials', (req, res) => {
    res.json({
        host: req.protocol + '://' + req.get('host'),
        endpoint: req.protocol + '://' + req.get('host') + '/xapi/statements',
        key: credentials.key,
        secret: credentials.secret
    });
});

// xAPI Statements endpoint (POST)
app.post('/xapi/statements', validateAuth, (req, res) => {
    const statement = req.body;
    
    console.log('📨 Received xAPI statement (POST)');
    
    // Validate statement
    const validation = validateXAPIStatement(statement);
    
    // Add ID if not present
    if (!statement.id) {
        statement.id = generateUUID();
    }
    
    // Add stored timestamp
    const storedStatement = {
        ...statement,
        stored: new Date().toISOString()
    };
    
    // Store statement
    const record = {
        id: statement.id,
        statement: storedStatement,
        timestamp: new Date().toISOString(),
        valid: validation.valid,
        errors: validation.errors
    };
    
    statements.unshift(record);
    
    // Keep only last 1000 statements
    if (statements.length > 1000) {
        statements = statements.slice(0, 1000);
    }
    
    console.log(`  ✓ Stored (${validation.valid ? 'VALID' : 'INVALID'}):`, statement.id);
    
    // Return appropriate response
    if (validation.valid) {
        res.status(200).json([statement.id]);
    } else {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid xAPI statement',
            errors: validation.errors
        });
    }
});

// xAPI Statements endpoint (PUT) - for single statement with ID in URL
app.put('/xapi/statements', validateAuth, (req, res) => {
    const statement = req.body;
    const statementId = req.query.statementId;
    
    console.log('📨 Received xAPI statement (PUT)');
    
    // If statementId in query, use that
    if (statementId) {
        statement.id = statementId;
    }
    
    // Validate statement
    const validation = validateXAPIStatement(statement);
    
    // Add ID if not present
    if (!statement.id) {
        statement.id = generateUUID();
    }
    
    // Add stored timestamp
    const storedStatement = {
        ...statement,
        stored: new Date().toISOString()
    };
    
    // Store statement
    const record = {
        id: statement.id,
        statement: storedStatement,
        timestamp: new Date().toISOString(),
        valid: validation.valid,
        errors: validation.errors
    };
    
    statements.unshift(record);
    
    // Keep only last 1000 statements
    if (statements.length > 1000) {
        statements = statements.slice(0, 1000);
    }
    
    console.log(`  ✓ Stored (${validation.valid ? 'VALID' : 'INVALID'}):`, statement.id);
    
    // Return appropriate response
    if (validation.valid) {
        res.status(204).end(); // PUT returns 204 No Content for success
    } else {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid xAPI statement',
            errors: validation.errors
        });
    }
});

// xAPI Statements endpoint (GET)
app.get('/xapi/statements', validateAuth, (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const validOnly = statements.filter(s => s.valid);
    
    res.json({
        statements: validOnly.slice(0, limit).map(s => s.statement),
        more: ''
    });
});

// Get all statements (for dashboard)
app.get('/api/statements', (req, res) => {
    res.json({
        statements: statements,
        total: statements.length,
        valid: statements.filter(s => s.valid).length,
        invalid: statements.filter(s => s.invalid).length
    });
});

// Clear all statements
app.delete('/api/statements', (req, res) => {
    statements = [];
    res.json({ message: 'All statements cleared' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        statements: statements.length,
        uptime: process.uptime()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Server running on port', PORT);
    console.log('📍 Dashboard: http://localhost:' + PORT);
    console.log('📍 xAPI Endpoint: http://localhost:' + PORT + '/xapi/statements');
    console.log('');
    console.log('Configure your xAPI source with:');
    console.log('  Endpoint: http://localhost:' + PORT + '/xapi/statements');
    console.log('  Key:', credentials.key);
    console.log('  Secret:', credentials.secret);
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
