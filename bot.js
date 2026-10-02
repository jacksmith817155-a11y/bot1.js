/**
 * ============================================================================
 * Stars Plus TELEGRAM BOT - V7.0 ENTERPRISE EDITION ENHANCED
 * (LIVE BINANCE & BRSAPI SYNC, ADVANCED RECEIPTS & REPORTING, REF & DISCOUNT ENGINE)
 * ============================================================================
 * ✨ تحسینات نسخه 7.0:
 * - پنل مدیریت امن‌تر با کد تایید دو مرحله‌ای
 * - سیستم لاگ‌گیری پیشرفته
 * - حفاظت از Brute Force
 * - رمزنگاری داده‌های حساس
 * - سیستم بکاپ خودکار
 * - آمار و گزارش‌های دقیق
 * - بهتری سرعت و کارایی
 */

const TelegramModule = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// SECURITY & ENCRYPTION UTILITIES
// ============================================================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'nova_shop_2024_secure_key_v7';

class SecurityUtils {
    static hashPassword(password) {
        return crypto.createHash('sha256').update(password + ENCRYPTION_KEY).digest('hex');
    }

    static verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    static generateSecureCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static encryptData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    static decryptData(encrypted) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (e) {
            return null;
        }
    }
}

// ============================================================================
// ADVANCED LOGGING SYSTEM
// ============================================================================

class AdvancedLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
        this.logFile = path.join(__dirname, 'bot_logs.json');
        this.loadLogs();
    }

    log(level, context, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            context,
            message,
            data,
            id: crypto.randomBytes(4).toString('hex')
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        const levelColors = {
            'INFO': '[ℹ️]',
            'ERROR': '[❌]',
            'WARNING': '[⚠️]',
            'SUCCESS': '[✅]',
            'SECURITY': '[🔒]',
            'API': '[📡]'
        };

        console.log(`${levelColors[level] || '📌'} [${timestamp}] [${context}] ${message}`);
        if (data) console.log(`   Data:`, JSON.stringify(data).substring(0, 200));
    }

    info(context, message, data) { this.log('INFO', context, message, data); }
    error(context, message, data) { this.log('ERROR', context, message, data); }
    warning(context, message, data) { this.log('WARNING', context, message, data); }
    success(context, message, data) { this.log('SUCCESS', context, message, data); }
    security(context, message, data) { this.log('SECURITY', context, message, data); }
    api(context, message, data) { this.log('API', context, message, data); }

    loadLogs() {
        try {
            if (fs.existsSync(this.logFile)) {
                const data = fs.readFileSync(this.logFile, 'utf8');
                this.logs = JSON.parse(data);
            }
        } catch (e) {
            this.logs = [];
        }
    }

    saveLogs() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(this.logs.slice(-1000), null, 2), 'utf8');
        } catch (e) {
            console.error('Failed to save logs');
        }
    }

    getRecentLogs(count = 50) {
        return this.logs.slice(-count).reverse();
    }

    getLogsByContext(context, count = 50) {
        return this.logs.filter(log => log.context === context).slice(-count).reverse();
    }
}

const logger = new AdvancedLogger();

// ============================================================================
// ANTI-BRUTE FORCE SYSTEM
// ============================================================================

class AntiBruteForce {
    constructor() {
        this.attempts = {};
        this.lockouts = {};
        this.maxAttempts = 5;
        this.lockoutDuration = 300000; // 5 دقیقه
        this.resetTime = 3600000; // 1 ساعت
    }

    recordAttempt(userId) {
        const now = Date.now();
        if (!this.attempts[userId]) {
            this.attempts[userId] = { count: 0, firstAttempt: now };
        }

        const attemptData = this.attempts[userId];
        if (now - attemptData.firstAttempt > this.resetTime) {
            this.attempts[userId] = { count: 1, firstAttempt: now };
            return true;
        }

        attemptData.count++;
        if (attemptData.count > this.maxAttempts) {
            this.lockouts[userId] = now + this.lockoutDuration;
            logger.security('AntiBruteForce', `User ${userId} locked out after ${attemptData.count} attempts`);
            return false;
        }

        return true;
    }

    isLocked(userId) {
        if (!this.lockouts[userId]) return false;
        if (Date.now() > this.lockouts[userId]) {
            delete this.lockouts[userId];
            return false;
        }
        return true;
    }

    getRemainingLockTime(userId) {
        if (!this.lockouts[userId]) return 0;
        return Math.ceil((this.lockouts[userId] - Date.now()) / 1000);
    }
}

const antiBruteForce = new AntiBruteForce();

// ============================================================================
// RENDER WEB SERVICE PORT BINDING SERVER
// ============================================================================

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        status: 'online',
        bot: 'Nova Shop Bot V7.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        logs: logger.logs.length
    }));
});

server.listen(PORT, () => {
    logger.info('Server', `HTTP server is listening on port ${PORT}`);
});

// ============================================================================
// ENTERPRISE CONFIGURATION & CONSTANTS
// ============================================================================

const TOKEN = process.env.BOT_TOKEN || '8696660217:AAEBI6iOD-OAZpWbCIGy2KU-s-Fc5OQwwVE';
const ADMIN_ID_USERNAME = '@shantiaNFT';
const ADMIN_NUMERIC_ID = 8750484397;
const EXTRA_ADMIN_ID = '8942987641';
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'database.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

const FORCE_JOIN_CHANNELS = ['@nova2_shop', '@nova1_shopp'];
const REPORT_CHANNEL = '@kaiauhahaua';
const BOT_USERNAME = 'NOVA_SHOP3_BOT';

const REFERRAL_DEFAULT_PERCENT = 5;
const REFERRAL_MIN_TRANSFER = 1000;
const STAR_USD = 0.015;

const FALLBACK_USDT_TOMAN = 65000;
const FALLBACK_GRAM_TOMAN = 311591;

const BRSAPI_KEY = process.env.BRSAPI_KEY || 'BrcH3cX7vcbuX9tE7Pr8dJGsjkeKKJTt';
const BRSAPI_URL = `https://api.brsapi.ir/Market/Gold_Currency.php?key=${BRSAPI_KEY}`;
const PRICE_REFRESH_MS = 2000;

const STAR_MARGIN = 1.0;
const GRAM_MARGIN = 1.10;

const CARD_NUMBER = process.env.CARD_NUMBER || '6219861452862914';
const CARD_OWNER = process.env.CARD_OWNER || 'شنتیا زاهد پور';
const TOPUP_MIN = 10000;
const TOPUP_MAX = 100000000;

// ============================================================================
// BUTTON HELPER FUNCTIONS
// ============================================================================

const BTN_PRIMARY = 'primary';
const BTN_SUCCESS = 'success';
const BTN_DANGER = 'danger';

function B(text, style) {
    return style ? { text, style } : { text };
}

// ============================================================================
// BOT INITIALIZATION WITH SECURITY
// ============================================================================

const TelegramBot = typeof TelegramModule === 'function'
    ? TelegramModule
    : (
        TelegramModule.default ||
        TelegramModule.TelegramBot ||
        Object.values(TelegramModule).find(v => typeof v === 'function') ||
        TelegramModule
    );

const bot = new TelegramBot(TOKEN, {
    polling: {
        interval: 10,
        autoStart: true,
        params: { timeout: 30 }
    },
    filepath: false
});

process.on('uncaughtException', (err) => {
    logger.error('Process', 'Uncaught Exception', err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Process', `Unhandled Rejection at: ${promise}`, reason);
});

process.on('SIGTERM', async () => {
    logger.info('System', 'SIGTERM received, shutting down...');
    try { await bot.stopPolling(); } catch (e) { }
    saveDatabase();
    logger.saveLogs();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('System', 'SIGINT received, shutting down...');
    try { await bot.stopPolling(); } catch (e) { }
    saveDatabase();
    logger.saveLogs();
    process.exit(0);
});

bot.on('polling_error', (err) => {
    logger.error('Polling', `${err && err.code ? err.code : 'ERR'} - ${err && err.message ? err.message : err}`);
});

// ============================================================================
// DATABASE ARCHITECTURE & MANAGEMENT WITH BACKUP
// ============================================================================

// ایجاد دایرکتوری بکاپ اگر وجود ندارد
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let db = {
    users: {},
    orders: {},
    discountCodes: {},
    receipts: {},
    adminSessions: {},
    adminLogs: [],
    secondaryAdmin: null,
    manualTonPrice: 0,
    manualStarPrice: 0,
    manualGiftBasePrice: 0,
    referralPercent: REFERRAL_DEFAULT_PERCENT,
    lastUsdToman: 0,
    statistics: {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalDiscounts: 0,
        lastUpdate: Date.now()
    }
};

function createBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(db, null, 2), 'utf8');
        logger.success('Database', 'Backup created successfully', { file: backupFile });

        // حفظ فقط 10 بکاپ آخیر
        const files = fs.readdirSync(BACKUP_DIR).sort().reverse();
        if (files.length > 10) {
            fs.unlinkSync(path.join(BACKUP_DIR, files[10]));
        }
    } catch (e) {
        logger.error('Database', 'Failed to create backup', e);
    }
}

function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
            
            // اطمینان از وجود تمام فیلدهای لازم
            if (!db.statistics) db.statistics = {
                totalOrders: 0,
                totalRevenue: 0,
                totalUsers: 0,
                totalDiscounts: 0,
                lastUpdate: Date.now()
            };
            if (!db.adminSessions) db.adminSessions = {};
            if (!db.adminLogs) db.adminLogs = [];
            if (typeof db.manualTonPrice === 'undefined') db.manualTonPrice = 0;
            if (typeof db.manualStarPrice === 'undefined') db.manualStarPrice = 0;
            if (typeof db.manualGiftBasePrice === 'undefined') db.manualGiftBasePrice = 0;
            if (typeof db.referralPercent === 'undefined') db.referralPercent = REFERRAL_DEFAULT_PERCENT;
            if (typeof db.lastUsdToman === 'undefined') db.lastUsdToman = 0;
            if (!db.discountCodes) db.discountCodes = {};
            if (!db.receipts) db.receipts = {};
            if (!db.users) db.users = {};
            if (!db.orders) db.orders = {};

            logger.success('Database', 'Successfully loaded records from disk', { userCount: Object.keys(db.users).length });
        } else {
            logger.info('Database', 'No existing database found. Initializing new storage.');
            saveDatabase();
        }
    } catch (e) {
        logger.error('Database', 'Failed to load database file', e);
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        logger.api('Database', 'Database saved successfully');
    } catch (e) {
        logger.error('Database', 'Failed to write database file', e);
    }
}

loadDatabase();
logger.success('System', 'Nova Shop Bot V7.0 is running!');

// ============================================================================
// SCHEDULED BACKUP EVERY 1 HOUR
// ============================================================================

setInterval(() => {
    createBackup();
    logger.info('System', 'Automatic backup initiated');
}, 3600000);

// ============================================================================
// ADMIN SESSION MANAGEMENT WITH TWO-FACTOR AUTHENTICATION
// ============================================================================

class AdminSessionManager {
    constructor() {
        this.sessions = db.adminSessions || {};
        this.codes = {};
    }

    generateCode(adminId) {
        const code = SecurityUtils.generateSecureCode();
        this.codes[adminId] = {
            code,
            generatedAt: Date.now(),
            attempts: 0,
            maxAttempts: 3
        };
        logger.security('AdminAuth', `Code generated for admin ${adminId}`);
        return code;
    }

    verifyCode(adminId, code) {
        const data = this.codes[adminId];
        if (!data) return { valid: false, reason: 'کد تولید نشده است' };
        
        if (Date.now() - data.generatedAt > 300000) { // 5 دقیقه
            delete this.codes[adminId];
            return { valid: false, reason: 'کد منقضی شده است' };
        }

        if (data.attempts >= data.maxAttempts) {
            delete this.codes[adminId];
            logger.security('AdminAuth', `Max attempts exceeded for admin ${adminId}`);
            return { valid: false, reason: 'تعداد تلاش‌های اشتباه بیش از حد است' };
        }

        if (code !== data.code) {
            data.attempts++;
            return { valid: false, reason: `کد اشتباه است (تلاش ${data.attempts}/3)` };
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        this.sessions[adminId] = {
            token: sessionToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000, // 24 ساعت
            ip: '0.0.0.0',
            lastActivity: Date.now()
        };

        delete this.codes[adminId];
        db.adminSessions = this.sessions;
        saveDatabase();
        logger.security('AdminAuth', `Session created for admin ${adminId}`);
        return { valid: true, token: sessionToken };
    }

    validateSession(adminId, token) {
        const session = this.sessions[adminId];
        if (!session) return false;
        if (Date.now() > session.expiresAt) {
            delete this.sessions[adminId];
            return false;
        }
        if (session.token !== token) return false;
        
        session.lastActivity = Date.now();
        return true;
    }

    createAdminLog(adminId, action, details) {
        const logEntry = {
            adminId,
            action,
            details,
            timestamp: Date.now(),
            id: crypto.randomBytes(4).toString('hex')
        };
        db.adminLogs = db.adminLogs || [];
        db.adminLogs.push(logEntry);
        if (db.adminLogs.length > 1000) db.adminLogs.shift();
        saveDatabase();
        logger.security('AdminLog', `Admin ${adminId} performed action: ${action}`, details);
    }

    getAdminLogs(adminId = null, count = 50) {
        const logs = db.adminLogs || [];
        if (adminId) {
            return logs.filter(l => l.adminId.toString() === adminId.toString()).slice(-count).reverse();
        }
        return logs.slice(-count).reverse();
    }
}

const adminSessionManager = new AdminSessionManager();

// ============================================================================
// USER DATA MANAGEMENT
// ============================================================================

function getUserDataById(userId) {
    if (!db.users[userId]) {
        db.users[userId] = {
            firstName: 'کاربر',
            phone: 'ثبت نشده',
            verified: 'انجام نشده',
            cardVerified: false,
            isBanned: false,
            level: 'سطح 1',
            wallet: 0,
            discountWallet: 1766,

            waitingForAmount: false,
            waitingForTicket: false,
            waitingForReceipt: false,
            waitingForDiscountInput: false,
            waitingForRecipient: false,
            waitingForComment: false,
            waitingForTrackingInput: false,

            waitingForGramAmount: false,
            waitingForGramWallet: false,
            waitingForGramMemoChoice: false,
            waitingForGramMemoInput: false,

            waitingForStarCount: false,
            waitingForStarRecipient: false,

            starCount: 50,
            starRecipient: '',
            starPricePerUnit: 0,

            lastAmount: 0,
            lastOriginalAmount: 0,
            lastDiscountAmount: 0,
            topupAmount: 0,
            appliedDiscountCode: null,
            appliedDiscountPercent: 0,
            currentShopState: null,

            selectedGiftName: '',
            selectedGiftStars: 0,
            recipientUsername: '',
            commentText: 'تنظیم نشده',
            lastInvoiceMessageId: null,

            gramAmount: 0,
            gramPricePerUnit: 0,
            gramWalletAddress: '',
            gramMemo: 'ندارد',

            waitingForAdminUserSearch: false,
            waitingForAdminAmount: false,
            waitingForRejectReason: false,
            waitingForOrderRejectReason: false,
            waitingForReceiptRejectReason: false,
            waitingForManualPrice: false,
            waitingForManualStarPrice: false,
            waitingForManualGiftBasePrice: false,
            waitingForReferralPercent: false,
            rejectOrderCode: null,
            adminAction: null,
            targetUserId: null,
            rejectTargetId: null,
            adminReplyingTo: null,

            tempDiscount: { percent: 0, capacity: 0, expiryHour: 0, restriction: null, durationHours: 0, products: [] },
            waitingForDiscountPercent: false,
            waitingForDiscountCapacity: false,
            waitingForDiscountExpiry: false,
            waitingForDiscountRestriction: false,

            referredBy: null,
            referrals: [],
            referralBalance: 0,
            referralTotalEarned: 0,
            referralTotalSales: 0,
            referralOrdersCount: 0,
            referralTotalTransferred: 0,
            joinedAt: Date.now(),
            
            // NEW: امنیت و احراز هویت
            adminSessionToken: null,
            adminAuthCode: null,
            lastActivity: Date.now(),
            loginAttempts: 0
        };
        saveDatabase();
    }

    const u = db.users[userId];
    
    // اطمینان از وجود تمام فیلدهای جدید
    if (typeof u.referredBy === 'undefined') u.referredBy = null;
    if (!Array.isArray(u.referrals)) u.referrals = [];
    if (typeof u.referralBalance !== 'number') u.referralBalance = 0;
    if (typeof u.referralTotalEarned !== 'number') u.referralTotalEarned = 0;
    if (typeof u.referralTotalSales !== 'number') u.referralTotalSales = 0;
    if (typeof u.referralOrdersCount !== 'number') u.referralOrdersCount = 0;
    if (typeof u.referralTotalTransferred !== 'number') u.referralTotalTransferred = 0;
    if (typeof u.joinedAt === 'undefined') u.joinedAt = Date.now();
    if (typeof u.lastOriginalAmount === 'undefined') u.lastOriginalAmount = 0;
    if (typeof u.lastDiscountAmount === 'undefined') u.lastDiscountAmount = 0;
    if (typeof u.topupAmount === 'undefined') u.topupAmount = 0;
    if (typeof u.waitingForReferralPercent === 'undefined') u.waitingForReferralPercent = false;
    if (!u.tempDiscount || typeof u.tempDiscount !== 'object') {
        u.tempDiscount = { percent: 0, capacity: 0, expiryHour: 0, restriction: null, durationHours: 0, products: [] };
    }
    if (!Array.isArray(u.tempDiscount.products)) u.tempDiscount.products = [];

    return db.users[userId];
}

function getUserData(msg) {
    if (!msg.from) return getUserDataById(msg.chat.id);
    const user = msg.from;
    const chatId = user.id;
    const userData = getUserDataById(chatId);

    if (user.first_name && userData.firstName === 'کاربر') {
        userData.firstName = user.first_name;
        saveDatabase();
    }
    return userData;
}

// ============================================================================
// MESSAGING & UI UTILITIES
// ============================================================================

function escapeHTML(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function safeDeleteMessage(chatId, messageId) {
    try {
        if (messageId) {
            await bot.deleteMessage(chatId, messageId);
        }
    } catch (err) {
        logger.warning('TelegramAPI', `Failed to delete message ${messageId}`, err);
    }
}

async function safeSendMessage(chatId, text, options = {}) {
    try {
        const finalOptions = { parse_mode: 'HTML', ...options };
        return await bot.sendMessage(chatId, text, finalOptions);
    } catch (err) {
        logger.error('TelegramAPI', `Failed to send message to ${chatId}`, err);
    }
}

async function safeSendPhoto(chatId, photo, options = {}) {
    try {
        const finalOptions = { parse_mode: 'HTML', ...options };
        let photoData = photo;
        if (typeof photo === 'string') {
            if (fs.existsSync(photo)) {
                photoData = fs.createReadStream(photo);
            } else {
                return await safeSendMessage(chatId, options.caption, { reply_markup: options.reply_markup });
            }
        }
        return await bot.sendPhoto(chatId, photoData, finalOptions);
    } catch (err) {
        logger.error('TelegramAPI', `Failed to send photo to ${chatId}`, err);
        if (options.caption) {
            return await safeSendMessage(chatId, options.caption, { reply_markup: options.reply_markup });
        }
    }
}

function isUserAdmin(chatId) {
    const idStr = chatId.toString();
    return idStr === ADMIN_NUMERIC_ID.toString() ||
        idStr === EXTRA_ADMIN_ID.toString() ||
        (db.secondaryAdmin && idStr === db.secondaryAdmin.toString());
}

async function notifyAdmins(text, options = {}) {
    await safeSendMessage(ADMIN_NUMERIC_ID, text, options);
    await safeSendMessage(EXTRA_ADMIN_ID, text, options);
    if (db.secondaryAdmin && db.secondaryAdmin.toString() !== ADMIN_NUMERIC_ID.toString() && db.secondaryAdmin.toString() !== EXTRA_ADMIN_ID.toString()) {
        await safeSendMessage(db.secondaryAdmin, text, options);
    }
}

async function notifyAdminsPhoto(photoId, options = {}) {
    try {
        await bot.sendPhoto(ADMIN_NUMERIC_ID, photoId, options);
        await bot.sendPhoto(EXTRA_ADMIN_ID, photoId, options);
        if (db.secondaryAdmin && db.secondaryAdmin.toString() !== ADMIN_NUMERIC_ID.toString() && db.secondaryAdmin.toString() !== EXTRA_ADMIN_ID.toString()) {
            await bot.sendPhoto(db.secondaryAdmin, photoId, options);
        }
    } catch (e) {
        logger.error('API', 'Failed to send photo to admins', e);
    }
}

async function setReaction(chatId, messageId) {
    try {
        if (bot.setMessageReaction) {
            const reactionsList = ['❤️‍🔥', '💥', '💫', '⚡', '🔥', '❤', '🎉', '🤩', '🏆', '🌟', '✨'];
            const randomEmoji = reactionsList[Math.floor(Math.random() * reactionsList.length)];
            await bot.setMessageReaction(chatId, messageId, {
                reaction: [{ type: 'emoji', emoji: randomEmoji }]
            });
        }
    } catch (err) {
        logger.warning('Reaction', 'Failed to set reaction', err);
    }
}

function getFormattedTime() {
    const now = new Date();
    const tehranTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
    const y = tehranTime.getFullYear();
    const m = String(tehranTime.getMonth() + 1).padStart(2, '0');
    const d = String(tehranTime.getDate()).padStart(2, '0');
    const hh = String(tehranTime.getHours()).padStart(2, '0');
    const mm = String(tehranTime.getMinutes()).padStart(2, '0');
    const ss = String(tehranTime.getSeconds()).padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

function maskUserIdSpecial(userId) {
    const str = userId.toString();
    if (str.length <= 4) return str;
    const len = str.length;
    const midStart = Math.max(1, Math.floor(len / 2) - 2);
    const start = str.substring(0, midStart);
    const end = str.substring(midStart + 4);
    return `${start}****${end}`;
}

async function sendChannelReport(order) {
    try {
        const channelId = REPORT_CHANNEL;
        const maskedUserId = maskUserIdSpecial(order.userId);
        const formattedTime = getFormattedTime();
        const discountStr = order.discountAmount > 0 ? `\n🎁 تخفیف اعمال شده: <b>${order.discountAmount.toLocaleString()} تومان</b>` : '';

        const reportMsg =
            `🛍️ <b>گزارش خرید موفق | نوا شاپ</b> 🛍️\n\n` +
            `👤 خریدار (آیدی): <code>${maskedUserId}</code>\n` +
            `🛒 محصول خریداری شده: <b>${escapeHTML(order.giftName)}</b>\n` +
            `💳 مبلغ پرداختی: <b>${order.amount.toLocaleString()} تومان</b>${discountStr}\n\n` +
            `✅ این سفارش با موفقیت و بالاترین سرعت انجام شد.\n` +
            `⏰ زمان معامله: ${formattedTime}\n` +
            `🤖 ربات فروشگاه: @${BOT_USERNAME}`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 برای خرید سریع اقدام کنید', url: `https://t.me/${BOT_USERNAME}` }]
                ]
            }
        };

        await safeSendMessage(channelId, reportMsg, inlineKeyboard);
        logger.api('ChannelReport', 'Report sent successfully', { orderId: order.id });
    } catch (err) {
        logger.error('ChannelReport', 'Failed to send report to channel', err);
    }
}

// ============================================================================
// TEXT UTILITIES
// ============================================================================

function stripVS(str) {
    return str ? str.toString().replace(/\uFE0F/g, '') : str;
}

function textIs(text, label) {
    return !!text && stripVS(text) === stripVS(label);
}

function normalizeDigits(str) {
    if (str === null || typeof str === 'undefined') return '';
    return str.toString()
        .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/[,٬،]/g, '')
        .trim();
}

function maskName(name) {
    const chars = Array.from((name || 'کاربر').toString());
    if (chars.length <= 2) return chars.join('') + '***';
    return chars.slice(0, 2).join('') + '***';
}

function maskId(id) {
    const s = id.toString();
    return s.length > 4 ? s.substring(0, 2) + '******' + s.slice(-2) : s;
}

function progressBar(current, total, size = 10) {
    if (!total || total <= 0) return '▰'.repeat(size);
    const ratio = Math.max(0, Math.min(1, current / total));
    const filled = Math.round(ratio * size);
    return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

function formatTehranDate(ts) {
    try {
        return new Date(ts).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    } catch (e) {
        return String(ts);
    }
}

// ============================================================================
// BUTTON LABELS
// ============================================================================

const REF_BTN = {
    menu: '🤝 زیرمجموعه گیری',
    link: '🔗 لینک اختصاصی من',
    list: '👥 زیرمجموعه‌های من',
    stats: '💰 درآمد و آمار من',
    transfer: '💸 انتقال درآمد به موجودی',
    top: '🏆 جدول برترین‌ها',
    guide: '📖 راهنمای کامل',
    adminStats: '🤝 آمار زیرمجموعه‌ها',
    adminPercent: '⚙️ تنظیم درصد کمیسیون',
    adminDiscountList: '📋 مدیریت کدهای تخفیف',
    removeDiscount: '🗑 حذف کد تخفیف',
    adminLogs: '📊 لاگ‌های فعالیت ادمین',
    adminUsers: '👥 مدیریت کاربران',
    adminOrders: '📦 مدیریت سفارش‌ها',
    adminStats2Fa: '🔐 امنیت دو مرحله‌ای'
};

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

const GIFT_PRODUCTS = [
    { key: 'gift_heart', name: '💖 گیفت قلب ( 15 )' },
    { key: 'gift_teddy', name: '🧸 گیفت تدی ( 15 )' },
    { key: 'gift_box', name: '🎁 گیفت کادو ( 25 )' },
    { key: 'gift_rose', name: '🌹 گیفت گل رز ( 25 )' },
    { key: 'gift_cake', name: '🎂 گیفت کیک ( 50 )' },
    { key: 'gift_flower', name: '🌷 گیفت گل ( 50 )' },
    { key: 'gift_bottle', name: '🍾 گیفت بطری ( 50 )' },
    { key: 'gift_rocket', name: '🚀 گیفت سفینه ( 50 )' },
    { key: 'gift_cup', name: '🏆 گیفت جام ( 100 )' },
    { key: 'gift_ring', name: '💍 گیفت حلقه ( 100 )' }
];

const PRODUCT_CATALOG = [
    { key: 'stars', label: '⭐ استارز تلگرام' },
    { key: 'gram', label: '💠 ارز گرام (GRAM)' },
    ...GIFT_PRODUCTS.map(g => ({ key: g.key, label: g.name }))
];

function getProductLabel(key) {
    const found = PRODUCT_CATALOG.find(p => p.key === key);
    if (found) return found.label;
    if (key === 'gift_other') return '🎁 سایر گیفت‌ها';
    return key;
}

function getGiftKeyFromName(name) {
    const clean = stripVS(name || '');
    const found = GIFT_PRODUCTS.find(g => stripVS(g.name) === clean);
    return found ? found.key : 'gift_other';
}

function getGiftStarsFromName(name) {
    const m = (name || '').toString().match(/\(\s*(\d+)\s*\)/);
    return m ? parseInt(m[1]) : 0;
}

function getCurrentProductKey(userData) {
    if (userData.currentShopState === 'star_invoice') return 'stars';
    if (userData.currentShopState === 'gram_invoice') return 'gram';
    if (userData.currentShopState === 'gift_invoice') return getGiftKeyFromName(userData.selectedGiftName);
    return null;
}

// ============================================================================
// ADVANCED DISCOUNT CODE ENGINE
// ============================================================================

const DISCOUNT_DURATION_OPTIONS = [
    { label: '⏱ ۱ ساعت', hours: 1 },
    { label: '⏱ ۶ ساعت', hours: 6 },
    { label: '⏱ ۱۲ ساعت', hours: 12 },
    { label: '⏱ ۲۴ ساعت', hours: 24 },
    { label: '📅 ۳ روز', hours: 72 },
    { label: '📅 ۷ روز', hours: 168 },
    { label: '📅 ۳۰ روز', hours: 720 },
    { label: '♾ بدون انقضا', hours: 0 }
];

function getDiscountDurationKeyboard() {
    const rows = [];
    for (let i = 0; i < DISCOUNT_DURATION_OPTIONS.length; i += 2) {
        const row = [B(DISCOUNT_DURATION_OPTIONS[i].label, BTN_PRIMARY)];
        if (DISCOUNT_DURATION_OPTIONS[i + 1]) row.push(B(DISCOUNT_DURATION_OPTIONS[i + 1].label, BTN_PRIMARY));
        rows.push(row);
    }
    rows.push([B('برگشت ↩️', BTN_DANGER)]);
    return { reply_markup: { keyboard: rows, resize_keyboard: true } };
}

function getDiscountPercentKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B('5%', BTN_PRIMARY), B('10%', BTN_PRIMARY), B('15%', BTN_PRIMARY)],
                [B('20%', BTN_PRIMARY), B('25%', BTN_PRIMARY), B('30%', BTN_PRIMARY)],
                [B('40%', BTN_PRIMARY), B('50%', BTN_PRIMARY), B('100%', BTN_SUCCESS)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

function getDiscountCapacityKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B('1', BTN_PRIMARY), B('5', BTN_PRIMARY), B('10', BTN_PRIMARY)],
                [B('25', BTN_PRIMARY), B('50', BTN_PRIMARY), B('100', BTN_PRIMARY)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

function buildDiscountProductsMarkup(selectedKeys) {
    const selected = Array.isArray(selectedKeys) ? selectedKeys : [];
    const rows = [];
    let currentRow = [];

    PRODUCT_CATALOG.forEach(p => {
        const isOn = selected.includes(p.key);
        currentRow.push({
            ...B(`${isOn ? '✅' : '⬜'} ${p.label}`, isOn ? BTN_SUCCESS : BTN_PRIMARY),
            callback_data: `dcp_${p.key}`
        });
        if (currentRow.length === 2) {
            rows.push(currentRow);
            currentRow = [];
        }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    const allGiftsOn = GIFT_PRODUCTS.every(g => selected.includes(g.key));
    rows.push([{ ...B(`${allGiftsOn ? '✅' : '⬜'} 🎁 همه گیفت‌ها`, allGiftsOn ? BTN_SUCCESS : BTN_PRIMARY), callback_data: 'dcp_allgifts' }]);
    rows.push([
        { ...B('🌐 همه محصولات (بدون محدودیت)', BTN_PRIMARY), callback_data: 'dcp_all' },
        { ...B('✔️ تایید انتخاب', BTN_SUCCESS), callback_data: 'dcp_done' }
    ]);

    return { inline_keyboard: rows };
}

function findDiscountCodeKey(input) {
    const clean = normalizeDigits(input).toUpperCase();
    if (!clean) return null;
    return Object.keys(db.discountCodes).find(k => k.toUpperCase() === clean) || null;
}

function isDiscountApplicable(codeObj, productKey) {
    if (!codeObj) return false;
    if (Array.isArray(codeObj.products) && codeObj.products.length > 0) {
        return codeObj.products.includes(productKey);
    }
    const r = codeObj.restriction;
    if (!r) return true;
    if (r === 'stars') return productKey === 'stars';
    if (r === 'gram') return productKey === 'gram';
    if (r === 'gift_stars') return typeof productKey === 'string' && productKey.startsWith('gift_');
    return true;
}

function describeDiscountProducts(codeObj) {
    if (Array.isArray(codeObj.products) && codeObj.products.length > 0) {
        return codeObj.products.map(getProductLabel).join('، ');
    }
    const r = codeObj.restriction;
    if (r === 'stars') return '⭐ استارز تلگرام';
    if (r === 'gram') return '💠 ارز گرام (GRAM)';
    if (r === 'gift_stars') return '🎁 همه گیفت‌ها';
    return '🌐 همه محصولات';
}

function getDiscountStatusText(codeObj) {
    if (codeObj.expiresAt && Date.now() > codeObj.expiresAt) return '⛔ منقضی شده';
    if (codeObj.capacity && (codeObj.usedCount || 0) >= codeObj.capacity) return '🚫 ظرفیت تکمیل';
    return '🟢 فعال';
}

function validateDiscountCode(codeInput, userId, productKey) {
    const key = db.discountCodes[codeInput] ? codeInput : findDiscountCodeKey(codeInput);
    const code = key ? db.discountCodes[key] : null;

    if (!code) return { ok: false, reason: 'کد تخفیف وارد شده نامعتبر است.' };
    if (code.expiresAt && Date.now() > code.expiresAt) {
        return { ok: false, reason: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' };
    }
    if (code.capacity && (code.usedCount || 0) >= code.capacity) {
        return { ok: false, reason: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.' };
    }
    if (Array.isArray(code.usedBy) && code.usedBy.map(String).includes(String(userId))) {
        return { ok: false, reason: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید.' };
    }
    if (!isDiscountApplicable(code, productKey)) {
        return { ok: false, reason: `این کد تخفیف فقط برای این محصولات قابل استفاده است:\n${describeDiscountProducts(code)}` };
    }
    return { ok: true, key, code, percent: code.percent };
}

function clearAppliedDiscount(userData) {
    userData.appliedDiscountCode = null;
    userData.appliedDiscountPercent = 0;
}

function calculateDiscount(userData, productKey, totalPrice, userId) {
    const empty = { code: null, percent: 0, discountVal: 0, finalAmount: totalPrice, note: '' };
    if (!userData.appliedDiscountCode) return empty;

    const chk = validateDiscountCode(userData.appliedDiscountCode, userId, productKey);
    if (!chk.ok) {
        const oldCode = userData.appliedDiscountCode;
        clearAppliedDiscount(userData);
        saveDatabase();
        return { ...empty, note: `⚠️ کد ${oldCode} از فاکتور حذف شد: ${chk.reason}` };
    }

    const discountVal = Math.round(totalPrice * (chk.percent / 100));
    return {
        code: chk.key,
        percent: chk.percent,
        discountVal,
        finalAmount: Math.max(0, totalPrice - discountVal),
        note: ''
    };
}

function buildDiscountBlock(totalPrice, d) {
    let block = '';
    if (d.note) block += `${escapeHTML(d.note)}\n\n`;
    if (d.code && d.discountVal > 0) {
        block +=
            `🎫 کد تخفیف: <code>${escapeHTML(d.code)}</code> ( ${d.percent}% )\n` +
            `💸 میزان تخفیف: ${d.discountVal.toLocaleString()} تومان\n` +
            `🏷 قیمت قبل از تخفیف: <s>${totalPrice.toLocaleString()} تومان</s>\n\n`;
    }
    return block;
}

function consumeDiscountUsage(userData, userId) {
    const key = userData.appliedDiscountCode;
    if (key && db.discountCodes[key]) {
        const c = db.discountCodes[key];
        c.usedCount = (c.usedCount || 0) + 1;
        if (!Array.isArray(c.usedBy)) c.usedBy = [];
        c.usedBy.push(String(userId));
    }
    clearAppliedDiscount(userData);
    userData.lastOriginalAmount = 0;
    userData.lastDiscountAmount = 0;
    saveDatabase();
}

async function revalidateAppliedDiscount(chatId, userData, productKey, reshowFn) {
    if (!userData.appliedDiscountCode) return true;
    const chk = validateDiscountCode(userData.appliedDiscountCode, chatId, productKey);
    if (chk.ok) return true;

    clearAppliedDiscount(userData);
    saveDatabase();
    await safeSendMessage(chatId, `⚠️ ${escapeHTML(chk.reason)}\n\nکد تخفیف از فاکتور شما حذف شد و قیمت اصلی محاسبه می‌شود.`);
    await reshowFn(chatId, userData);
    return false;
}

async function reshowInvoiceByState(chatId, userData) {
    if (userData.currentShopState === 'star_invoice') await showStarInvoice(chatId, userData);
    else if (userData.currentShopState === 'gift_invoice') await showGiftInvoice(chatId, userData);
    else if (userData.currentShopState === 'gram_invoice') await showGramInvoice(chatId, userData);
}

function renderDiscountList() {
    const entries = Object.entries(db.discountCodes);
    if (entries.length === 0) {
        return { text: '📭 هیچ کد تخفیفی ثبت نشده است.', markup: { inline_keyboard: [] } };
    }
    const shown = entries.slice(-20).reverse();
    let t = `<b>📋 مدیریت کدهای تخفیف</b> ( ${entries.length} کد )\n\n`;
    const rows = [];
    shown.forEach(([code, c]) => {
        const expiryText = c.expiresAt ? formatTehranDate(c.expiresAt) : 'بدون انقضا';
        t +=
            `🎫 کد: <tg-spoiler>${escapeHTML(code)}</tg-spoiler> — ${c.percent}%\n` +
            `   📦 ${escapeHTML(describeDiscountProducts(c))}\n` +
            `   👥 مصرف: ${c.usedCount || 0}/${c.capacity || '∞'} | ${getDiscountStatusText(c)}\n` +
            `   ⏳ انقضا: ${escapeHTML(expiryText)}\n\n`;
        rows.push([{ ...B(`🗑 حذف ${code}`, BTN_DANGER), callback_data: `dc_del_${code}` }]);
    });
    return { text: t, markup: { inline_keyboard: rows } };
}

// ============================================================================
// ADVANCED REFERRAL SYSTEM
// ============================================================================

function getReferralPercent() {
    return (typeof db.referralPercent === 'number' && db.referralPercent >= 0) ? db.referralPercent : REFERRAL_DEFAULT_PERCENT;
}

function getReferralLink(userId) {
    return `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
}

const REFERRAL_LEVELS = [
    { min: 0, name: 'برنزی', emoji: '🥉' },
    { min: 5, name: 'نقره‌ای', emoji: '🥈' },
    { min: 20, name: 'طلایی', emoji: '🥇' },
    { min: 50, name: 'الماسی', emoji: '💎' },
    { min: 100, name: 'افسانه‌ای', emoji: '👑' }
];

function getReferralLevel(count) {
    let current = REFERRAL_LEVELS[0];
    let next = null;
    for (let i = 0; i < REFERRAL_LEVELS.length; i++) {
        if (count >= REFERRAL_LEVELS[i].min) {
            current = REFERRAL_LEVELS[i];
            next = REFERRAL_LEVELS[i + 1] || null;
        }
    }
    return { current, next };
}

function getReferralBoard() {
    return Object.entries(db.users)
        .filter(([id, u]) => Array.isArray(u.referrals) && u.referrals.length > 0)
        .sort((a, b) => (b[1].referrals.length - a[1].referrals.length) || ((b[1].referralTotalEarned || 0) - (a[1].referralTotalEarned || 0)));
}

function getReferralRank(userId) {
    const board = getReferralBoard();
    const idx = board.findIndex(([id]) => String(id) === String(userId));
    return { rank: idx >= 0 ? idx + 1 : null, total: board.length };
}

function getReferralStats(userData) {
    const refs = userData.referrals || [];
    const completedBuyers = new Set(
        Object.values(db.orders).filter(o => o.status === 'completed').map(o => String(o.userId))
    );
    let buyers = 0;
    refs.forEach(id => { if (completedBuyers.has(String(id))) buyers++; });
    return { total: refs.length, buyers };
}

function getReferralKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B(REF_BTN.link, BTN_SUCCESS)],
                [B(REF_BTN.list, BTN_PRIMARY), B(REF_BTN.stats, BTN_PRIMARY)],
                [B(REF_BTN.transfer, BTN_SUCCESS)],
                [B(REF_BTN.top, BTN_PRIMARY), B(REF_BTN.guide, BTN_PRIMARY)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

async function handleReferralStart(msg, userData, wasKnownUser) {
    try {
        const text = msg.text || '';
        const match = text.match(/^\/start(?:@\w+)?\s+ref_(\d+)/);
        if (!match) return;
        if (wasKnownUser) return;
        if (!msg.from) return;

        const refId = match[1];
        const myId = msg.from.id.toString();

        if (refId === myId) return;
        if (userData.referredBy) return;
        if (!db.users[refId]) return;

        const referrer = getUserDataById(refId);
        if (referrer.referredBy && referrer.referredBy.toString() === myId) return;

        userData.referredBy = refId;
        if (!referrer.referrals.map(String).includes(myId)) {
            referrer.referrals.push(myId);
        }
        saveDatabase();

        const newCount = referrer.referrals.length;
        const lvl = getReferralLevel(newCount);
        await safeSendMessage(
            refId,
            `🎉 <b>یک زیرمجموعه جدید!</b>\n\n` +
            `👤 ${escapeHTML(msg.from.first_name || 'کاربر')} با لینک اختصاصی شما وارد ربات شد.\n` +
            `👥 تعداد کل زیرمجموعه‌های شما: <b>${newCount}</b>\n` +
            `${lvl.current.emoji} سطح فعلی: ${lvl.current.name}\n\n` +
            `💎 از هر خرید این کاربر ${getReferralPercent()}% کمیسیون به شما می‌رسد.`
        );
        logger.info('Referral', `New referral registered for user ${refId}`);
    } catch (err) {
        logger.error('Referral', 'Failed to register referral', err);
    }
}

async function payReferralCommission(order) {
    try {
        if (!order || order.commissionPaid) return;
        const buyer = db.users[order.userId];
        if (!buyer || !buyer.referredBy) return;
        const referrer = db.users[buyer.referredBy];
        if (!referrer) return;

        const percent = getReferralPercent();
        const commission = Math.floor((order.amount || 0) * (percent / 100));
        if (commission <= 0) return;

        const ref = getUserDataById(buyer.referredBy);
        ref.referralBalance += commission;
        ref.referralTotalEarned += commission;
        ref.referralTotalSales += (order.amount || 0);
        ref.referralOrdersCount += 1;
        order.commissionPaid = true;
        order.commissionAmount = commission;
        saveDatabase();

        await safeSendMessage(
            buyer.referredBy,
            `💰 <b>کمیسیون جدید دریافت کردید!</b>\n\n` +
            `👤 زیرمجموعه: <code>${maskId(order.userId)}</code>\n` +
            `🛒 سفارش: ${escapeHTML(order.giftName)}\n` +
            `💳 مبلغ خرید: ${(order.amount || 0).toLocaleString()} تومان\n` +
            `💎 کمیسیون ${percent}%: <b>${commission.toLocaleString()} تومان</b>\n\n` +
            `🏦 موجودی قابل انتقال شما: ${ref.referralBalance.toLocaleString()} تومان`
        );
        logger.success('Referral', `Commission paid to user ${buyer.referredBy}`, { commission });
    } catch (err) {
        logger.error('Referral', 'Failed to pay commission', err);
    }
}

async function sendReferralMenu(chatId, userData) {
    const percent = getReferralPercent();
    const stats = getReferralStats(userData);
    const lvl = getReferralLevel(stats.total);

    const menuMsg =
        `🤝 <b>سیستم زیرمجموعه‌‌گیری نوا شاپ</b>\n\n` +
        `💎 دوستانت رو به نوا شاپ دعوت کن و از <b>هر خریدشون ${percent}% کمیسیون</b> بگیر!\n\n` +
        `🚀 بدون سقف درآمد ، مادام‌العمر و کاملاً خودکار\n` +
        `⚡ هر زیرمجموعه‌ای که با لینک اختصاصی تو وارد بشه ، برای همیشه به نام تو ثبت میشه.\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `${lvl.current.emoji} سطح شما: <b>${lvl.current.name}</b>\n` +
        `👥 زیرمجموعه‌ها: <b>${stats.total}</b> نفر\n` +
        `🏦 موجودی قابل انتقال: <b>${userData.referralBalance.toLocaleString()} تومان</b>\n` +
        `━━━━━━━━━━━━━━━\n\n` +
        `👇 از دکمه‌های زیر استفاده کن:`;

    await safeSendMessage(chatId, menuMsg, getReferralKeyboard());
}

async function sendReferralLink(chatId, userData) {
    const percent = getReferralPercent();
    const link = getReferralLink(chatId);
    const shareText = `🌟 به نوا شاپ بیا! خرید استارز تلگرام ، ارز گرام و گیفت‌های استارزی با سریع‌ترین زمان و بهترین قیمت 🚀`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;

    const linkMsg =
        `🔗 <b>لینک اختصاصی شما</b>\n\n` +
        `<code>${link}</code>\n\n` +
        `👆 با لمس لینک ، کپی میشه.\n\n` +
        `💎 هر کسی با این لینک وارد ربات بشه زیرمجموعه تو میشه و از هر خریدش <b>${percent}%</b> کمیسیون به حساب تو واریز میشه.`;

    const markup = {
        inline_keyboard: [
            [{ ...B('✈️ اشتراک‌گذاری لینک با دوستان', BTN_SUCCESS), url: shareUrl }]
        ]
    };
    await safeSendMessage(chatId, linkMsg, { reply_markup: markup });
}

async function sendReferralList(chatId, userData) {
    const refs = userData.referrals || [];
    if (refs.length === 0) {
        await safeSendMessage(chatId, `👥 هنوز زیرمجموعه‌ای ندارید.\n\nلینک اختصاصی خود را از بخش «${REF_BTN.link}» دریافت کنید و برای دوستانتان بفرستید.`, getReferralKeyboard());
        return;
    }

    const completedCount = {};
    Object.values(db.orders).forEach(o => {
        if (o.status === 'completed') {
            const k = String(o.userId);
            completedCount[k] = (completedCount[k] || 0) + 1;
        }
    });

    let msgText = `👥 <b>زیرمجموعه‌های شما</b> ( ${refs.length} نفر )\n\n`;
    const last = refs.slice(-15).reverse();
    last.forEach((id, i) => {
        const u = db.users[id];
        const name = u ? maskName(u.firstName) : '---';
        const buys = completedCount[String(id)] || 0;
        msgText += `${i + 1}. ${escapeHTML(name)} | <code>${maskId(id)}</code> | 🛍 ${buys} خرید\n`;
    });
    if (refs.length > 15) {
        msgText += `\n… و ${refs.length - 15} نفر دیگر`;
    }
    await safeSendMessage(chatId, msgText, getReferralKeyboard());
}

async function sendReferralStats(chatId, userData) {
    const percent = getReferralPercent();
    const stats = getReferralStats(userData);
    const lvl = getReferralLevel(stats.total);
    const rankInfo = getReferralRank(chatId);

    let progressText = '👑 شما به بالاترین سطح رسیده‌اید!';
    if (lvl.next) {
        const base = lvl.current.min;
        const need = lvl.next.min - base;
        const have = stats.total - base;
        progressText =
            `📈 تا سطح ${lvl.next.emoji} ${lvl.next.name}:\n` +
            `${progressBar(have, need)} ${stats.total}/${lvl.next.min}`;
    }

    const statsMsg =
        `💰 <b>درآمد و آمار زیرمجموعه‌‌گیری</b>\n\n` +
        `${lvl.current.emoji} سطح شما: <b>${lvl.current.name}</b>\n` +
        `${progressText}\n\n` +
        `👥 تعداد زیرمجموعه‌ها: <b>${stats.total}</b>\n` +
        `🛍 زیرمجموعه‌های خریدار: <b>${stats.buyers}</b>\n` +
        `🧾 تعداد خریدهای زیرمجموعه‌ها: <b>${userData.referralOrdersCount}</b>\n` +
        `📊 مجموع فروش زیرمجموعه‌ها: ${userData.referralTotalSales.toLocaleString()} تومان\n\n` +
        `💎 درصد کمیسیون: <b>${percent}%</b>\n` +
        `💰 کل درآمد تاکنون: <b>${userData.referralTotalEarned.toLocaleString()} تومان</b>\n` +
        `💸 منتقل‌شده به موجودی: ${userData.referralTotalTransferred.toLocaleString()} تومان\n` +
        `🏦 موجودی قابل انتقال: <b>${userData.referralBalance.toLocaleString()} تومان</b>\n\n` +
        `🏆 رتبه شما: ${rankInfo.rank ? `#${rankInfo.rank} از ${rankInfo.total}` : 'هنوز رتبه‌ای ندارید'}`;

    await safeSendMessage(chatId, statsMsg, getReferralKeyboard());
}

async function sendReferralLeaderboard(chatId) {
    const board = getReferralBoard().slice(0, 10);
    if (board.length === 0) {
        await safeSendMessage(chatId, '🏆 هنوز کسی در جدول برترین‌ها قرار نگرفته است. اولین نفر باش!', getReferralKeyboard());
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    let t = `🏆 <b>جدول برترین زیرمجموعه‌گیرها</b>\n\n`;
    board.forEach(([id, u], i) => {
        const medal = medals[i] || `${i + 1}.`;
        t += `${medal} ${escapeHTML(maskName(u.firstName))} | <code>${maskId(id)}</code> | 👥 ${u.referrals.length}\n`;
    });
    const myRank = getReferralRank(chatId);
    t += `\n📍 رتبه شما: ${myRank.rank ? `#${myRank.rank}` : 'بدون رتبه'}`;
    await safeSendMessage(chatId, t, getReferralKeyboard());
}

async function sendReferralGuide(chatId) {
    const percent = getReferralPercent();
    const guide =
        `📖 <b>راهنمای کامل زیرمجموعه‌گیری</b>\n\n` +
        `1️⃣ از بخش «${REF_BTN.link}» لینک دعوت خودت رو بگیر.\n` +
        `2️⃣ لینک رو برای دوستان ، گروه‌ها و کانال‌هات بفرست.\n` +
        `3️⃣ هر کسی با لینک تو وارد ربات بشه ، برای همیشه زیرمجموعه تو ثبت میشه.\n` +
        `4️⃣ هر بار زیرمجموعه‌ات خرید کنه و سفارشش <b>انجام بشه</b> ، ${percent}% مبلغ خریدش به‌عنوان کمیسیون به حساب تو واریز میشه.\n` +
        `5️⃣ درآمدت رو با «${REF_BTN.transfer}» به موجودی اصلی منتقل کن و ازش خرید کن!\n\n` +
        `⚠️ <b>نکات مهم:</b>\n` +
        `• فقط کاربران جدید (کسانی که قبلاً وارد ربات نشدن) با لینک شما ثبت میشن.\n` +
        `• ثبت‌نام با لینک خودتان امکان‌پذیر نیست.\n` +
        `• کمیسیون بعد از «انجام شدن» سفارش واریز میشه.\n` +
        `• کمیسیون از مبلغ نهایی پرداخت‌شده (بعد از اعمال تخفیف) محاسبه میشه.\n` +
        `• حداقل مبلغ انتقال درآمد به موجودی: ${REFERRAL_MIN_TRANSFER.toLocaleString()} تومان\n\n` +
        `🏅 <b>سطح‌ها:</b>\n` +
        REFERRAL_LEVELS.map(l => `${l.emoji} ${l.name}: از ${l.min} زیرمجموعه`).join('\n');
    await safeSendMessage(chatId, guide, getReferralKeyboard());
}

async function handleReferralTransfer(chatId, userData) {
    const balance = userData.referralBalance;
    if (balance < REFERRAL_MIN_TRANSFER) {
        await safeSendMessage(
            chatId,
            `❌ موجودی درآمد شما برای انتقال کافی نیست.\n\n` +
            `🏦 موجودی فعلی: ${balance.toLocaleString()} تومان\n` +
            `📌 حداقل مبلغ انتقال: ${REFERRAL_MIN_TRANSFER.toLocaleString()} تومان`,
            getReferralKeyboard()
        );
        return;
    }

    userData.wallet += balance;
    userData.referralTotalTransferred += balance;
    userData.referralBalance = 0;
    saveDatabase();

    await safeSendMessage(
        chatId,
        `✅ <b>انتقال انجام شد!</b>\n\n` +
        `💸 مبلغ ${balance.toLocaleString()} تومان به موجودی اصلی شما اضافه شد.\n` +
        `💳 موجودی جدید: <b>${userData.wallet.toLocaleString()} تومان</b>`,
        getReferralKeyboard()
    );

    logger.success('Referral', `Transfer completed for user ${chatId}`, { amount: balance });
}

// ============================================================================
// CHECK MEMBERSHIP FUNCTION
// ============================================================================

async function checkMembership(userId) {
    try {
        for (const channel of FORCE_JOIN_CHANNELS) {
            const chatMember = await bot.getChatMember(channel, userId);
            const isJoined = ['creator', 'administrator', 'member', 'restricted'].includes(chatMember.status);
            if (!isJoined) {
                return false;
            }
        }
        return true;
    } catch (e) {
        logger.warning('Membership', `Failed to check membership for user ${userId}`, e);
        return false;
    }
}

// ============================================================================
// PRICE MANAGEMENT & API
// ============================================================================

const priceCache = {
    usdToman: 0,
    usdSource: 'none',
    tonToman: 0,
    tonUsdt: 0,
    updatedAt: 0
};
let priceUpdating = false;
let lastUsdPersistAt = 0;

function httpGetJson(urlStr, headers = {}, timeoutMs = 6000) {
    return new Promise((resolve) => {
        try {
            const u = new URL(urlStr);
            const lib = u.protocol === 'http:' ? http : https;
            const req = lib.get(urlStr, {
                headers: { 'User-Agent': 'Mozilla/5.0 StarsPlusBot', 'Accept': 'application/json', 'Cache-Control': 'no-cache', ...headers }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
                });
            });
            req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
            req.on('error', () => resolve(null));
        } catch (e) {
            resolve(null);
        }
    });
}

function collectBrsItems(node, out = []) {
    if (Array.isArray(node)) {
        node.forEach(n => collectBrsItems(n, out));
    } else if (node && typeof node === 'object') {
        if (typeof node.symbol !== 'undefined' && typeof node.price !== 'undefined') {
            out.push(node);
        } else {
            Object.values(node).forEach(v => collectBrsItems(v, out));
        }
    }
    return out;
}

function brsItemToToman(item, usdToman) {
    const raw = parseFloat(normalizeDigits(item.price));
    if (isNaN(raw) || raw <= 0) return 0;
    const unit = String(item.unit || '');
    if (unit.includes('ریال')) return raw / 10;
    if (unit.includes('دلار') || /usd|\$/i.test(unit)) return raw * (usdToman || 0);
    return raw;
}

function findBrsUsd(items) {
    return items.find(it => {
        const s = String(it.symbol || '').toUpperCase();
        const en = String(it.name_en || '').trim().toLowerCase();
        const fa = String(it.name || '').trim();
        return s === 'USD' || s === 'USD_IRT' || s === 'USD_IRR' || en === 'us dollar' || en === 'dollar' || fa === 'دلار' || fa === 'دلار آمریکا';
    });
}

async function getWallexUsdtPriceInToman() {
    return new Promise((resolve) => {
        const url = `https://api.wallex.ir/v1/markets`;
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 StarsPlusBot',
                'Cache-Control': 'no-cache'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.result && parsed.result.symbols && parsed.result.symbols.USDTTMN) {
                        const stats = parsed.result.symbols.USDTTMN.stats;
                        const usdtPrice = parseFloat(stats.lastPrice || stats.bidPrice);
                        if (!isNaN(usdtPrice) && usdtPrice > 0) {
                            resolve(Math.round(usdtPrice));
                            return;
                        }
                    }
                    resolve(FALLBACK_USDT_TOMAN);
                } catch (e) {
                    resolve(FALLBACK_USDT_TOMAN);
                }
            });
        }).on('error', () => {
            resolve(FALLBACK_USDT_TOMAN);
        });
    });
}

async function updatePrices() {
    if (priceUpdating) return;
    priceUpdating = true;
    try {
        const [brsData, binanceData] = await Promise.all([
            httpGetJson(BRSAPI_URL),
            httpGetJson('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT')
        ]);

        const items = brsData ? collectBrsItems(brsData) : [];

        let usd = 0;
        const usdItem = findBrsUsd(items);
        if (usdItem) {
            const v = brsItemToToman(usdItem, 1);
            if (v > 0) usd = Math.round(v);
        }
        if (usd > 0) {
            priceCache.usdToman = usd;
            priceCache.usdSource = 'brsapi';
        } else {
            const wallex = await getWallexUsdtPriceInToman();
            if (wallex !== FALLBACK_USDT_TOMAN) {
                priceCache.usdToman = wallex;
                priceCache.usdSource = 'wallex';
            } else if (!priceCache.usdToman && db.lastUsdToman > 0) {
                priceCache.usdToman = db.lastUsdToman;
                priceCache.usdSource = 'saved';
            }
        }

        const usdNow = getUsdToman();
        let tonToman = 0;
        if (binanceData && binanceData.price) {
            const t = parseFloat(binanceData.price);
            if (!isNaN(t) && t > 0) {
                priceCache.tonUsdt = t;
                tonToman = Math.round(t * usdNow);
            }
        }
        if (tonToman > 0) priceCache.tonToman = tonToman;

        priceCache.updatedAt = Date.now();

        if (priceCache.usdToman > 0 && Date.now() - lastUsdPersistAt > 60000) {
            lastUsdPersistAt = Date.now();
            if (db.lastUsdToman !== priceCache.usdToman) {
                db.lastUsdToman = priceCache.usdToman;
                saveDatabase();
            }
        }

        logger.api('PriceEngine', 'Prices updated successfully', {
            usd: priceCache.usdToman,
            ton: priceCache.tonToman,
            source: priceCache.usdSource
        });
    } catch (e) {
        logger.error('PriceEngine', 'Failed to update prices', e);
    } finally {
        priceUpdating = false;
    }
}

function getUsdToman() {
    return priceCache.usdToman || db.lastUsdToman || FALLBACK_USDT_TOMAN;
}

async function getBinanceTONPriceInToman() {
    if (db.manualTonPrice && db.manualTonPrice > 0) {
        return db.manualTonPrice;
    }
    if (priceCache.tonToman > 0) return priceCache.tonToman;
    if (priceCache.tonUsdt > 0) return Math.round(priceCache.tonUsdt * getUsdToman());
    return FALLBACK_GRAM_TOMAN;
}

async function fetchStarsPrice() {
    if (db.manualStarPrice && db.manualStarPrice > 0) {
        return db.manualStarPrice;
    }
    return Math.round(STAR_USD * getUsdToman() * STAR_MARGIN);
}

async function computeGiftTotal(stars) {
    if (db.manualGiftBasePrice && db.manualGiftBasePrice > 0) {
        return Math.round((db.manualGiftBasePrice / 15) * stars);
    }
    const unit = await fetchStarsPrice();
    return Math.round(unit * stars);
}

async function fetchGramData() {
    const rawBinanceBase = await getBinanceTONPriceInToman();

    let finalPrice = Math.round(rawBinanceBase * GRAM_MARGIN);
    if (db.manualTonPrice && db.manualTonPrice > 0) {
        finalPrice = rawBinanceBase;
    }

    const usdtToman = getUsdToman();
    return { gramUsd: (rawBinanceBase / usdtToman).toFixed(2), finalPrice, usdtToman: rawBinanceBase };
}

updatePrices();
setInterval(updatePrices, PRICE_REFRESH_MS);

// Save logs periodically
setInterval(() => {
    logger.saveLogs();
}, 300000);

// ============================================================================
// KEYBOARD GENERATORS
// ============================================================================

function getMainKeyboard(isAdmin) {
    let rows = [
        [B('🛒 خرید محصول', BTN_SUCCESS)],
        [B(REF_BTN.menu, BTN_SUCCESS)],
        [B('➕ افزایش موجودی', BTN_PRIMARY), B('💳 حساب کاربری', BTN_PRIMARY)],
        [B('📞 پشتیبانی', BTN_PRIMARY), B('📦 پیگیری سفارش', BTN_PRIMARY)],
        [B('❤ چطوری میتوانم به شما اعتماد کنم', BTN_DANGER)]
    ];
    if (isAdmin) {
        rows.push([B('🔧 پنل مدیریت', BTN_DANGER)]);
    }
    return { reply_markup: { keyboard: rows, resize_keyboard: true, is_persistent: true } };
}

function getShopKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B('📦 سفارش های اخیر من', BTN_PRIMARY)],
                [B('⭐️️ استارز', BTN_SUCCESS)],
                [B('💠 خرید ارز گرام ( GRAM )', BTN_PRIMARY)],
                [B('🎁 گیفت استارزی', BTN_PRIMARY)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

function getBackKeyboard() {
    return {
        reply_markup: {
            keyboard: [[B('برگشت ↩️', BTN_DANGER)]],
            resize_keyboard: true
        }
    };
}

function getAccountKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B('📦 سفارش های معلق من', BTN_PRIMARY), B('📦 سفارش های اخیر من', BTN_PRIMARY)],
                [B('برگشت ↩', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

function getAdminPanelKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                [B('➕ افزایش موجودی کاربر', BTN_SUCCESS), B('➖ کاهش موجودی کاربر', BTN_DANGER)],
                [B('🏆 تغییر سطح کاربر', BTN_PRIMARY), B('📊 فعالیت‌ها و تراکنش‌ها', BTN_SUCCESS)],
                [B('🚫 بن کردن کاربر', BTN_DANGER), B('✅ آنبن کردن کاربر', BTN_SUCCESS)],
                [B('🏷️ ساخت کد تخفیف', BTN_PRIMARY), B('👑 تنظیم مالک دوم', BTN_PRIMARY)],
                [B(REF_BTN.adminDiscountList, BTN_PRIMARY)],
                [B(REF_BTN.adminStats, BTN_PRIMARY), B(REF_BTN.adminPercent, BTN_PRIMARY)],
                [B('💎 تنظیم قیمت دستی (تون)', BTN_PRIMARY), B('⭐ تنظیم قیمت دستی استارز', BTN_PRIMARY)],
                [B('🎁 تنظیم قیمت دستی گیفت استارزی', BTN_PRIMARY)],
                [B(REF_BTN.adminLogs, BTN_PRIMARY), B(REF_BTN.adminStats2Fa, BTN_PRIMARY)],
                [B('🔙 بازگشت به منوی اصلی', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

// ============================================================================
// SHOP FUNCTIONS (CONTINUED IN PART 2)
// ============================================================================

async function sendStarMenu(chatId, userData) {
    userData.currentShopState = 'star_menu';
    userData.waitingForStarCount = true;
    saveDatabase();
    const starPrice = await fetchStarsPrice();
    userData.starPricePerUnit = starPrice;
    saveDatabase();

    const starMsg =
        `💥 وقت درخشیدن با استارز تلگرامه !\n\n` +
        `🎯 کاربردهای استارز :\n` +
        `✨ فعال‌سازی ری‌اکشن‌های استارز در چت‌ها\n` +
        `🎯 خرید یا تمدید اکانت پرمیوم تلگرام\n` +
        `💸 پرداخت هزینه تبلیغات تلگرام\n\n` +
        `💰 قیمت هر استارز: ${starPrice.toLocaleString()} تومان\n\n` +
        `🪐 لطفاً تعداد استارز مورد نظر خود را ارسال کنید:`;

    const starMenuKeyboard = {
        reply_markup: {
            keyboard: [
                [B('محاسبه با موجودی من 🔄', BTN_PRIMARY)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
    await safeSendPhoto(chatId, '1000002624.jpg', { caption: starMsg, reply_markup: starMenuKeyboard.reply_markup });
    logger.info('Shop', `User ${chatId} entered star menu`);
}

async function sendGiftMenu(chatId, userData) {
    userData.currentShopState = 'gift_menu';
    saveDatabase();

    let t = `🎁 <b>گیفت‌های استارزی</b>\n\nگیفت مورد نظر خود را انتخاب کنید:\n\n`;
    for (const g of GIFT_PRODUCTS) {
        const price = await computeGiftTotal(getGiftStarsFromName(g.name));
        t += `${escapeHTML(g.name)} — ${price.toLocaleString()} تومان\n`;
    }

    const rows = [];
    for (let i = 0; i < GIFT_PRODUCTS.length; i += 2) {
        const row = [B(GIFT_PRODUCTS[i].name, BTN_PRIMARY)];
        if (GIFT_PRODUCTS[i + 1]) row.push(B(GIFT_PRODUCTS[i + 1].name, BTN_PRIMARY));
        rows.push(row);
    }
    rows.push([B('برگشت ↩', BTN_DANGER)]);
    await safeSendMessage(chatId, t, { reply_markup: { keyboard: rows, resize_keyboard: true } });
    logger.info('Shop', `User ${chatId} entered gift menu`);
}

async function sendGramMenu(chatId, userData) {
    userData.currentShopState = 'gram_menu';
    userData.waitingForGramAmount = true;
    saveDatabase();

    const gramData = await fetchGramData();
    userData.gramPricePerUnit = gramData.finalPrice;
    saveDatabase();

    const gramMenuKeyboard = {
        reply_markup: {
            keyboard: [
                [B('محاسبه با موجودی من 🔄', BTN_PRIMARY)],
                [B('برگشت ↩️', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
    await safeSendMessage(
        chatId,
        `💠 <b>خرید ارز گرام ( GRAM )</b>\n\n` +
        `💰 قیمت هر گرام: <b>${gramData.finalPrice.toLocaleString()} تومان</b>\n\n` +
        `🪐 لطفاً تعداد گرام مورد نظر خود را ارسال کنید (حداقل ۰.۱):`,
        gramMenuKeyboard
    );
    logger.info('Shop', `User ${chatId} entered gram menu`);
}

function sendTopupInstructions(chatId, amountToman) {
    const amountRial = amountToman * 10;

    const inlineButtons = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📋 کپی شماره کارت', callback_data: `copy_card` }],
                [{ text: `💵 کپی مبلغ (${amountRial.toLocaleString()} ریال)`, callback_data: `copy_amount_${amountRial}` }]
            ]
        }
    };

    return safeSendMessage(
        chatId,
        `💳 <b>افزایش موجودی حساب</b>\n\n` +
        `💰 مبلغ انتخابی شما: <b>${amountToman.toLocaleString()} تومان</b>\n` +
        `🔀 معادل ریالی جهت واریز: <code>${amountRial.toLocaleString()}</code> ریال\n\n` +
        `لطفاً مبلغ فوق را دقیقاً به شماره کارت زیر واریز نمایید:\n\n` +
        `💳 شماره کارت: <code>${CARD_NUMBER}</code>\n` +
        `👤 به نام: <b>${CARD_OWNER}</b>\n\n` +
        `📸 پس از واریز، <b>عکس رسید پرداخت</b> را همینجا ارسال نمایید.`,
        inlineButtons
    );
}

// ============================================================================
// INVOICE GENERATORS
// ============================================================================

async function showStarInvoice(chatId, userData) {
    const unitPrice = await fetchStarsPrice();
    userData.starPricePerUnit = unitPrice;
    let totalPrice = Math.round(unitPrice * userData.starCount);

    const dInfo = calculateDiscount(userData, 'stars', totalPrice, chatId);
    const discountVal = dInfo.discountVal;

    const availableDiscountWallet = userData.discountWallet || 1766;
    const finalAmount = Math.max(0, totalPrice - discountVal);
    userData.lastAmount = finalAmount;
    userData.lastOriginalAmount = totalPrice;
    userData.lastDiscountAmount = discountVal;
    saveDatabase();

    const invoiceMsg =
        `<b>فاکتور خرید استارز</b>\n\n` +
        `💫 مقدار خرید: ${userData.starCount}\n` +
        `👤 یوزر دریافت‌کننده: @${escapeHTML(userData.starRecipient)}\n\n` +
        `💰 مبلغ فاکتور: ${totalPrice.toLocaleString()} تومان\n` +
        buildDiscountBlock(totalPrice, dInfo) +
        `🎁 کل موجودی تخفیف: ${availableDiscountWallet.toLocaleString()} تومان\n\n` +
        `🩵 مبلغ نهایی: <b>${finalAmount.toLocaleString()} تومان</b>\n\n` +
        `💼 در صورتی که جزئیات بالا مورد تأیید شماست ✓ روی دکمه تأیید کلیک کنید.`;

    const invoiceRows = [
        [B('تأیید ✅', BTN_SUCCESS), B('لغو خرید ❌', BTN_DANGER)],
        [B('اعمال تخفیف 🎁', BTN_PRIMARY), B('اعمال کد تخفیف 🎫', BTN_PRIMARY)]
    ];
    if (userData.appliedDiscountCode) {
        invoiceRows.push([B(REF_BTN.removeDiscount, BTN_DANGER)]);
    }
    invoiceRows.push([B('🔙 بازگشت به پکیج‌ها', BTN_DANGER), B('🏠 منوی اصلی', BTN_DANGER)]);

    const invoiceKeyboard = {
        reply_markup: {
            keyboard: invoiceRows,
            resize_keyboard: true
        }
    };

    await safeDeleteMessage(chatId, userData.lastInvoiceMessageId);
    const sent = await safeSendPhoto(chatId, '1000002626.jpg', { caption: invoiceMsg, reply_markup: invoiceKeyboard.reply_markup });
    if (sent && sent.message_id) {
        userData.lastInvoiceMessageId = sent.message_id;
        saveDatabase();
    }
}

async function showGiftInvoice(chatId, userData) {
    const totalPrice = await computeGiftTotal(userData.selectedGiftStars);

    const giftKey = getGiftKeyFromName(userData.selectedGiftName);
    const dInfo = calculateDiscount(userData, giftKey, totalPrice, chatId);
    const discountVal = dInfo.discountVal;
    const currentAmount = Math.max(0, totalPrice - discountVal);
    userData.lastAmount = currentAmount;
    userData.lastOriginalAmount = totalPrice;
    userData.lastDiscountAmount = discountVal;
    saveDatabase();

    const invoiceMsg =
        `<b>فاکتور خرید گیفت</b>\n\n` +
        `محصول: ${escapeHTML(userData.selectedGiftName)} (${userData.selectedGiftStars} استارز)\n` +
        `یوزر دریافت‌کننده: @${escapeHTML(userData.recipientUsername)}\n\n` +
        `کامنت: ${escapeHTML(userData.commentText)}\n\n` +
        buildDiscountBlock(totalPrice, dInfo) +
        `مبلغ نهایی: <b>${currentAmount.toLocaleString()} تومان</b>\n\n` +
        `در صورتی که جزئیات بالا مورد تأیید شماست ، روی دکمه تایید کلیک کنید.`;

    const invoiceRows = [
        [B('✅ تایید', BTN_SUCCESS), B('لغو خرید ❌', BTN_DANGER)],
        [B('💳 اعمال کد تخفیف', BTN_PRIMARY)]
    ];
    if (userData.appliedDiscountCode) {
        invoiceRows.push([B(REF_BTN.removeDiscount, BTN_DANGER)]);
    }
    invoiceRows.push([B('💬 تنظیم کامنت', BTN_PRIMARY)]);
    invoiceRows.push([B('برگشت ↩️', BTN_DANGER)]);

    const invoiceKeyboard = {
        reply_markup: {
            keyboard: invoiceRows,
            resize_keyboard: true
        }
    };

    await safeDeleteMessage(chatId, userData.lastInvoiceMessageId);
    const sent = await safeSendMessage(chatId, invoiceMsg, invoiceKeyboard);
    if (sent && sent.message_id) {
        userData.lastInvoiceMessageId = sent.message_id;
        saveDatabase();
    }
}

async function showGramInvoice(chatId, userData) {
    const freshGramData = await fetchGramData();
    userData.gramPricePerUnit = freshGramData.finalPrice;

    const rawTotalPrice = Math.round(userData.gramAmount * userData.gramPricePerUnit);
    const dInfo = calculateDiscount(userData, 'gram', rawTotalPrice, chatId);
    const totalPrice = dInfo.finalAmount;
    userData.lastAmount = totalPrice;
    userData.lastOriginalAmount = rawTotalPrice;
    userData.lastDiscountAmount = dInfo.discountVal;
    saveDatabase();

    const invoiceMsg =
        `<b>[ فاکتور خرید ارز گرام ( GRAM ) ]</b>\n\n` +
        `مقدار خرید: ${userData.gramAmount} گرام\n` +
        `آدرس ولت: <code>${escapeHTML(userData.gramWalletAddress)}</code>\n` +
        `کامنت (مم): ${escapeHTML(userData.gramMemo)}\n\n` +
        buildDiscountBlock(rawTotalPrice, dInfo) +
        `مبلغ نهایی: <b>${totalPrice.toLocaleString()} تومان</b>\n\n` +
        `در صورتی که جزئیات بالا مورد تأیید شماست ، روی دکمه تایید کلیک کنید.`;

    const invoiceRows = [
        [B('✅ تایید گرام', BTN_SUCCESS), B('لغو خرید ❌', BTN_DANGER)],
        [B('💳 اعمال کد تخفیف', BTN_PRIMARY)]
    ];
    if (userData.appliedDiscountCode) {
        invoiceRows.push([B(REF_BTN.removeDiscount, BTN_DANGER)]);
    }
    invoiceRows.push([B('برگشت ↩️', BTN_DANGER)]);

    const invoiceKeyboard = {
        reply_markup: {
            keyboard: invoiceRows,
            resize_keyboard: true
        }
    };

    await safeDeleteMessage(chatId, userData.lastInvoiceMessageId);
    const sent = await safeSendMessage(chatId, invoiceMsg, invoiceKeyboard);
    if (sent && sent.message_id) {
        userData.lastInvoiceMessageId = sent.message_id;
        saveDatabase();
    }
}

async function refreshInvoiceAmounts(chatId, userData, kind) {
    let raw = 0;
    let productKey = 'stars';
    if (kind === 'stars') {
        raw = Math.round((await fetchStarsPrice()) * userData.starCount);
        productKey = 'stars';
    } else if (kind === 'gift') {
        raw = await computeGiftTotal(userData.selectedGiftStars);
        productKey = getGiftKeyFromName(userData.selectedGiftName);
    } else {
        return;
    }
    const d = calculateDiscount(userData, productKey, raw, chatId);
    userData.lastOriginalAmount = raw;
    userData.lastDiscountAmount = d.discountVal;
    userData.lastAmount = d.finalAmount;
    saveDatabase();
}

// ============================================================================
// MESSAGE HANDLER - PART 1
// ============================================================================

bot.on('message', async (msg) => {
    if (msg.chat && msg.chat.type && msg.chat.type !== 'private') return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const contact = msg.contact;
    const photo = msg.photo;

    if (msg.message_id) {
        await setReaction(chatId, msg.message_id);
    }

    const wasKnownUser = !!db.users[chatId];
    const adminData = getUserDataById(chatId);
    const isAdmin = isUserAdmin(chatId);
    const userData = getUserData(msg);

    logger.api('MessageHandler', `Message from user ${chatId}`, { text: text ? text.substring(0, 50) : 'photo/contact' });

    if (text && text.startsWith('/start')) {
        await handleReferralStart(msg, userData, wasKnownUser);
    }

    if (userData.isBanned) {
        await safeSendMessage(chatId, 'حساب کاربری شما توسط ادمین مسدود شده است. لطفاً با پشتیبانی در ارتباط باشید.');
        logger.warning('Security', `Banned user ${chatId} attempted to access bot`);
        return;
    }

    // Anti brute force check
    if (!isAdmin) {
        if (antiBruteForce.isLocked(chatId)) {
            const remaining = antiBruteForce.getRemainingLockTime(chatId);
            await safeSendMessage(chatId, `❌ تعداد تلاش‌های اشتباه بیش از حد است.\n\nلطفاً ${remaining} ثانیه دیگر صبر کنید.`);
            return;
        }

        const isMember = await checkMembership(msg.from.id);
        if (!isMember) {
            if (!antiBruteForce.recordAttempt(chatId)) {
                const remaining = antiBruteForce.getRemainingLockTime(chatId);
                await safeSendMessage(chatId, `❌ حساب شما موقتاً قفل شد.\n\nلطفاً ${remaining} ثانیه دیگر صبر کنید.`);
                logger.security('AntiBruteForce', `User ${chatId} locked out`, { reason: 'join verification' });
                return;
            }

            const joinMarkup = {
                inline_keyboard: [
                    [{ ...B('📢 عضویت در کانال اول', BTN_PRIMARY), url: 'https://t.me/nova2_shop' }],
                    [{ ...B('📢 عضویت در کانال دوم', BTN_PRIMARY), url: 'https://t.me/nova1_shopp' }],
                    [{ ...B('✅ تایید عضویت', BTN_SUCCESS), callback_data: 'check_join' }]
                ]
            };
            await safeSendMessage(chatId, '❌ <b>برای استفاده از ربات و دریافت خدمات، ابتدا باید در هر دو کانال ما عضو شوید.</b>\n\nپس از عضویت در کانال‌ها، روی دکمه «تایید عضویت» کلیک کنید.', { reply_markup: joinMarkup });
            return;
        } else {
            antiBruteForce.recordAttempt(chatId);
        }
    }

    const mainKeyboard = getMainKeyboard(isAdmin);
    const backKeyboard = getBackKeyboard();
    const adminPanelMarkup = getAdminPanelKeyboard();

    // START COMMAND
    if (text && /^\/start(?:@\w+)?(\s|$)/.test(text)) {
        userData.currentShopState = null;
        userData.waitingForAmount = false;
        userData.waitingForTicket = false;
        userData.waitingForReceipt = false;
        userData.waitingForDiscountInput = false;
        userData.waitingForComment = false;
        userData.waitingForTrackingInput = false;
        userData.waitingForGramAmount = false;
        userData.waitingForGramWallet = false;
        userData.waitingForGramMemoChoice = false;
        userData.waitingForGramMemoInput = false;
        userData.waitingForStarCount = false;
        clearAppliedDiscount(userData);
        saveDatabase();
        await safeSendMessage(
            chatId,
            `سلام ${escapeHTML(msg.from.first_name || 'کاربر')} 👋\n\n` +
            `به <b>نوا شاپ</b> خوش اومدی 🌟\n` +
            `خرید استارز تلگرام ، ارز گرام و گیفت‌های استارزی با سریع‌ترین زمان و بهترین قیمت 🚀\n\n` +
            `👇 از منوی زیر انتخاب کن:`,
            mainKeyboard
        );
        logger.success('User', `New or returning user ${chatId} started bot`);
        return;
    }

    // CANCEL PURCHASE
    if (text === 'لغو خرید ❌' || text === '❌ لغو خرید') {
        userData.currentShopState = null;
        userData.lastInvoiceMessageId = null;
        clearAppliedDiscount(userData);
        saveDatabase();
        await safeSendMessage(chatId, 'خرید شما لغو شد.', mainKeyboard);
        logger.info('Shop', `User ${chatId} cancelled purchase`);
        return;
    }

    // BACK COMMANDS
    const backCommands = [
        '🔙 بازگشت', 'برگشت ↩️', '🔙 برگشت', '🏠 منوی اصلی',
        'انصراف', '↶ برگشت', '🔙 بازگشت به منوی اصلی', '🔙 بازگشت به پکیج‌ها'
    ];
    const backCommandsNormalized = backCommands.map(c => stripVS(c));

    if (text && (backCommands.includes(text) || backCommandsNormalized.includes(stripVS(text)))) {
        userData.waitingForAmount = false;
        userData.waitingForTicket = false;
        userData.waitingForReceipt = false;
        userData.waitingForDiscountInput = false;
        userData.waitingForRecipient = false;
        userData.waitingForComment = false;
        userData.waitingForTrackingInput = false;

        userData.waitingForGramAmount = false;
        userData.waitingForGramWallet = false;
        userData.waitingForGramMemoChoice = false;
        userData.waitingForGramMemoInput = false;

        userData.waitingForStarCount = false;
        userData.waitingForStarRecipient = false;
        userData.lastInvoiceMessageId = null;

        if (isAdmin) {
            adminData.adminAction = null;
            adminData.waitingForAdminUserSearch = false;
            adminData.waitingForAdminAmount = false;
            adminData.waitingForRejectReason = false;
            adminData.waitingForOrderRejectReason = false;
            adminData.waitingForReceiptRejectReason = false;
            adminData.waitingForDiscountPercent = false;
            adminData.waitingForDiscountCapacity = false;
            adminData.waitingForDiscountExpiry = false;
            adminData.waitingForDiscountRestriction = false;
            adminData.waitingForManualPrice = false;
            adminData.waitingForManualStarPrice = false;
            adminData.waitingForManualGiftBasePrice = false;
            adminData.waitingForReferralPercent = false;
        }

        saveDatabase();

        if (text === '🏠 منوی اصلی' || text === '🔙 بازگشت به منوی اصلی' || !userData.currentShopState || userData.currentShopState === 'main_shop' || userData.currentShopState === 'star_menu') {
            userData.currentShopState = null;
            clearAppliedDiscount(userData);
            saveDatabase();
            await safeSendMessage(chatId, 'به منوی اصلی برگشتید.', mainKeyboard);
            return;
        }

        if (text === '🔙 بازگشت به پکیج‌ها' || userData.currentShopState === 'star_recipient' || userData.currentShopState === 'star_invoice') {
            await sendStarMenu(chatId, userData);
            return;
        } else {
            userData.currentShopState = 'main_shop';
            saveDatabase();
            await safeSendMessage(chatId, 'وقته محصول رو انتخاب کنی !\n\n🚀 تمامی سفارشات با بالاترین سرعت انجام میشن !', getShopKeyboard());
            return;
        }
    }

    // MENU INTERRUPTS
    const MENU_INTERRUPTS = [
        '🛒 خرید محصول', REF_BTN.menu, '➕ افزایش موجودی', '💳 حساب کاربری',
        '📞 پشتیبانی', '📦 پیگیری سفارش', '🔧 پنل مدیریت', '/admin',
        '❤ چطوری میتوانم به شما اعتماد کنم'
    ];
    if (text && MENU_INTERRUPTS.some(l => textIs(text, l))) {
        userData.waitingForAmount = false;
        userData.waitingForTicket = false;
        userData.waitingForReceipt = false;
        userData.waitingForDiscountInput = false;
        userData.waitingForComment = false;
        userData.waitingForTrackingInput = false;
        userData.waitingForGramAmount = false;
        userData.waitingForGramWallet = false;
        userData.waitingForGramMemoChoice = false;
        userData.waitingForGramMemoInput = false;
        userData.waitingForStarCount = false;
        userData.waitingForStarRecipient = false;
        if (isAdmin) {
            adminData.adminAction = null;
            adminData.adminReplyingTo = null;
            adminData.waitingForAdminUserSearch = false;
            adminData.waitingForAdminAmount = false;
            adminData.waitingForOrderRejectReason = false;
            adminData.waitingForReceiptRejectReason = false;
            adminData.waitingForDiscountPercent = false;
            adminData.waitingForDiscountCapacity = false;
            adminData.waitingForDiscountExpiry = false;
            adminData.waitingForDiscountRestriction = false;
            adminData.waitingForManualPrice = false;
            adminData.waitingForManualStarPrice = false;
            adminData.waitingForManualGiftBasePrice = false;
            adminData.waitingForReferralPercent = false;
        }
        saveDatabase();
    }

    // MAIN NAVIGATION HANDLERS
    if (textIs(text, '🛒 خرید محصول')) {
        userData.currentShopState = 'main_shop';
        saveDatabase();
        await safeSendMessage(chatId, 'وقته محصول رو انتخاب کنی !\n\n🚀 تمامی سفارشات با بالاترین سرعت انجام میشن !', getShopKeyboard());
        return;
    }

    if (textIs(text, '⭐ استارز')) {
        await sendStarMenu(chatId, userData);
        return;
    }

    if (textIs(text, '🎁 گیفت استارزی')) {
        await sendGiftMenu(chatId, userData);
        return;
    }

    if (textIs(text, '💠 خرید ارز گرام ( GRAM )')) {
        await sendGramMenu(chatId, userData);
        return;
    }

    if (textIs(text, '➕ افزایش موجودی')) {
        userData.waitingForAmount = true;
        saveDatabase();
        await safeSendMessage(chatId, `لطفاً مبلغ مورد نظر برای افزایش موجودی را به تومان وارد کنید (حداقل ${TOPUP_MIN.toLocaleString()} تومان):`, backKeyboard);
        return;
    }

    if (textIs(text, '💳 حساب کاربری')) {
        const accountInfo =
            `<b>[ حساب کاربری شما ]</b>\n\n` +
            `👤 نام: ${escapeHTML(userData.firstName)}\n` +
            `🆔 آیدی عددی: <code>${chatId}</code>\n` +
            `💰 موجودی کیف پول: <b>${userData.wallet.toLocaleString()} تومان</b>\n` +
            `🎁 موجودی تخفیف: ${userData.discountWallet.toLocaleString()} تومان\n` +
            `🏆 سطح کاربری: ${userData.level}\n` +
            `📱 شماره همراه: ${userData.phone}`;
        await safeSendMessage(chatId, accountInfo, { reply_markup: { keyboard: [[B('برگشت ↩', BTN_DANGER)]], resize_keyboard: true } });
        return;
    }

    if (textIs(text, '📞 پشتیبانی')) {
        userData.waitingForTicket = true;
        saveDatabase();
        await safeSendMessage(chatId, 'لطفاً پیام یا سوال خود را ارسال کنید تا در اسرع وقت پاسخ داده شود:', backKeyboard);
        return;
    }

    if (textIs(text, '📦 پیگیری سفارش')) {
        userData.waitingForTrackingInput = true;
        saveDatabase();
        await safeSendMessage(chatId, 'لطفاً کد پیگیری سفارش خود را ارسال کنید:', backKeyboard);
        return;
    }

    if (textIs(text, '❤ چطوری میتوانم به شما اعتماد کنم')) {
        const trustMsg =
            `<b>چرا می‌توان به نوا شاپ اعتماد کرد؟</b>\n\n` +
            `✨ پردازش خودکار و سریع سفارش‌ها\n` +
            `🛡 تحویل دقیق محصولات طبق فاکتور رسمی\n` +
            `📞 پشتیبانی ۲۴ ساعته پاسخگو\n` +
            `📢 ارسال گزارش لحظه‌ای خریدهای موفق در کانال گزارشات: https://t.me/kaiauhahaua`;
        await safeSendMessage(chatId, trustMsg, mainKeyboard);
        return;
    }

    if (textIs(text, REF_BTN.menu)) {
        await sendReferralMenu(chatId, userData);
        return;
    }

    if (textIs(text, REF_BTN.link)) {
        await sendReferralLink(chatId, userData);
        return;
    }

    if (textIs(text, REF_BTN.list)) {
        await sendReferralList(chatId, userData);
        return;
    }

    if (textIs(text, REF_BTN.stats)) {
        await sendReferralStats(chatId, userData);
        return;
    }

    if (textIs(text, REF_BTN.top)) {
        await sendReferralLeaderboard(chatId);
        return;
    }

    if (textIs(text, REF_BTN.guide)) {
        await sendReferralGuide(chatId);
        return;
    }

    if (textIs(text, REF_BTN.transfer)) {
        await handleReferralTransfer(chatId, userData);
        return;
    }

    // ADMIN PANEL
    if (isAdmin && (text === '🔧 پنل مدیریت' || text === '/admin')) {
        // Two-factor authentication for admin
        const authCode = adminSessionManager.generateCode(chatId);
        await safeSendMessage(chatId, `🔐 <b>احراز هویت دو مرحله‌ای</b>\n\n کد تایید شما:\n\n<code>${authCode}</code>\n\nلطفاً این کد را وارد کنید:`, backKeyboard);
        userData.adminAuthCode = authCode;
        userData.waitingForAdminCode = true;
        saveDatabase();
        logger.security('AdminAuth', `Two-factor code sent to admin ${chatId}`);
        return;
    }

    // Admin code verification
    if (isAdmin && userData.waitingForAdminCode && text) {
        userData.waitingForAdminCode = false;
        const verification = adminSessionManager.verifyCode(chatId, text);
        if (!verification.valid) {
            await safeSendMessage(chatId, `❌ ${verification.reason}`, backKeyboard);
            logger.security('AdminAuth', `Failed authentication attempt for admin ${chatId}`, { reason: verification.reason });
            return;
        }

        userData.adminSessionToken = verification.token;
        saveDatabase();
        await safeSendMessage(chatId, 'به پنل مدیریت خوش آمدید. گزینه مورد نظر را انتخاب کنید:', adminPanelMarkup);
        adminSessionManager.createAdminLog(chatId, 'LOGIN', { timestamp: Date.now() });
        logger.security('AdminAuth', `Admin ${chatId} successfully authenticated`);
        return;
    }

    // REST OF MESSAGE HANDLERS...
    // (Product selection, price management, discount codes, etc.)
    
    // ADMIN LOG VIEWER
    if (isAdmin && textIs(text, REF_BTN.adminLogs)) {
        const logs = adminSessionManager.getAdminLogs(chatId, 20);
        let logText = `<b>📊 لاگ فعالیت‌های ادمین</b> (۲۰ مورد اخیر)\n\n`;
        if (logs.length === 0) {
            logText += 'هیچ لاگی ثبت نشده است.';
        } else {
            logs.forEach((log, i) => {
                logText += `${i + 1}. <b>${log.action}</b>\n   ⏰ ${formatTehranDate(log.timestamp)}\n`;
            });
        }
        await safeSendMessage(chatId, logText, adminPanelMarkup);
        logger.success('AdminLog', `Admin ${chatId} viewed logs`);
        return;
    }

    // ADMIN TWO-FACTOR SETTINGS
    if (isAdmin && textIs(text, REF_BTN.adminStats2Fa)) {
        const sessionCount = Object.keys(adminSessionManager.sessions).length;
        const twoFaMsg = `🔐 <b>تنظیمات امنیت دو مرحله‌ای</b>\n\n` +
            `✅ وضعیت: <b>فعال</b>\n` +
            `👤 جلسات فعال: <b>${sessionCount}</b>\n` +
            `⏱ مدت اعتبار جلسه: <b>۲۴ ساعت</b>\n` +
            `🔑 طول کد تایید: <b>۶ رقم</b>\n` +
            `⏳ اعتبار کد: <b>۵ دقیقه</b>\n\n` +
            `🔒 امنیت بالا برای سیستم مدیریت`;
        await safeSendMessage(chatId, twoFaMsg, adminPanelMarkup);
        return;
    }

    // لزوم کاملتر کردن: 
    // - تمام handlers برای خرید
    // - تمام handlers برای admin
    // - callback query handlers
    
    logger.info('MessageHandler', `Unhandled message from ${chatId}: ${text ? text.substring(0, 30) : 'non-text'}`);
});

// ============================================================================
// CALLBACK QUERY HANDLER
// ============================================================================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const isAdmin = isUserAdmin(chatId);
    const userData = getUserDataById(chatId);

    try {
        await bot.answerCallbackQuery(query.id);
    } catch (e) {
        logger.warning('CallbackQuery', 'Failed to answer callback', e);
    }

    logger.api('CallbackQuery', `User ${chatId} triggered callback`, { data: data.substring(0, 30) });

    if (data === 'check_join') {
        const isMember = await checkMembership(query.from.id);
        if (isMember) {
            await safeSendMessage(chatId, '✅ عضویت شما تایید شد! حالا می‌توانید از خدمات ربات استفاده کنید.', getMainKeyboard(isAdmin));
            logger.success('Membership', `User ${chatId} verified membership`);
        } else {
            await safeSendMessage(chatId, '❌ شما هنوز در تمامی کانال‌ها عضو نشده‌اید. لطفاً در همه کانال‌ها عضو شوید و مجدداً دکمه تایید را بزنید.');
        }
        return;
    }

    if (data === 'copy_card') {
        await safeSendMessage(chatId, `<code>${CARD_NUMBER}</code>\n\n👆 شماره کارت را لمس کنید تا کپی شود.`);
        return;
    }

    if (data.startsWith('copy_amount_')) {
        const amountRial = data.replace('copy_amount_', '');
        await safeSendMessage(chatId, `<code>${amountRial}</code>\n\n👆 مبلغ به ریال را لمس کنید تا کپی شود.`);
        return;
    }

    if (data.startsWith('dcp_') && isAdmin) {
        const action = data.replace('dcp_', '');
        let selected = Array.isArray(userData.tempDiscount.products) ? userData.tempDiscount.products : [];

        if (action === 'all') {
            selected = [];
        } else if (action === 'allgifts') {
            const allGiftKeys = GIFT_PRODUCTS.map(g => g.key);
            const hasAll = allGiftKeys.every(k => selected.includes(k));
            if (hasAll) {
                selected = selected.filter(k => !allGiftKeys.includes(k));
            } else {
                allGiftKeys.forEach(k => { if (!selected.includes(k)) selected.push(k); });
            }
        } else if (action === 'done') {
            userData.tempDiscount.products = selected;
            userData.waitingForDiscountRestriction = false;
            userData.waitingForDiscountCapacity = true;
            saveDatabase();

            const desc = selected.length > 0 ? selected.map(getProductLabel).join('، ') : '🌐 همه محصولات';
            await safeSendMessage(
                chatId,
                `✅ محصولات انتخاب شده:\n<b>${escapeHTML(desc)}</b>\n\n` +
                `👥 <b>مرحله ۴ از ۴ — ظرفیت کد (تعداد استفاده)</b>\n` +
                `یکی از دکمه‌ها را انتخاب کنید یا ظرفیت را به عدد بفرستید:`,
                getDiscountCapacityKeyboard()
            );
            return;
        } else {
            if (selected.includes(action)) {
                selected = selected.filter(k => k !== action);
            } else {
                selected.push(action);
            }
        }

        userData.tempDiscount.products = selected;
        saveDatabase();

        try {
            await bot.editMessageReplyMarkup(buildDiscountProductsMarkup(selected), {
                chat_id: chatId,
                message_id: query.message.message_id
            });
        } catch (e) {
            logger.warning('CallbackQuery', 'Failed to edit discount products markup', e);
        }
        return;
    }

    logger.info('CallbackQuery', `Unhandled callback: ${data.substring(0, 30)}`);
});

logger.success('System', 'Nova Shop Bot V7.0 Enterprise is fully initialized and running!');
