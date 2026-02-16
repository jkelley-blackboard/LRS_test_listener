const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for statements
let statements = [];
let lrsCredentials = {
    key: process.env.XAPI_KEY || 'key',
    secret: process.env.XAPI_SECRET || 'secret'
};

console.log('='.repeat(60));
console.log('🎓 xAPI LRS Server for Blackboard SCORM Content');
console.log('='.repeat(60));
console.log('Credentials:');
console.log('  Key:', lrsCredentials.key);
console.log('  Secret:', lrsCredentials.secret);
console.log('='.repeat(60));

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Experience-API-Version'],
    exposedHeaders: ['X-Experience-API-Version'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Also parse URL-encoded bodies
app.use(express.static('public'));

// Debug middleware to log all incoming requests to /xapi/statements
app.use('/xapi/statements', (req, res, next) => {
    console.log('='.repeat(60));
    console.log('📥 Incoming Request to /xapi/statements');
    console.log('Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Authorization:', req.headers['authorization'] ? 'Present' : 'Missing');
    console.log('X-Experience-API-Version:', req.headers['x-experience-api-version']);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query Params:', JSON.stringify(req.query, null, 2));
    console.log('Body (parsed):', JSON.stringify(req.body, null, 2));
    console.log('='.repeat(60));
    next();
});

// xAPI Version middleware - MUST be before routes
app.use((req, res, next) => {
    // Set xAPI version header on all responses
    res.setHeader('X-Experience-API-Version', '1.0.3');
    
    // Skip version check for /xapi/about and root /xapi (these endpoints don't require it)
    if (req.path === '/xapi/about' || req.path === '/xapi') {
        return next();
    }
    
    // For other xAPI endpoints, validate version
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

        if (key !== lrsCredentials.key || secret !== lrsCredentials.secret) {
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

// xAPI About endpoint (required by spec) - returns LRS info
app.get('/xapi/about', (req, res) => {
    console.log('📋 About endpoint requested');
    res.setHeader('X-Experience-API-Version', '1.0.3');
    res.json({
        version: ['1.0.3', '1.0.2', '1.0.1', '1.0.0'],
        extensions: {}
    });
});

// xAPI root endpoint - also return about info
app.get('/xapi', (req, res) => {
    console.log('📋 xAPI root endpoint requested');
    res.setHeader('X-Experience-API-Version', '1.0.3');
    res.json({
        version: ['1.0.3', '1.0.2', '1.0.1', '1.0.0'],
        extensions: {}
    });
});

// Get credentials (for initial setup)
app.get('/api/credentials', (req, res) => {
    res.json({
        host: req.protocol + '://' + req.get('host'),
        endpoint: req.protocol + '://' + req.get('host') + '/xapi',
        key: lrsCredentials.key,
        secret: lrsCredentials.secret
    });
});

// xAPI Statements endpoint (POST)
app.post('/xapi/statements', validateAuth, (req, res) => {
    // Debug: log the raw body
    console.log('📨 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📨 Body type:', typeof req.body);
    console.log('📨 Is Array?:', Array.isArray(req.body));
    console.log('📨 Query params:', JSON.stringify(req.query, null, 2));
    
    // Check if statement is in query params (some LMS do this)
    let statementData = req.body;
    
    // If body is empty but we have query params, try those
    if (Object.keys(req.body).length === 0 && Object.keys(req.query).length > 0) {
        console.log('⚠️ Body is empty, checking query params...');
        if (req.query.statement) {
            try {
                statementData = JSON.parse(req.query.statement);
                console.log('✓ Found statement in query param');
            } catch (e) {
                console.log('✗ Failed to parse statement from query param');
            }
        }
    }
    
    let statements_to_process = [];
    
    // xAPI allows both single statement and array of statements
    if (Array.isArray(statementData)) {
        statements_to_process = statementData;
        console.log(`📨 Received ${statements_to_process.length} xAPI statements (POST - array)`);
    } else {
        statements_to_process = [statementData];
        console.log('📨 Received xAPI statement (POST - single)');
    }
    
    const statement_ids = [];
    const errors = [];
    
    // Process each statement
    for (const statement of statements_to_process) {
        console.log('🔍 Processing statement:', JSON.stringify(statement, null, 2));
        
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
        statement_ids.push(statement.id);
        
        if (!validation.valid) {
            errors.push({
                id: statement.id,
                errors: validation.errors
            });
            console.log('  ✗ Validation errors:', validation.errors);
        }
        
        console.log(`  ✓ Stored (${validation.valid ? 'VALID' : 'INVALID'}):`, statement.id);
    }
    
    // Keep only last 1000 statements
    if (statements.length > 1000) {
        statements = statements.slice(0, 1000);
    }
    
    // Return appropriate response
    if (errors.length === 0) {
        // All valid
        res.status(200).json(statement_ids);
    } else if (errors.length === statements_to_process.length) {
        // All invalid
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid xAPI statement(s)',
            errors: errors
        });
    } else {
        // Some valid, some invalid (partial success)
        res.status(200).json(statement_ids);
    }
});

// xAPI Statements endpoint (PUT) - for single statement with ID in URL
app.put('/xapi/statements', validateAuth, (req, res) => {
    let statements_to_process = [];
    const statementId = req.query.statementId;
    
    // xAPI allows both single statement and array of statements
    if (Array.isArray(req.body)) {
        statements_to_process = req.body;
        console.log(`📨 Received ${statements_to_process.length} xAPI statements (PUT - array)`);
    } else {
        statements_to_process = [req.body];
        console.log('📨 Received xAPI statement (PUT - single)');
    }
    
    const errors = [];
    
    // Process each statement
    for (const statement of statements_to_process) {
        // If statementId in query, use that for the first statement
        if (statementId && statements_to_process.indexOf(statement) === 0) {
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
        
        if (!validation.valid) {
            errors.push({
                id: statement.id,
                errors: validation.errors
            });
        }
        
        console.log(`  ✓ Stored (${validation.valid ? 'VALID' : 'INVALID'}):`, statement.id);
    }
    
    // Keep only last 1000 statements
    if (statements.length > 1000) {
        statements = statements.slice(0, 1000);
    }
    
    // Return appropriate response
    if (errors.length === 0) {
        res.status(204).end(); // PUT returns 204 No Content for success
    } else {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid xAPI statement(s)',
            errors: errors
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
    console.log('📍 Blackboard LRS Endpoint: http://localhost:' + PORT + '/xapi');
    console.log('');
    console.log('Configure in Blackboard Learn → Admin → LTI Tool Providers:');
    console.log('  Endpoint: https://your-domain.onrender.com/xapi (must use HTTPS)');
    console.log('  Key:', lrsCredentials.key);
    console.log('  Secret:', lrsCredentials.secret);
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
