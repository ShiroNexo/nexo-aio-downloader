const axios = require("axios");
const CryptoJS = require("crypto-js");

const _errorResponse = (message) => {
    return {
        creator: '@ShiroNexo',
        status: false,
        message: message || 'An unknown error occurred.'
    };
};

const _successResponse = (data) => {
    return {
        creator: '@ShiroNexo',
        status: true,
        data: data
    };
};

const base64ToAb = (base64) => {
    if (typeof base64 !== "string") {
        return { error: "Invalid input: base64 string expected." };
    }
    try {
        const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
        const buffer = Buffer.from(standardBase64, 'base64');
        return { data: new Uint8Array(buffer) };
    } catch (error) {
        return { error: `Base64 decoding failed: ${error.message}` };
    }
};

const getKey = (key) => {
    const abResult = base64ToAb(key);
    if (abResult.error) {
        return { error: `Failed to decode key: ${abResult.error}` };
    }
    if (abResult.data.length !== 32) {
        return { error: `Invalid key length: Expected 32 bytes, got ${abResult.data.length}` };
    }
    const k = new Uint32Array(abResult.data.buffer);
    const decryptedKeyBytes = new Uint32Array([
        k[0] ^ k[4], k[1] ^ k[5], k[2] ^ k[6], k[3] ^ k[7]
    ]);
    return { data: new Uint8Array(decryptedKeyBytes.buffer) };
};

const decryptAttr = (enc, fileKey) => {
    if (!enc || !fileKey) {
        return { error: "Missing encrypted attributes or file key for decryption." };
    }

    const keyResult = getKey(fileKey);
    if (keyResult.error) {
        return { error: `Key derivation failed: ${keyResult.error}` };
    }

    const encResult = base64ToAb(enc);
    if (encResult.error) {
        return { error: `Failed to decode encrypted attributes: ${encResult.error}` };
    }

    try {
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: CryptoJS.lib.WordArray.create(encResult.data) },
            CryptoJS.lib.WordArray.create(keyResult.data),
            {
                iv: CryptoJS.lib.WordArray.create(new Uint8Array(16)),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.NoPadding
            }
        );

        let resultString = CryptoJS.enc.Utf8.stringify(decrypted)
            .replace(/[\u0000-\u001F\u007F-\x9F]/g, "")
            .trim();

        if (!resultString.startsWith("MEGA")) {
            console.warn("Decrypted attributes string doesn't start with MEGA:", resultString.substring(0, 100));
            return { error: "Decryption failed or attributes format is unexpected (No 'MEGA' prefix)." };
        }

        const jsonData = JSON.parse(resultString.substring(4));
        return { data: jsonData };

    } catch (err) {
        console.error("Error during attribute decryption or parsing:", err);
        return { error: `Attribute decryption/parsing failed: ${err.message}` };
    }
};


const megaDownloader = async (inputUrl, timeout = 15000) => {
    const base = "https://g.api.mega.co.nz/cs";
    const headers = {
        "user-agent": "Postify/1.0.0",
        origin: "https://mega.nz",
        referer: "https://mega.nz/"
    };

    const _performDownload = async (url, retryCount = 0) => {
        let fileId, fileKey;

        try {
            if (!url || typeof url !== 'string') {
                return _errorResponse("Invalid input: URL string expected.");
            }
            const decodedUrl = decodeURIComponent(url);

            const fileIdMatch = decodedUrl.match(/file\/([a-zA-Z0-9_-]+)(?:#|\?|$)/);
            fileId = fileIdMatch ? fileIdMatch[1] : null;

            const keyMatch = decodedUrl.split('#');
            fileKey = keyMatch.length > 1 ? keyMatch[1] : null;

            if (!fileId) {
                return _errorResponse("Invalid Mega URL: Could not extract file ID.");
            }
            if (!fileKey) {
                return _errorResponse("Invalid Mega URL: Missing decryption key (part after #).");
            }

        } catch (parseError) {
            console.error("URL Parsing Error:", parseError);
            return _errorResponse(`Failed to parse Mega URL: ${parseError.message}`);
        }

        try {
            const apiPayload = [{ a: "g", g: 1, p: fileId }];
            const { data } = await axios.post(base, apiPayload, {
                headers: headers,
                timeout: timeout
            });

            if (!data || !Array.isArray(data) || data.length === 0) {
                if (typeof data?.[0] === 'number') {
                    const errorCode = data[0];
                    let errorMsg = `Mega API Error Code: ${errorCode}`;
                    if (errorCode === -9) errorMsg = "File not found or access denied (Error -9).";
                    if (errorCode === -2) errorMsg = "Invalid request arguments (Error -2).";
                    return _errorResponse(errorMsg);
                }
                return _errorResponse("Invalid or empty response from Mega API.");
            }

            const fileInfo = data[0];
            if (typeof fileInfo?.s !== 'number' || typeof fileInfo?.g !== 'string') {
                console.warn("Unexpected API response structure:", fileInfo);
                return _errorResponse("Mega API response missing expected file size or download link.");
            }

            let fileName = "[Encrypted Filename]";
            if (fileInfo.at) {
                const attrsResult = decryptAttr(fileInfo.at, fileKey);
                if (attrsResult.error) {
                    console.warn(`Attribute decryption failed: ${attrsResult.error}`);
                    fileName = "[Decryption Error]";
                } else if (attrsResult.data && attrsResult.data.n) {
                    fileName = attrsResult.data.n;
                }
            } else {
                console.warn("No encrypted attributes ('at' field) found in API response for this file.");
            }


            return _successResponse({
                fileName: fileName,
                fileSize: fileInfo.s,
                downloadLink: fileInfo.g,
            });

        } catch (err) {
            console.error(`Mega Download Attempt ${retryCount + 1} failed:`, err.message);

            if (retryCount < 2) {
                console.log(`Retrying download... (${retryCount + 1}/2)`);
                await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
                return _performDownload(url, retryCount + 1);
            }

            let errorMessage = err.message;
            if (axios.isAxiosError(err)) {
                errorMessage = `API Request failed: ${err.response?.statusText || err.message}`;
                if (err.response?.status === 404) errorMessage = "Mega API endpoint not found (404).";
                if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
                    errorMessage = `Request timed out after ${timeout / 1000} seconds.`;
                }
                if (typeof err.response?.data?.[0] === 'number') {
                    const errorCode = err.response.data[0];
                    if (errorCode === -9) errorMessage = "File not found or access denied (Error -9).";
                }
            }
            return _errorResponse(`Download failed after multiple attempts: ${errorMessage}`);
        }
    };

    return _performDownload(inputUrl);
};

module.exports = megaDownloader;