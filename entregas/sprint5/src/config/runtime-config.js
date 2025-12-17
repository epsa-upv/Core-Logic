function readEnvString(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === null) return fallback;
    const value = String(raw).trim();
    return value.length ? value : fallback;
}

function readEnvInt(name, fallback) {
    const raw = readEnvString(name, '');
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function readEnvBool(name, fallback) {
    const raw = readEnvString(name, '');
    if (!raw) return fallback;
    return ['1', 'true', 'yes', 'y', 'on'].includes(raw.toLowerCase());
}

function readSessionSecret() {
    const fromEnv = readEnvString('SESSION_SECRET', '');
    if (fromEnv) return fromEnv;
    const fallback = readEnvString('SESSION_SECRET_FALLBACK', 'ronda_marroqui_secret_2025');
    return fallback;
}

const nodeEnv = readEnvString('NODE_ENV', 'development');
const isProduction = nodeEnv === 'production';

const config = {
    nodeEnv,
    isProduction,
    port: readEnvInt('PORT', 3002),
    db: {
        host: readEnvString('DB_HOST', 'localhost'),
        port: readEnvInt('DB_PORT', 3306),
        user: readEnvString('DB_USER', 'root'),
        password: readEnvString('DB_PASSWORD', ''),
        database: readEnvString('DB_NAME', 'ronda_marroqui'),
        waitForConnections: true,
        connectionLimit: readEnvInt('DB_CONNECTION_LIMIT', 10),
        queueLimit: 0
    },
    session: {
        secret: readSessionSecret(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            sameSite: readEnvString('SESSION_SAMESITE', 'lax'),
            maxAge: readEnvInt('SESSION_MAX_AGE_MS', 24 * 60 * 60 * 1000)
        }
    },
    bcryptSaltRounds: readEnvInt('BCRYPT_SALT_ROUNDS', 10),
    logErrors: readEnvBool('LOG_ERRORS', !isProduction),
    exposeErrorDetails: readEnvBool('EXPOSE_ERROR_DETAILS', !isProduction)
};

module.exports = { config };
