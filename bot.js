/**
 * ============================================================================
 * Stars Plus TELEGRAM BOT - V3.13 (COLORED BUTTONS, RENDER COMPATIBLE, BINANCE & WALLEX LIVE SYNC)
 * V4.0 ADDITIONS: ADVANCED REFERRAL SYSTEM + ADVANCED DISCOUNT CODE ENGINE
 * ============================================================================
 */

const TelegramModule = require('node-telegram-bot-api');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// ============================================================================
// RENDER WEB SERVICE PORT BINDING SERVER
// ============================================================================
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Stars Plus Bot Web Service is running successfully!\n');
});

server.listen(PORT, () => {
    console.log(`[Server] HTTP server is listening on port ${PORT}`);
});

// ============================================================================
// ENTERPRISE CONFIGURATION & CONSTANTS
// ============================================================================

const TOKEN = '8696660217:AAEBI6iOD-OAZpWbCIGy2KU-s-Fc5OQwwVE';
const ADMIN_ID_USERNAME = '@shantiaNFT';
const ADMIN_NUMERIC_ID = 8750484397; 
const EXTRA_ADMIN_ID = '8942987641';
const DB_FILE = path.join(__dirname, 'database.json');

const FORCE_JOIN_CHANNELS = ['@nova2_shop', '@nova1_shopp'];
const REPORT_CHANNEL = '@nova1_shopp';

/**
 * Bot username (used to build referral links)
 */
const BOT_USERNAME = 'NOVA_SHOP3_BOT';

/**
 * Referral system defaults
 */
const REFERRAL_DEFAULT_PERCENT = 5;
const REFERRAL_MIN_TRANSFER = 1000;

/**
 * Fixed USD Price for single Telegram Star unit.
 */
const STAR_USD = 0.015;

/**
 * Fallback prices
 */
const FALLBACK_USDT_TOMAN = 65000; 
const FALLBACK_GRAM_TOMAN = 311591; 

// ============================================================================
// COLORED BUTTON HELPER (Telegram Bot API button styles)
// ============================================================================
/**
 * Telegram supports a "style" field on keyboard buttons and inline buttons:
 *   'primary' -> blue
 *   'success' -> green
 *   'danger'  -> red
 * If style is omitted, the button keeps the default Telegram color.
 * The text of the button is NOT changed, so all text-matching logic still works.
 */
const BTN_PRIMARY = 'primary';
const BTN_SUCCESS = 'success';
const BTN_DANGER = 'danger';

function B(text, style) {
    return style ? { text, style } : { text };
}

// ============================================================================
// SYSTEM LOGGING UTILITY
// ============================================================================

class SystemLogger {
    static info(context, message) {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] [${timestamp}] [${context}] - ${message}`);
    }

    static error(context, message, err = null) {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] [${timestamp}] [${context}] - ${message}`);
        if (err && err.message) {
            console.error(`       Details: ${err.message}`);
        }
    }

    static apiTrace(service, data) {
        const timestamp = new Date().toISOString();
        console.log(`[API] [${timestamp}] [${service}] - ${data}`);
    }
}

// ============================================================================
// BOT INITIALIZATION
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
    SystemLogger.error('Process', 'Uncaught Exception', err);
});
process.on('unhandledRejection', (reason, promise) => { 
    SystemLogger.error('Process', `Unhandled Rejection at: ${promise}`, new Error(String(reason)));
});

// ============================================================================
// DATABASE ARCHITECTURE & MANAGEMENT
// ============================================================================

let db = { 
    users: {}, 
    orders: {}, 
    discountCodes: {},
    secondaryAdmin: null,
    manualTonPrice: 0, 
    manualStarPrice: 0,
    manualGiftBasePrice: 0, // قیمت دستی پایه برای گیفت 15 استارزی
    referralPercent: REFERRAL_DEFAULT_PERCENT // درصد کمیسیون زیرمجموعه‌گیری
};

function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
            if (typeof db.manualTonPrice === 'undefined') db.manualTonPrice = 0;
            if (typeof db.manualStarPrice === 'undefined') db.manualStarPrice = 0;
            if (typeof db.manualGiftBasePrice === 'undefined') db.manualGiftBasePrice = 0;
            if (typeof db.referralPercent === 'undefined') db.referralPercent = REFERRAL_DEFAULT_PERCENT;
            if (!db.discountCodes) db.discountCodes = {};
            if (!db.users) db.users = {};
            if (!db.orders) db.orders = {};
            SystemLogger.info('Database', 'Successfully loaded records from disk.');
        } else {
            SystemLogger.info('Database', 'No existing database found. Initializing new storage.');
            saveDatabase();
        }
    } catch (e) {
        SystemLogger.error('Database', 'Failed to load database file.', e);
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        SystemLogger.error('Database', 'Failed to write database file.', e);
    }
}

loadDatabase();
SystemLogger.info('System', 'Nova Shop Bot is running!');

// ============================================================================
// USER STATE MACHINE & DATA MANAGEMENT
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

            // ---------------- REFERRAL SYSTEM FIELDS ----------------
            referredBy: null,
            referrals: [],
            referralBalance: 0,
            referralTotalEarned: 0,
            referralTotalSales: 0,
            referralOrdersCount: 0,
            referralTotalTransferred: 0,
            joinedAt: Date.now()
        };
        saveDatabase();
    }

    // Backward-compatibility normalisation for users stored before V4.0
    const u = db.users[userId];
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
    } catch (err) {}
}

async function safeSendMessage(chatId, text, options = {}) {
    try {
        const finalOptions = { parse_mode: 'HTML', ...options };
        return await bot.sendMessage(chatId, text, finalOptions);
    } catch (err) {
        SystemLogger.error('TelegramAPI', `Failed to send message to ${chatId}`, err);
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
        SystemLogger.error('TelegramAPI', `Failed to send photo to ${chatId}. Falling back to text.`, err);
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
        SystemLogger.error('API', 'Failed to send photo to admins', e);
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
    } catch (err) {}
}

function getFormattedTime() {
    const now = new Date();
    const tehranTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tehran"}));
    const y = tehranTime.getFullYear();
    const m = String(tehranTime.getMonth() + 1).padStart(2, '0');
    const d = String(tehranTime.getDate()).padStart(2, '0');
    const hh = String(tehranTime.getHours()).padStart(2, '0');
    const mm = String(tehranTime.getMinutes()).padStart(2, '0');
    const ss = String(tehranTime.getSeconds()).padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

async function sendChannelReport(order) {
    try {
        const channelId = REPORT_CHANNEL;
        const userIdStr = order.userId.toString();
        const maskedUserId = userIdStr.length > 4 
            ? userIdStr.substring(0, 2) + '******' + userIdStr.slice(-2)
            : userIdStr;
        
        const formattedTime = getFormattedTime();

        const reportMsg = 
            `گزارشات | نوا شاپ\n` +
            `گزارش #خرید_موفق 🛍\n\n` +
            `👤 خریدار: <code>${maskedUserId}</code>\n` +
            `🛒 سفارش: ${escapeHTML(order.giftName)}\n` +
            `💳 مبلغ پرداخت شده: ${order.amount.toLocaleString()} تومان\n\n` +
            `🕰 ${formattedTime}\n` +
            `🐺 @NOVA_SHOP3_BOT`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [B('🤖 | برای خرید اقدام کن!', BTN_SUCCESS)].map(b => ({ ...b, url: 'https://t.me/NOVA_SHOP3_BOT' }))
                ]
            }
        };

        await safeSendMessage(channelId, reportMsg, inlineKeyboard);
    } catch (err) {
        SystemLogger.error('ChannelReport', 'Failed to send report to channel', err);
    }
}

// ============================================================================
// GENERIC TEXT HELPERS (digits normalisation, emoji variation selector strip...)
// ============================================================================

function stripVS(str) {
    return str ? str.toString().replace(/\uFE0F/g, '') : str;
}

/**
 * Compares a user's text with a button label while ignoring emoji variation selectors
 * (this prevents invisible-character mismatches between keyboards and handlers).
 */
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
// BUTTON LABELS FOR NEW FEATURES
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
    removeDiscount: '🗑 حذف کد تخفیف'
};

// ============================================================================
// PRODUCT CATALOG (used for discount code restrictions)
// ============================================================================

const GIFT_PRODUCTS = [
    { key: 'gift_heart',   name: '💖 گیفت قلب ( 15 )' },
    { key: 'gift_teddy',   name: '🧸 گیفت تدی ( 15 )' },
    { key: 'gift_box',     name: '🎁 گیفت کادو ( 25 )' },
    { key: 'gift_rose',    name: '🌹 گیفت گل رز ( 25 )' },
    { key: 'gift_cake',    name: '🎂 گیفت کیک ( 50 )' },
    { key: 'gift_flower',  name: '🌷 گیفت گل ( 50 )' },
    { key: 'gift_bottle',  name: '🍾 گیفت بطری ( 50 )' },
    { key: 'gift_rocket',  name: '🚀 گیفت سفینه ( 50 )' },
    { key: 'gift_cup',     name: '🏆 گیفت جام ( 100 )' },
    { key: 'gift_ring',    name: '💍 گیفت حلقه ( 100 )' }
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

/**
 * Maps the user's current shop state to the product key used by the discount engine.
 */
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

/**
 * Builds the inline multi-select keyboard of products for discount restriction.
 */
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

/**
 * Checks whether a discount code can be applied to a given product key.
 * Supports both the new "products" array and the legacy "restriction" string.
 */
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

/**
 * Calculates the discount for the current invoice. If the applied code is no longer
 * valid for this product, it is removed automatically and a note is returned.
 */
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

/**
 * Builds the strike-through price block shown inside invoices.
 */
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

/**
 * Re-validates the applied code right before the order is confirmed.
 * Returns true if the purchase can continue, false if the invoice was re-shown.
 */
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
            `🎫 <code>${escapeHTML(code)}</code> — ${c.percent}%\n` +
            `   📦 ${escapeHTML(describeDiscountProducts(c))}\n` +
            `   👥 مصرف: ${c.usedCount || 0}/${c.capacity || '∞'} | ${getDiscountStatusText(c)}\n` +
            `   ⏳ انقضا: ${escapeHTML(expiryText)}\n\n`;
        rows.push([{ ...B(`🗑 حذف ${code}`, BTN_DANGER), callback_data: `dc_del_${code}` }]);
    });
    return { text: t, markup: { inline_keyboard: rows } };
}

// ============================================================================
// ADVANCED REFERRAL (SUBSET) SYSTEM
// ============================================================================

function getReferralPercent() {
    return (typeof db.referralPercent === 'number' && db.referralPercent >= 0) ? db.referralPercent : REFERRAL_DEFAULT_PERCENT;
}

function getReferralLink(userId) {
    return `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
}

const REFERRAL_LEVELS = [
    { min: 0,   name: 'برنزی',     emoji: '🥉' },
    { min: 5,   name: 'نقره‌ای',   emoji: '🥈' },
    { min: 20,  name: 'طلایی',     emoji: '🥇' },
    { min: 50,  name: 'الماسی',    emoji: '💎' },
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

/**
 * Registers a new user as a sub-member of the referrer when they arrive with /start ref_ID.
 * Only brand-new users (never seen by the bot before) are registered.
 */
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
    } catch (err) {
        SystemLogger.error('Referral', 'Failed to register referral', err);
    }
}

/**
 * Pays the referral commission to the referrer once an order is completed.
 */
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
    } catch (err) {
        SystemLogger.error('Referral', 'Failed to pay commission', err);
    }
}

async function sendReferralMenu(chatId, userData) {
    const percent = getReferralPercent();
    const stats = getReferralStats(userData);
    const lvl = getReferralLevel(stats.total);

    const menuMsg =
        `🤝 <b>سیستم زیرمجموعه‌گیری نوا شاپ</b>\n\n` +
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
        `💰 <b>درآمد و آمار زیرمجموعه‌گیری</b>\n\n` +
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
}

// ============================================================================
// CHECK MEMBERSHIP FUNCTION (FORCE JOIN)
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
        return false;
    }
}

// ============================================================================
// FINANCIAL API INTEGRATIONS (WALLEX & BINANCE LIVE API)
// ============================================================================

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

async function getBinanceTONPriceInToman() {
    if (db.manualTonPrice && db.manualTonPrice > 0) {
        return db.manualTonPrice;
    }

    const usdtToman = await getWallexUsdtPriceInToman();

    return new Promise((resolve) => {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT`;
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
                    if (parsed && parsed.price) {
                        const tonUsdt = parseFloat(parsed.price);
                        if (!isNaN(tonUsdt) && tonUsdt > 0) {
                            const calculatedToman = Math.round(tonUsdt * usdtToman);
                            resolve(calculatedToman > 0 ? calculatedToman : FALLBACK_GRAM_TOMAN);
                            return;
                        }
                    }
                    resolve(FALLBACK_GRAM_TOMAN);
                } catch (e) {
                    resolve(FALLBACK_GRAM_TOMAN);
                }
            });
        }).on('error', () => {
            resolve(FALLBACK_GRAM_TOMAN);
        });
    });
}

async function fetchStarsPrice() {
    if (db.manualStarPrice && db.manualStarPrice > 0) {
        return db.manualStarPrice;
    }

    const tonToman = await getBinanceTONPriceInToman();
    const starUnitBase = (STAR_USD / 5.5) * tonToman; 
    
    if (db.manualTonPrice && db.manualTonPrice > 0) {
        return Math.round(starUnitBase);
    }
    
    return Math.round(starUnitBase * 1.10); 
}

async function fetchGramData() {
    const rawBinanceBase = await getBinanceTONPriceInToman();
    
    let finalPrice = Math.round(rawBinanceBase * 1.10);
    if (db.manualTonPrice && db.manualTonPrice > 0) {
        finalPrice = rawBinanceBase;
    }
    
    const usdtToman = await getWallexUsdtPriceInToman();
    return { gramUsd: (rawBinanceBase / usdtToman).toFixed(2), finalPrice, usdtToman: rawBinanceBase };
}

// ============================================================================
// KEYBOARD GENERATOR FACTORIES 
// ============================================================================

function getMainKeyboard(isAdmin) {
    let rows = [
        [B('🛒 خرید محصول', BTN_SUCCESS)],
        [B(REF_BTN.menu, BTN_SUCCESS)],
        [B('➕ افزایش موجودی', BTN_PRIMARY), B('💳 حساب کاربری', BTN_PRIMARY)],
        [B('📞 پشتیبانی', BTN_PRIMARY), B('📦 پیگیری سفارش', BTN_PRIMARY)],
        [B('❤️️ چطوری میتوانم به شما اعتماد کنم', BTN_DANGER)]
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
                [B('⭐️ استارز', BTN_SUCCESS)],
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
                [B('برگشت ↩️', BTN_DANGER)]
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
                [B('🏆 تغییر سطح کاربر', BTN_PRIMARY), B('💳 تایید احراز هویت کاربر', BTN_SUCCESS)],
                [B('🚫 بن کردن کاربر', BTN_DANGER), B('✅ آنبن کردن کاربر', BTN_SUCCESS)],
                [B('🏷️ ساخت کد تخفیف', BTN_PRIMARY), B('👑 تنظیم مالک دوم', BTN_PRIMARY)],
                [B(REF_BTN.adminDiscountList, BTN_PRIMARY)],
                [B(REF_BTN.adminStats, BTN_PRIMARY), B(REF_BTN.adminPercent, BTN_PRIMARY)],
                [B('💎 تنظیم قیمت دستی (تون)', BTN_PRIMARY), B('⭐ تنظیم قیمت دستی استارز', BTN_PRIMARY)],
                [B('🎁 تنظیم قیمت دستی گیفت استارزی', BTN_PRIMARY)],
                [B('🔙 بازگشت به منوی اصلی', BTN_DANGER)]
            ],
            resize_keyboard: true
        }
    };
}

// ============================================================================
// ISOLATED INVOICE GENERATION MODULES
// ============================================================================

async function showStarInvoice(chatId, userData) {
    const unitPrice = userData.starPricePerUnit || await fetchStarsPrice(); 
    let totalPrice = unitPrice * userData.starCount;

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
    let starziTomanPerUnit;
    
    if (db.manualGiftBasePrice && db.manualGiftBasePrice > 0) {
        const base15Price = db.manualGiftBasePrice;
        starziTomanPerUnit = Math.round((base15Price / 15) * userData.selectedGiftStars);
    } else {
        const tonToman = await getBinanceTONPriceInToman();
        const starziUsdPrice = userData.selectedGiftStars * STAR_USD;
        const baseGiftToman = (starziUsdPrice / 5.5) * tonToman;
        
        starziTomanPerUnit = Math.round(baseGiftToman * 1.10); 
        if (db.manualTonPrice && db.manualTonPrice > 0) {
            starziTomanPerUnit = Math.round(baseGiftToman);
        }
    }
    
    const totalPrice = Math.round(starziTomanPerUnit);
    
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

// ============================================================================
// CORE MESSAGE EVENT DISPATCHER 
// ============================================================================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const contact = msg.contact;
    const photo = msg.photo;
    
    if (msg.message_id) {
        await setReaction(chatId, msg.message_id);
    }

    // Must be evaluated BEFORE the user record is created (used for referral registration)
    const wasKnownUser = !!db.users[chatId];

    const adminData = getUserDataById(chatId);
    const isAdmin = isUserAdmin(chatId);
    const userData = getUserData(msg);

    // Register referral (only for brand-new users arriving through /start ref_ID)
    if (text && text.startsWith('/start')) {
        await handleReferralStart(msg, userData, wasKnownUser);
    }

    if (userData.isBanned) {
        await safeSendMessage(chatId, 'حساب کاربری شما توسط ادمین مسدود شده است. لطفاً با پشتیبانی در ارتباط باشید.');
        return;
    }

    if (!isAdmin) {
        const isMember = await checkMembership(msg.from.id);
        if (!isMember) {
            const joinMarkup = {
                inline_keyboard: [
                    [{ ...B('📢 عضویت در کانال اول', BTN_PRIMARY), url: 'https://t.me/nova2_shop' }],
                    [{ ...B('📢 عضویت در کانال دوم', BTN_PRIMARY), url: 'https://t.me/nova1_shopp' }],
                    [{ ...B('✅ تایید عضویت', BTN_SUCCESS), callback_data: 'check_join' }]
                ]
            };
            await safeSendMessage(chatId, '❌ <b>برای استفاده از ربات و دریافت خدمات، ابتدا باید در هر دو کانال ما عضو شوید.</b>\n\nپس از عضویت در کانال‌ها، روی دکمه «تایید عضویت» کلیک کنید.', { reply_markup: joinMarkup });
            return; 
        }
    }

    const mainKeyboard = getMainKeyboard(isAdmin);
    const backKeyboard = getBackKeyboard();
    const accountKeyboard = getAccountKeyboard();
    const adminPanelMarkup = getAdminPanelKeyboard();

    if (text === 'لغو خرید ❌' || text === '❌ لغو خرید') {
        userData.currentShopState = null;
        userData.lastInvoiceMessageId = null;
        clearAppliedDiscount(userData);
        saveDatabase();
        await safeSendMessage(chatId, 'خرید شما لغو شد.', mainKeyboard);
        return;
    }

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
            return;
        } else {
            userData.currentShopState = 'main_shop';
            saveDatabase();
            await safeSendMessage(chatId, 'وقته محصول رو انتخاب کنی !\n\n🚀 تمامی سفارشات با بالاترین سرعت انجام میشن !', getShopKeyboard());
            return;
        }
    }

    if (isAdmin && adminData.waitingForManualPrice && text) {
        const cleanText = text.replace(/,/g, '').trim();
        const newPrice = parseInt(cleanText);

        if (isNaN(newPrice) || newPrice < 0) {
            await safeSendMessage(chatId, '❌ لطفاً یک عدد معتبر به تومان وارد کنید (مثلاً 320000 یا عدد 0 برای حالت آنلاین):');
            return;
        }

        db.manualTonPrice = newPrice;
        adminData.waitingForManualPrice = false;
        saveDatabase();

        const statusMsg = newPrice === 0 
            ? '✅ قیمت دستی غیرفعال شد و سیستم مجدداً به صورت <b>آنلاین به بایننس و والکس</b> متصل گردید.' 
            : `✅ قیمت دستی به مبلغ <b>${newPrice.toLocaleString()} تومان</b> ذخیره شد و <b>بلافاصله در بخش خرید تمام کاربران</b> اعمال گردید.`;

        await safeSendMessage(chatId, `<b>[ بروزرسانی قیمت ]</b>\n\n${statusMsg}`, adminPanelMarkup);
        return;
    }

    if (isAdmin && adminData.waitingForManualStarPrice && text) {
        const cleanText = text.replace(/,/g, '').trim();
        const newPrice = parseInt(cleanText);

        if (isNaN(newPrice) || newPrice < 0) {
            await safeSendMessage(chatId, '❌ لطفاً یک عدد معتبر به تومان وارد کنید (مثلاً 600 یا عدد 0 برای حالت خودکار):');
            return;
        }

        db.manualStarPrice = newPrice;
        adminData.waitingForManualStarPrice = false;
        saveDatabase();

        const statusMsg = newPrice === 0 
            ? '✅ قیمت دستی استارز غیرفعال شد و سیستم مجدداً به صورت <b>آنلاین بر اساس فرمول تون</b> متصل گردید.' 
            : `✅ قیمت دستی هر واحد استارز به مبلغ <b>${newPrice.toLocaleString()} تومان</b> ذخیره شد و <b>بلافاصله در بخش خرید تمام کاربران</b> اعمال گردید.`;

        await safeSendMessage(chatId, `<b>[ بروزرسانی قیمت استارز ]</b>\n\n${statusMsg}`, adminPanelMarkup);
        return;
    }

    if (isAdmin && adminData.waitingForManualGiftBasePrice && text) {
        const cleanText = text.replace(/,/g, '').trim();
        const newPrice = parseInt(cleanText);

        if (isNaN(newPrice) || newPrice < 0) {
            await safeSendMessage(chatId, '❌ لطفاً یک مبلغ معتبر به تومان وارد کنید (مثلاً 150000 یا عدد 0 برای حالت محاسبه خودکار):');
            return;
        }

        db.manualGiftBasePrice = newPrice;
        adminData.waitingForManualGiftBasePrice = false;
        saveDatabase();

        const statusMsg = newPrice === 0 
            ? '✅ قیمت دستی گیفت استارزی غیرفعال شد و ربات مجدداً بر اساس قیمت اتوماتیک محاسبه می‌کند.' 
            : `✅ قیمت دستی گیفت ۱۵ استارزی به مبلغ <b>${newPrice.toLocaleString()} تومان</b> تنظیم شد.\nربات به صورت بسیار دقیق قیمت سایر گیفت‌ها را بر این اساس ضرب و محاسبه می‌کند.`;

        await safeSendMessage(chatId, `<b>[ تنظیم قیمت گیفت‌های استارزی ]</b>\n\n${statusMsg}`, adminPanelMarkup);
        return;
    }

    if (isAdmin && adminData.waitingForReferralPercent && text) {
        const newPercent = parseInt(normalizeDigits(text).replace(/[%٪]/g, ''));

        if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) {
            await safeSendMessage(chatId, '❌ لطفاً یک عدد معتبر بین 0 تا 100 وارد کنید (مثلاً 5):');
            return;
        }

        db.referralPercent = newPercent;
        adminData.waitingForReferralPercent = false;
        saveDatabase();

        await safeSendMessage(chatId, `<b>[ تنظیم کمیسیون زیرمجموعه‌گیری ]</b>\n\n✅ درصد کمیسیون به <b>${newPercent}%</b> تغییر کرد و از این لحظه روی تمام سفارش‌های جدید اعمال می‌شود.`, adminPanelMarkup);
        return;
    }

    if (isAdmin && adminData.waitingForOrderRejectReason && text) {
        const orderCode = adminData.rejectOrderCode;
        const reason = escapeHTML(text);
        adminData.waitingForOrderRejectReason = false;
        adminData.rejectOrderCode = null;
        saveDatabase();

        const order = db.orders[orderCode];
        if (order) {
            order.status = 'rejected';
            saveDatabase();
            await safeSendMessage(order.userId, `سفارش شما با کد پیگیری <code>${orderCode}</code> توسط مدیریت رد شد.\n\nدلیل: ${reason}`);
            await safeSendMessage(chatId, `دلیل رد سفارش برای کاربر ارسال شد.`);
        }
        return;
    }

    if (isAdmin && adminData.waitingForReceiptRejectReason && text) {
        const targetUserId = adminData.rejectTargetId;
        const reason = escapeHTML(text);
        adminData.waitingForReceiptRejectReason = false;
        adminData.rejectTargetId = null;
        saveDatabase();

        await safeSendMessage(targetUserId, `رسید پرداخت شما توسط مدیریت رد شد.\n\nدلیل: ${reason}`);
        await safeSendMessage(chatId, `دلیل رد رسید برای کاربر ارسال شد.`);
        return;
    }

    // ========================================================================
    // ADVANCED DISCOUNT CODE CREATION WIZARD (ADMIN)
    // Step 1: Duration -> Step 2: Percent -> Step 3: Products (inline) -> Step 4: Capacity
    // ========================================================================
    if (isAdmin) {
        if (adminData.waitingForDiscountExpiry && text) {
            let hours = null;
            const opt = DISCOUNT_DURATION_OPTIONS.find(o => o.label === text);
            if (opt) {
                hours = opt.hours;
            } else {
                const n = parseInt(normalizeDigits(text));
                if (!isNaN(n) && n >= 0 && n <= 8760) hours = n;
            }

            if (hours === null) {
                await safeSendMessage(chatId, '❌ مدت نامعتبر است. یکی از دکمه‌ها را انتخاب کنید یا مدت را به <b>ساعت</b> (عدد 0 تا 8760) ارسال کنید. (0 = بدون انقضا)', getDiscountDurationKeyboard());
                return;
            }

            adminData.tempDiscount.durationHours = hours;
            adminData.waitingForDiscountExpiry = false;
            adminData.waitingForDiscountPercent = true;
            saveDatabase();

            const durationText = hours === 0 ? 'بدون انقضا' : `${hours} ساعت`;
            await safeSendMessage(
                chatId,
                `✅ مدت اعتبار: <b>${durationText}</b>\n\n` +
                `💯 <b>مرحله ۲ از ۴ — مقدار تخفیف</b>\n` +
                `یکی از دکمه‌ها را انتخاب کنید یا عددی بین 1 تا 100 بفرستید:`,
                getDiscountPercentKeyboard()
            );
            return;
        }

        if (adminData.waitingForDiscountPercent && text) {
            const percent = parseInt(normalizeDigits(text).replace(/[%٪]/g, ''));
            if (isNaN(percent) || percent <= 0 || percent > 100) {
                await safeSendMessage(chatId, 'لطفاً یک عدد معتبر بین 1 تا 100 وارد کنید:', getDiscountPercentKeyboard());
                return;
            }
            adminData.tempDiscount.percent = percent;
            adminData.tempDiscount.products = [];
            adminData.waitingForDiscountPercent = false;
            adminData.waitingForDiscountRestriction = true;
            saveDatabase();

            await safeSendMessage(chatId, `✅ مقدار تخفیف: <b>${percent}%</b>`, backKeyboard);
            await safeSendMessage(
                chatId,
                `🎯 <b>مرحله ۳ از ۴ — محدودیت محصول</b>\n\n` +
                `محصولاتی که این کد روی آن‌ها کار می‌کند را انتخاب کنید (می‌توانید چند محصول را همزمان انتخاب کنید).\n` +
                `برای اعمال روی همه محصولات ، «🌐 همه محصولات» را بزنید.`,
                { reply_markup: buildDiscountProductsMarkup([]) }
            );
            return;
        }

        if (adminData.waitingForDiscountRestriction && text) {
            await safeSendMessage(chatId, '☝️ لطفاً محصولات را از دکمه‌های شیشه‌ای پیام بالا انتخاب کنید و در پایان «✔️ تایید انتخاب» یا «🌐 همه محصولات» را بزنید.');
            return;
        }

        if (adminData.waitingForDiscountCapacity && text) {
            const capacity = parseInt(normalizeDigits(text));
            if (isNaN(capacity) || capacity <= 0) {
                await safeSendMessage(chatId, 'لطفاً یک عدد صحیح بزرگتر از صفر وارد کنید:', getDiscountCapacityKeyboard());
                return;
            }
            const t = adminData.tempDiscount;
            adminData.waitingForDiscountCapacity = false;

            let code;
            do {
                code = 'PLUS-' + Math.floor(1000 + Math.random() * 9000);
            } while (db.discountCodes[code]);

            const expiresAt = t.durationHours > 0 ? Date.now() + t.durationHours * 3600 * 1000 : null;

            db.discountCodes[code] = {
                percent: t.percent,
                capacity: capacity,
                usedCount: 0,
                usedBy: [],
                products: Array.isArray(t.products) ? [...t.products] : [],
                restriction: null,
                expiryHour: 0,
                expiresAt: expiresAt,
                createdAt: Date.now(),
                createdBy: chatId
            };
            saveDatabase();

            const productsText = db.discountCodes[code].products.length > 0
                ? db.discountCodes[code].products.map(getProductLabel).join('\n   • ')
                : '🌐 همه محصولات';

            await safeSendMessage(chatId, 
                `<b>✅ کد تخفیف با موفقیت ساخته شد</b>\n\n` +
                `🎫 کد: <code>${code}</code>\n` +
                `💯 مقدار تخفیف: ${t.percent}%\n` +
                `⏳ انقضا: ${expiresAt ? formatTehranDate(expiresAt) : 'بدون انقضا'}\n` +
                `👥 ظرفیت: ${capacity} نفر\n` +
                `📦 محدودیت محصول:\n   ${db.discountCodes[code].products.length > 0 ? '• ' : ''}${escapeHTML(productsText)}\n\n` +
                `ℹ️ هر کاربر فقط یک‌بار می‌تواند از هر کد استفاده کند.`, 
                adminPanelMarkup
            );
            return;
        }
    }

    if (isAdmin && adminData.adminReplyingTo) {
        const targetUserToReply = adminData.adminReplyingTo;
        adminData.adminReplyingTo = null;
        if (text !== '🔙 بازگشت به منوی اصلی' && text !== '🔧 پنل مدیریت') {
            await safeSendMessage(targetUserToReply, `پاسخ پشتیبانی از طرف مدیریت:\n\n${escapeHTML(text)}`);
            await safeSendMessage(chatId, `پاسخ شما با موفقیت ارسال شد.`);
            return;
        }
    }

    if (isAdmin && adminData.adminAction && (text !== '🔧 پنل مدیریت' && text !== '/admin')) {
        if (adminData.waitingForAdminUserSearch && text) {
            const targetId = text.trim();
            adminData.waitingForAdminUserSearch = false;
            adminData.targetUserId = targetId;
            saveDatabase();
            const targetUser = getUserDataById(targetId);

            if (adminData.adminAction === '🚫 بن کردن کاربر') {
                targetUser.isBanned = true;
                saveDatabase();
                await safeSendMessage(chatId, `کاربر <code>${targetId}</code> بن شد.`);
                adminData.adminAction = null;
                adminData.targetUserId = null;
                return;
            } else if (adminData.adminAction === '✅ آنبن کردن کاربر') {
                targetUser.isBanned = false;
                saveDatabase();
                await safeSendMessage(chatId, `کاربر <code>${targetId}</code> آنبن شد.`);
                adminData.adminAction = null;
                adminData.targetUserId = null;
                return;
            } else if (adminData.adminAction === '💳 تایید احراز هویت کاربر') {
                targetUser.cardVerified = true;
                targetUser.level = 'سطح 2';
                saveDatabase();
                await safeSendMessage(chatId, `احراز هویت <code>${targetId}</code> تایید شد.`);
                adminData.adminAction = null;
                adminData.targetUserId = null;
                return;
            } else if (adminData.adminAction === '👑 تنظیم مالک دوم') {
                db.secondaryAdmin = targetId;
                saveDatabase();
                await safeSendMessage(chatId, `کاربر <code>${targetId}</code> به عنوان مالک دوم با موفقیت ثبت شد.`);
                adminData.adminAction = null;
                adminData.targetUserId = null;
                return;
            }

            adminData.waitingForAdminAmount = true;
            saveDatabase();
            if (adminData.adminAction === '➕ افزایش موجودی کاربر') await safeSendMessage(chatId, `مبلغ افزایشی (تومان):`);
            else if (adminData.adminAction === '➖ کاهش موجودی کاربر') await safeSendMessage(chatId, `مبلغ کاهشی (تومان):`);
            else if (adminData.adminAction === '🏆 تغییر سطح کاربر') await safeSendMessage(chatId, `نام سطح جدید:`);
            return;
        }

        if (adminData.waitingForAdminAmount && adminData.targetUserId && text) {
            const targetId = adminData.targetUserId;
            const targetUser = getUserDataById(targetId);
            const action = adminData.adminAction;

            if (action === '➕ افزایش موجودی کاربر') {
                const amount = parseInt(text);
                if (!isNaN(amount)) {
                    targetUser.wallet += amount;
                    saveDatabase();
                    await safeSendMessage(chatId, `${amount.toLocaleString()} تومان افزوده شد.`);
                    await safeSendMessage(targetId, `مبلغ ${amount.toLocaleString()} تومان واریز شد.`);
                }
            } else if (action === '➖ کاهش موجودی کاربر') {
                const amount = parseInt(text);
                if (!isNaN(amount)) {
                    targetUser.wallet = Math.max(0, targetUser.wallet - amount);
                    saveDatabase();
                    await safeSendMessage(chatId, `${amount.toLocaleString()} تومان کسر شد.`);
                }
            } else if (action === '🏆 تغییر سطح کاربر') {
                targetUser.level = escapeHTML(text.trim());
                saveDatabase();
                await safeSendMessage(chatId, `سطح به "${targetUser.level}" تغییر یافت.`);
            }

            adminData.adminAction = null;
            adminData.targetUserId = null;
            adminData.waitingForAdminAmount = false;
            saveDatabase();
            return;
        }
    }

    if (userData.waitingForStarCount && text && text !== 'محاسبه با موجودی من 🔄') {
        const countInput = parseInt(text);
        if (isNaN(countInput) || countInput < 50 || countInput > 100000) {
            await safeSendMessage(chatId, '❌ تعداد استارز باید عددی بین ۵۰ تا ۱۰۰,۰۰۰ باشد:', backKeyboard);
            return;
        }

        userData.starCount = countInput;
        userData.waitingForStarCount = false;
        userData.currentShopState = 'star_recipient';
        saveDatabase();

        const selfName = escapeHTML(msg.from.first_name) || 'کاربر';
        const recipientKeyboard = {
            reply_markup: {
                keyboard: [
                    [B(`برای خودم ( ${selfName} ) 🪪`, BTN_SUCCESS)],
                    [B('برگشت ↩️️', BTN_DANGER)]
                ],
                resize_keyboard: true
            }
        };
        const recipientMsg = 
            `🔗 انتخاب اکانت دریافت‌کننده\n\n` +
            `✔️ اگر برای خودتان است، روی «برای خودم» کلیک کنید.\n` +
            `✔️ اگر برای شخص دیگری است، یوزرنیم او را بدون @ بفرستید.`;
        
        await safeSendPhoto(chatId, '1000002625.jpg', { caption: recipientMsg, reply_markup: recipientKeyboard.reply_markup });
        return;
    }

    if (userData.currentShopState === 'star_recipient' && text) {
        let usernameInput = text.trim();
        if (usernameInput.includes('برای خودم')) {
            usernameInput = msg.from.username || msg.from.id.toString();
        } else {
            if (usernameInput.startsWith('@')) {
                usernameInput = usernameInput.substring(1);
            }
        }

        userData.starRecipient = usernameInput;
        userData.currentShopState = 'star_invoice';
        saveDatabase();
        await showStarInvoice(chatId, userData);
        return;
    }

    if (userData.waitingForGramAmount && text) {
        if (text === 'محاسبه با موجودی من 🔄') {
            const liveGramData = await fetchGramData();
            userData.gramPricePerUnit = liveGramData.finalPrice;
            saveDatabase();
            const balanceGram = (userData.wallet / userData.gramPricePerUnit).toFixed(2);
            await safeSendMessage(chatId, `موجودی شما: ${userData.wallet.toLocaleString()} تومان\nمعادل ${balanceGram} گرام.\nلطفاً تعداد گرام را وارد کنید:`, backKeyboard);
            return;
        }

        const gramInput = parseFloat(text);
        if (isNaN(gramInput) || gramInput < 0.1) {
            await safeSendMessage(chatId, '❌ حداقل خرید ۰.۱ گرام است.', backKeyboard);
            return;
        }
        userData.gramAmount = gramInput;
        userData.waitingForGramAmount = false;
        userData.waitingForGramWallet = true;
        saveDatabase();

        await safeSendMessage(chatId, `لطفاً آدرس ولت گرام خود را ارسال کنید:`, backKeyboard);
        return;
    }

    if (userData.waitingForGramWallet && text) {
        const walletInput = text.trim();
        const isValidTonWallet = /^(UQ|EQ)[a-zA-Z0-9\-_]{46}$/.test(walletInput) || /^0:[a-fA-F0-9]{64}$/.test(walletInput) || (walletInput.length >= 40 && (walletInput.startsWith('UQ') || walletInput.startsWith('EQ') || walletInput.startsWith('0:')));

        if (!isValidTonWallet) {
            await safeSendMessage(chatId, '❌ آدرس ولت وارد شده معتبر نیست. لطفاً فقط آدرس ولت معتبر شبکه گرام (TON) که با UQ یا EQ شروع می‌شود را ارسال کنید:', backKeyboard);
            return;
        }

        userData.gramWalletAddress = walletInput;
        userData.waitingForGramWallet = false;
        userData.waitingForGramMemoChoice = true;
        saveDatabase();

        const memoKeyboard = {
            reply_markup: {
                keyboard: [
                    [B('💬 بله، کامنت دارم', BTN_SUCCESS), B('❌ رد کردن', BTN_DANGER)],
                    [B('برگشت ↩️', BTN_DANGER)]
                ],
                resize_keyboard: true
            }
        };
        await safeSendMessage(chatId, 'آیا برای واریز گرام کامنت (ممو) دارید؟', memoKeyboard);
        return;
    }

    if (userData.waitingForGramMemoChoice && text) {
        if (text === '❌ رد کردن') {
            userData.gramMemo = 'ندارد';
            userData.waitingForGramMemoChoice = false;
            userData.currentShopState = 'gram_invoice';
            saveDatabase();
            await showGramInvoice(chatId, userData);
            return;
        } else if (text === '💬 بله، کامنت دارم') {
            userData.waitingForGramMemoChoice = false;
            userData.waitingForGramMemoInput = true;
            saveDatabase();
            await safeSendMessage(chatId, 'لطفاً متن کامنت خود را وارد کنید:', backKeyboard);
            return;
        }
    }

    if (userData.waitingForGramMemoInput && text) {
        userData.gramMemo = text.trim();
        userData.waitingForGramMemoInput = false;
        userData.currentShopState = 'gram_invoice';
        saveDatabase();
        await showGramInvoice(chatId, userData);
        return;
    }

    if (userData.waitingForTrackingInput && text) {
        userData.waitingForTrackingInput = false;
        saveDatabase();
        const trackingCode = text.trim();
        const order = db.orders[trackingCode];

        if (!order) {
            await safeSendMessage(chatId, 'سفارشی با این کد پیگیری یافت نشد.', backKeyboard);
            return;
        }

        let statusStr = 'در حال بررسی توسط مدیریت';
        if (order.status === 'completed') statusStr = 'انجام شده و تکمیل شده';
        if (order.status === 'rejected') statusStr = 'رد شده توسط مدیریت';

        const trackResultMsg = `<b>[ نتیجه پیگیری سفارش ]</b>\n\nکد: <code>${escapeHTML(trackingCode)}</code>\nمحصول: ${escapeHTML(order.giftName)}\nمبلغ: ${order.amount.toLocaleString()} تومان\nوضعیت: ${statusStr}`;
        await safeSendMessage(chatId, trackResultMsg, backKeyboard);
        return;
    }

    if (userData.waitingForComment && text) {
        userData.waitingForComment = false;
        userData.commentText = text.trim();
        saveDatabase();
        await showGiftInvoice(chatId, userData);
        return;
    }

    if (userData.waitingForDiscountInput && text) {
        userData.waitingForDiscountInput = false;
        saveDatabase();

        const productKey = getCurrentProductKey(userData);
        if (!productKey) {
            await safeSendMessage(chatId, 'ℹ️ کد تخفیف فقط هنگام ثبت فاکتور خرید محصول قابل استفاده است.', backKeyboard);
            return;
        }

        const codeKey = findDiscountCodeKey(text);
        const chk = codeKey
            ? validateDiscountCode(codeKey, chatId, productKey)
            : { ok: false, reason: 'کد تخفیف وارد شده نامعتبر است.' };

        if (!chk.ok) {
            await safeSendMessage(chatId, `❌ ${escapeHTML(chk.reason)}`);
            await reshowInvoiceByState(chatId, userData);
            return;
        }

        userData.appliedDiscountCode = chk.key;
        userData.appliedDiscountPercent = chk.percent;
        saveDatabase();

        await safeSendMessage(chatId, `✅ کد تخفیف ${chk.percent}% با موفقیت اعمال شد!`);
        await reshowInvoiceByState(chatId, userData);
        return;
    }

    if (text === 'محاسبه با موجودی من 🔄' && userData.currentShopState === 'star_menu') {
        const maxStars = Math.floor(userData.wallet / (userData.starPricePerUnit || await fetchStarsPrice()));
        await safeSendMessage(chatId, `موجودی شما: ${userData.wallet.toLocaleString()} تومان\nحداکثر ${maxStars} استارز می‌توانید بخرید.`, backKeyboard);
        return;
    }

    if (text === 'اعمال تخفیف 🎁' && userData.currentShopState === 'star_invoice') {
        const availableDiscountWallet = userData.discountWallet || 1766;
        if (availableDiscountWallet <= 0) {
            await safeSendMessage(chatId, 'موجودی کیف پول تخفیف کافی نیست.', backKeyboard);
        } else {
            await safeSendMessage(chatId, `تخفیف به مبلغ ${availableDiscountWallet.toLocaleString()} تومان اعمال شد.`);
        }
        return;
    }

    if (text === 'اعمال کد تخفیف 🎫' && userData.currentShopState === 'star_invoice') {
        userData.waitingForDiscountInput = true;
        saveDatabase();
        await safeSendMessage(chatId, 'لطفاً کد تخفیف خود را ارسال کنید:', backKeyboard);
        return;
    }

    // ------------------------------------------------------------------------
    // REMOVE APPLIED DISCOUNT CODE FROM INVOICE
    // ------------------------------------------------------------------------
    if (textIs(text, REF_BTN.removeDiscount)) {
        if (userData.appliedDiscountCode && getCurrentProductKey(userData)) {
            clearAppliedDiscount(userData);
            saveDatabase();
            await safeSendMessage(chatId, '🗑 کد تخفیف از فاکتور حذف شد و قیمت اصلی محاسبه گردید.');
            await reshowInvoiceByState(chatId, userData);
        } else {
            await safeSendMessage(chatId, 'ℹ️ هیچ کد تخفیفی روی فاکتور شما اعمال نشده است.');
        }
        return;
    }

    if (text === 'تأیید ✅' && userData.currentShopState === 'star_invoice') {
        if (!(await revalidateAppliedDiscount(chatId, userData, 'stars', showStarInvoice))) return;

        if (userData.wallet < userData.lastAmount) {
            const shortage = userData.lastAmount - userData.wallet;
            const shortageKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ ...B(`➕ افزایش موجودی (${shortage.toLocaleString()} تومان)`, BTN_SUCCESS), callback_data: `add_balance_${shortage}` }]
                    ]
                }
            };
            await safeSendMessage(chatId, `❌ موجودی حساب شما کافی نیست!\n\n💳 مبلغ کسری: ${shortage.toLocaleString()} تومان\nبرای ثبت نهایی سفارش لطفا حساب خود را شارژ کنید.`, shortageKeyboard);
            return;
        }

        userData.wallet -= userData.lastAmount;
        const trackingCode = 'STR-' + Math.floor(10000 + Math.random() * 90000);
        const now = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
        const usedDiscountCode = userData.appliedDiscountCode || null;

        db.orders[trackingCode] = {
            userId: chatId,
            firstName: userData.firstName,
            giftName: `استارز تلگرام (${userData.starCount} عدد)`,
            count: userData.starCount,
            recipient: userData.starRecipient,
            comment: 'ندارد',
            amount: userData.lastAmount,
            originalAmount: userData.lastOriginalAmount || userData.lastAmount,
            discountCode: usedDiscountCode,
            discountAmount: usedDiscountCode ? (userData.lastDiscountAmount || 0) : 0,
            time: now,
            status: 'pending'
        };
        userData.lastInvoiceMessageId = null;
        saveDatabase();
        const orderDiscountAmount = db.orders[trackingCode].discountAmount;
        consumeDiscountUsage(userData, chatId);

        const userConfirmMsg = `سفارش ثبت شد و مبلغ از حساب شما کسر گردید.\n\nکد پیگیری: <code>${trackingCode}</code>\nمقدار: ${userData.starCount} استارز\nمبلغ: ${db.orders[trackingCode].amount.toLocaleString()} تومان`;
        await safeSendMessage(chatId, userConfirmMsg, mainKeyboard);

        const adminOrderMsg = 
            `<b>[ سفارش جدید استارز ]</b>\n\n` +
            `👤 نام کاربر: ${escapeHTML(userData.firstName)}\n` +
            `🆔 آیدی عددی: <code>${chatId}</code>\n` +
            `🏷️ کد پیگیری: <code>${trackingCode}</code>\n` +
            `💫 تعداد استارز: ${userData.starCount}\n` +
            `📥 دریافت‌کننده: @${escapeHTML(userData.starRecipient)}\n` +
            (usedDiscountCode ? `🎫 کد تخفیف: <code>${escapeHTML(usedDiscountCode)}</code> ( ${orderDiscountAmount.toLocaleString()} تومان )\n` : '') +
            `💰 مبلغ کل: ${db.orders[trackingCode].amount.toLocaleString()} تومان\n` +
            `⏰ زمان ثبت: ${now}`;

        const adminOrderMarkup = {
            reply_markup: {
                inline_keyboard: [
                    [{ ...B('✅ انجام شد', BTN_SUCCESS), callback_data: `order_done_${trackingCode}` }, { ...B('❌ رد شد', BTN_DANGER), callback_data: `order_reject_${trackingCode}` }]
                ]
            }
        };

        await notifyAdmins(adminOrderMsg, adminOrderMarkup);
        userData.currentShopState = null;
        saveDatabase();
        return;
    }

    if (text === '✅ تایید' && userData.currentShopState === 'gift_invoice') {
        if (!(await revalidateAppliedDiscount(chatId, userData, getGiftKeyFromName(userData.selectedGiftName), showGiftInvoice))) return;

        if (userData.wallet < userData.lastAmount) {
            const shortage = userData.lastAmount - userData.wallet;
            const shortageKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ ...B(`➕ افزایش موجودی (${shortage.toLocaleString()} تومان)`, BTN_SUCCESS), callback_data: `add_balance_${shortage}` }]
                    ]
                }
            };
            await safeSendMessage(chatId, `❌ موجودی حساب شما کافی نیست!\n\n💳 مبلغ کسری: ${shortage.toLocaleString()} تومان\nبرای ثبت نهایی سفارش لطفا حساب خود را شارژ کنید.`, shortageKeyboard);
            return;
        }

        userData.wallet -= userData.lastAmount;
        const trackingCode = 'STZ-' + Math.floor(10000 + Math.random() * 90000);
        const now = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
        const usedDiscountCode = userData.appliedDiscountCode || null;

        db.orders[trackingCode] = {
            userId: chatId,
            firstName: userData.firstName,
            giftName: userData.selectedGiftName,
            count: 1,
            recipient: userData.recipientUsername,
            comment: userData.commentText,
            amount: userData.lastAmount,
            originalAmount: userData.lastOriginalAmount || userData.lastAmount,
            discountCode: usedDiscountCode,
            discountAmount: usedDiscountCode ? (userData.lastDiscountAmount || 0) : 0,
            time: now,
            status: 'pending'
        };
        userData.lastInvoiceMessageId = null;
        saveDatabase();
        const orderDiscountAmount = db.orders[trackingCode].discountAmount;
        consumeDiscountUsage(userData, chatId);

        const userConfirmMsg = `سفارش گیفت ثبت شد و مبلغ کسر گردید.\n\nکد پیگیری: <code>${trackingCode}</code>\nمبلغ: ${db.orders[trackingCode].amount.toLocaleString()} تومان`;
        await safeSendMessage(chatId, userConfirmMsg, mainKeyboard);

        const adminOrderMsg = 
            `<b>[ سفارش جدید گیفت استارزی ]</b>\n\n` +
            `👤 نام کاربر: ${escapeHTML(userData.firstName)}\n` +
            `🆔 آیدی عددی: <code>${chatId}</code>\n` +
            `🏷️ کد پیگیری: <code>${trackingCode}</code>\n` +
            `🎁 نام گیفت: ${escapeHTML(userData.selectedGiftName)} (${userData.selectedGiftStars} استارز)\n` +
            `📥 دریافت‌کننده: @${escapeHTML(userData.recipientUsername)}\n` +
            `💬 کامنت: ${escapeHTML(userData.commentText)}\n` +
            (usedDiscountCode ? `🎫 کد تخفیف: <code>${escapeHTML(usedDiscountCode)}</code> ( ${orderDiscountAmount.toLocaleString()} تومان )\n` : '') +
            `💰 مبلغ کل: ${db.orders[trackingCode].amount.toLocaleString()} تومان\n` +
            `⏰ زمان ثبت: ${now}`;

        const adminOrderMarkup = {
            reply_markup: {
                inline_keyboard: [
                    [{ ...B('✅ انجام شد', BTN_SUCCESS), callback_data: `order_done_${trackingCode}` }, { ...B('❌ رد شد', BTN_DANGER), callback_data: `order_reject_${trackingCode}` }]
                ]
            }
        };

        await notifyAdmins(adminOrderMsg, adminOrderMarkup);
        userData.currentShopState = null;
        saveDatabase();
        return;
    }

    if (text === '✅ تایید گرام' && userData.currentShopState === 'gram_invoice') {
        const finalCheckGramData = await fetchGramData();
        userData.gramPricePerUnit = finalCheckGramData.finalPrice;

        if (!(await revalidateAppliedDiscount(chatId, userData, 'gram', showGramInvoice))) return;

        const gramRawTotal = Math.round(userData.gramAmount * userData.gramPricePerUnit);
        const gramDiscountInfo = calculateDiscount(userData, 'gram', gramRawTotal, chatId);
        userData.lastOriginalAmount = gramRawTotal;
        userData.lastDiscountAmount = gramDiscountInfo.discountVal;
        userData.lastAmount = gramDiscountInfo.finalAmount;
        saveDatabase();

        if (userData.wallet < userData.lastAmount) {
            const shortage = userData.lastAmount - userData.wallet;
            const shortageKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ ...B(`➕ افزایش موجودی (${shortage.toLocaleString()} تومان)`, BTN_SUCCESS), callback_data: `add_balance_${shortage}` }]
                    ]
                }
            };
            await safeSendMessage(chatId, `❌ موجودی حساب شما کافی نیست!\n\n💳 مبلغ کسری: ${shortage.toLocaleString()} تومان\nبرای ثبت نهایی سفارش لطفا حساب خود را شارژ کنید.`, shortageKeyboard);
            return;
        }

        userData.wallet -= userData.lastAmount;
        const trackingCode = 'GRAM-' + Math.floor(10000 + Math.random() * 90000);
        const now = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
        const usedDiscountCode = userData.appliedDiscountCode || null;

        db.orders[trackingCode] = {
            userId: chatId,
            firstName: userData.firstName,
            giftName: `ارز گرام (${userData.gramAmount} GRAM)`,
            count: userData.gramAmount,
            recipient: userData.gramWalletAddress,
            comment: userData.gramMemo,
            amount: userData.lastAmount,
            originalAmount: userData.lastOriginalAmount || userData.lastAmount,
            discountCode: usedDiscountCode,
            discountAmount: usedDiscountCode ? (userData.lastDiscountAmount || 0) : 0,
            time: now,
            status: 'pending'
        };
        userData.lastInvoiceMessageId = null;
        saveDatabase();
        const orderDiscountAmount = db.orders[trackingCode].discountAmount;
        consumeDiscountUsage(userData, chatId);

        const userConfirmMsg = `سفارش گرام ثبت شد و مبلغ کسر گردید.\n\nکد پیگیری: <code>${trackingCode}</code>`;
        await safeSendMessage(chatId, userConfirmMsg, mainKeyboard);

        const adminOrderMsg = 
            `<b>[ سفارش جدید ارز گرام ]</b>\n\n` +
            `👤 نام کاربر: ${escapeHTML(userData.firstName)}\n` +
            `🆔 آیدی عددی: <code>${chatId}</code>\n` +
            `🏷️ کد پیگیری: <code>${trackingCode}</code>\n` +
            `💠 مقدار گرام: ${userData.gramAmount}\n` +
            `📫 آدرس ولت: <code>${escapeHTML(userData.gramWalletAddress)}</code>\n` +
            `💬 ممو / کامنت: ${escapeHTML(userData.gramMemo)}\n` +
            (usedDiscountCode ? `🎫 کد تخفیف: <code>${escapeHTML(usedDiscountCode)}</code> ( ${orderDiscountAmount.toLocaleString()} تومان )\n` : '') +
            `💰 مبلغ کل: ${db.orders[trackingCode].amount.toLocaleString()} تومان\n` +
            `⏰ زمان ثبت: ${now}`;

        const adminOrderMarkup = {
            reply_markup: {
                inline_keyboard: [
                    [{ ...B('✅ انجام شد', BTN_SUCCESS), callback_data: `order_done_${trackingCode}` }, { ...B('❌ رد شد', BTN_DANGER), callback_data: `order_reject_${trackingCode}` }]
                ]
            }
        };

        await notifyAdmins(adminOrderMsg, adminOrderMarkup);
        userData.currentShopState = null;
        saveDatabase();
        return;
    }

    if (photo && userData.waitingForReceipt) {
        const photoId = photo[photo.length - 1].file_id;
        userData.waitingForReceipt = false;
        saveDatabase();
        
        const amount = userData.lastAmount;
        const adminCaption = `<b>[ رسید پرداخت جدید ]</b>\n\nکاربر: ${escapeHTML(userData.firstName)}\nآیدی: <code>${chatId}</code>\nمبلغ: ${amount.toLocaleString()} تومان`;
        const adminMarkup = {
            inline_keyboard: [
                [{ ...B('✅ تایید', BTN_SUCCESS), callback_data: `approve_receipt_${chatId}_${amount}` }, { ...B('❌ رد', BTN_DANGER), callback_data: `reject_receipt_${chatId}` }]
            ]
        };

        await notifyAdminsPhoto(photoId, { caption: adminCaption, parse_mode: 'HTML', reply_markup: adminMarkup });

        const userMarkup = {
            inline_keyboard: [[{ ...B('💬 پیگیری رسید', BTN_PRIMARY), callback_data: 'track_receipt_main' }]]
        };
        
        await safeSendMessage(chatId, `✅ رسید شما دریافت شد و در صف بررسی است.`, { reply_markup: userMarkup });
        return;
    }

    if (contact) {
        let phoneNum = contact.phone_number;
        if (!phoneNum.startsWith('+')) phoneNum = '+' + phoneNum;
        if (phoneNum.startsWith('+98')) {
            userData.phone = phoneNum;
            userData.verified = 'انجام شده';
            saveDatabase();
            await safeSendMessage(chatId, `شماره موبایل شما تایید شد!`, mainKeyboard);
        }
        return;
    }

    if (userData.waitingForTicket && text) {
        userData.waitingForTicket = false;
        saveDatabase();
        await safeSendMessage(chatId, 'تیکت شما ارسال شد.', backKeyboard);
        
        const adminTicketMsg = `تیکت جدید:\nنام: ${escapeHTML(userData.firstName)}\nمتن:\n${escapeHTML(text)}`;
        const replyMarkup = { 
            reply_markup: { 
                inline_keyboard: [[{ ...B('💬 پاسخ به کاربر', BTN_PRIMARY), callback_data: `reply_${chatId}` }]] 
            } 
        };
        await notifyAdmins(adminTicketMsg, replyMarkup);
        return;
    }

    // ========================================================================
    // REFERRAL SYSTEM (USER SIDE)
    // ========================================================================
    if (textIs(text, REF_BTN.menu)) {
        userData.currentShopState = null;
        saveDatabase();
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
    if (textIs(text, REF_BTN.transfer)) {
        await handleReferralTransfer(chatId, userData);
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

    // ========================================================================
    // REFERRAL & DISCOUNT MANAGEMENT (ADMIN SIDE)
    // ========================================================================
    if (isAdmin && textIs(text, REF_BTN.adminStats)) {
        const refUsers = getReferralBoard();
        let totalReferred = 0;
        let totalPaid = 0;
        let totalSales = 0;
        let totalPending = 0;
        refUsers.forEach(([id, u]) => {
            totalReferred += u.referrals.length;
            totalPaid += (u.referralTotalEarned || 0);
            totalSales += (u.referralTotalSales || 0);
            totalPending += (u.referralBalance || 0);
        });

        let t =
            `<b>🤝 آمار کلی زیرمجموعه‌گیری</b>\n\n` +
            `💎 درصد کمیسیون فعلی: <b>${getReferralPercent()}%</b>\n` +
            `👥 تعداد دعوت‌کننده‌های فعال: ${refUsers.length}\n` +
            `👤 مجموع زیرمجموعه‌ها: ${totalReferred}\n` +
            `📊 مجموع فروش زیرمجموعه‌ها: ${totalSales.toLocaleString()} تومان\n` +
            `💰 مجموع کمیسیون پرداخت‌شده: ${totalPaid.toLocaleString
