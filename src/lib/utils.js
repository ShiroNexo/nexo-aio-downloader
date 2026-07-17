const CREATOR = '@ShiroNexo';

function successResponse(data) {
    return { creator: CREATOR, status: true, data };
}

function errorResponse(message) {
    return { creator: CREATOR, status: false, message: message || 'An unknown error occurred.' };
}

function safeDecodeUrl(url) {
    return JSON.parse(`"${url.replace(/\\\//g, '/')}"`);
}

function formatFileSize(bytes) {
    if (!bytes) return 'unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function sanitizeTitle(title) {
    return title.replace(/[\/\\:*?"<>|]/g, '_').trim();
}

function parseFilenameFromHeader(header) {
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(header);
    return match?.[1]?.replace(/['"]/g, '') || 'unknown';
}

module.exports = {
    CREATOR,
    successResponse,
    errorResponse,
    safeDecodeUrl,
    formatFileSize,
    sanitizeTitle,
    parseFilenameFromHeader,
};
