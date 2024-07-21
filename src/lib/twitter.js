const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

// Path ke file dalam paket
const tokenPath = path.join(__dirname, '..', 'database', 'twitter_token.json');

const { features, variables } = {
    "features": {
        "responsive_web_graphql_exclude_directive_enabled": true,
        "verified_phone_label_enabled": false,
        "responsive_web_graphql_timeline_navigation_enabled": true,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
        "tweetypie_unmention_optimization_enabled": true,
        "vibe_api_enabled": false,
        "responsive_web_edit_tweet_api_enabled": false,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": false,
        "view_counts_everywhere_api_enabled": true,
        "longform_notetweets_consumption_enabled": true,
        "tweet_awards_web_tipping_enabled": false,
        "freedom_of_speech_not_reach_fetch_enabled": false,
        "standardized_nudges_misinfo": false,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": false,
        "interactive_text_enabled": false,
        "responsive_web_twitter_blue_verified_badge_is_enabled": true,
        "responsive_web_text_conversations_enabled": false,
        "longform_notetweets_richtext_consumption_enabled": false,
        "responsive_web_enhance_cards_enabled": false,
        "longform_notetweets_rich_text_read_enabled": true,
        "responsive_web_media_download_video_enabled": true,
        "responsive_web_twitter_article_tweet_consumption_enabled": true,
        "longform_notetweets_inline_media_enabled": true,
        "creator_subscriptions_tweet_preview_api_enabled": true
    },
    "variables": {
        "with_rux_injections": false,
        "includePromotedContent": true,
        "withCommunity": true,
        "withQuickPromoteEligibilityTweetFields": true,
        "withBirdwatchNotes": true,
        "withDownvotePerspective": false,
        "withReactionsMetadata": false,
        "withReactionsPerspective": false,
        "withVoice": true,
        "withV2Timeline": true
    }
}

let token = {
    bearer: null,
    guest: null
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0';

const DEFAULT_HEADERS = {
    'User-Agent': USER_AGENT,
    'Accept': '*/*',
    'Accept-Language': 'en-US, en, *;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'TE': 'trailers',
};

async function getTokens(tweetUrl) {
    const { data: redirectPageData } = await axios.get(tweetUrl, { headers: DEFAULT_HEADERS });
    const redirectUrl = extractRedirectUrl(redirectPageData, tweetUrl);
    const tok = extractTok(redirectUrl);
    const data = await extractData(redirectUrl);
    const mainJsUrl = await authenticateAndGetMainJs(tok, data);
    const bearerToken = await extractBearerToken(mainJsUrl, tweetUrl);
    const guestToken = await getGuestToken(bearerToken, tweetUrl);
    return { bearer: bearerToken, guest: guestToken };
}

function extractRedirectUrl(pageData, tweetUrl) {
    const match = pageData.match(/content="0; url = (https:\/\/twitter\.com\/[^"]+)"/);
    if (!match) throw new Error(`Failed to find redirect URL. Tweet URL: ${tweetUrl}`);
    return match[1];
}

function extractTok(redirectUrl) {
    const match = redirectUrl.match(/tok=([^&"]+)/);
    if (!match) throw new Error(`Failed to find 'tok' parameter in redirect URL: ${redirectUrl}`);
    return match[1];
}

async function extractData(redirectUrl) {
    const { data: authPageData } = await axios.get(redirectUrl, { headers: DEFAULT_HEADERS, maxRedirects: 0 });
    const match = authPageData.match(/<input type="hidden" name="data" value="([^"]+)"/);
    if (!match) throw new Error(`Failed to find 'data' parameter in redirect page. Redirect URL: ${redirectUrl}`);
    return match[1];
}

async function authenticateAndGetMainJs(tok, data) {
    const authUrl = 'https://x.com/x/migrate';
    const authParams = `tok=${tok}&data=${data}`;
    const { data: mainJsPageData } = await axios.post(authUrl, authParams, {
        headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        maxRedirects: 10,
    });
    const match = mainJsPageData.match(/https:\/\/abs.twimg.com\/responsive-web\/client-web-legacy\/main\.[^\.]+\.js/);
    if (!match) throw new Error(`Failed to find main.js file. This might indicate a script bug. Please open a GitHub issue.`);
    return match[0];
}

async function extractBearerToken(mainJsUrl, tweetUrl) {
    const { data: mainJsData } = await axios.get(mainJsUrl);
    const match = mainJsData.match(/AAAAAAAAA[^"]+/);
    if (!match) throw new Error(`Failed to find bearer token. This might indicate a script bug. Please open a GitHub issue.`);
    return match[0];
}

async function getGuestToken(bearerToken, tweetUrl) {
    const { data: guestTokenData } = await axios.post('https://api.twitter.com/1.1/guest/activate.json', null, {
        headers: { ...DEFAULT_HEADERS, 'authorization': `Bearer ${bearerToken}` },
    });
    if (!guestTokenData.guest_token) throw new Error(`Failed to find guest token. This might indicate a script bug. Please open a GitHub issue.`);
    return guestTokenData.guest_token;
}

function extractTweetId(tweetUrl) {
    const match = tweetUrl.match(/(?<=status\/)\d+/);
    if (!match) throw new Error(`Could not parse tweet id from URL. Make sure you are using the correct URL.`);
    return match[0];
}

function updateFeaturesAndVariables(errorData) {
    const neededVariablesPattern = /Variable '([^']+)'/;
    const neededFeaturesPattern = /The following features cannot be null: ([^"]+)/;

    errorData.errors.forEach(error => {
        const neededVars = error.message.match(neededVariablesPattern);
        if (neededVars) neededVars.forEach(v => variables[v] = true);

        const neededFeatures = error.message.match(neededFeaturesPattern);
        if (neededFeatures) {
            neededFeatures[1].split(',').forEach(feature => {
                features[feature.trim()] = true;
            });
        }
    });
}

function getDetailsUrl(tweetId, features, variables) {
    const variablesCopy = { ...variables, focalTweetId: tweetId };
    const variablesEncoded = querystring.escape(JSON.stringify(variablesCopy));
    const featuresEncoded = querystring.escape(JSON.stringify(features));
    return `https://twitter.com/i/api/graphql/wTXkouwCKcMNQtY-NcDgAA/TweetDetail?variables=${variablesEncoded}&features=${featuresEncoded}`;
}

function extractMp4s(data) {
    const { core, legacy, views } = data;
    const author = core.user_results.result.legacy.screen_name;
    let description = legacy.full_text.replace(/https:\/\/t\.co\/[a-zA-Z0-9_-]+\s*$/, '').trim();

    const listUrl = legacy.entities.media.map(media => {
        if (media.type === 'video' || media.type === 'animated_gif') {
            return { type: media.type === 'video' ? 'video' : 'gif', url: media.video_info.variants[media.video_info.variants.length - 1].url };
        } else if (media.type === 'photo') {
            return { type: 'image', url: `${media.media_url_https}?format=png&name=large` };
        }
    });

    return {
        creator: '@ShiroNexo',
        status: true,
        data: {
            author,
            like: legacy.favorite_count,
            view: views.count,
            retweet: legacy.retweet_count,
            description,
            sensitiveContent: legacy.possibly_sensitive,
            result: listUrl,
        }
    };
}

async function twitterDownloader(tweetUrl) {
    try {
        if (!token.bearer || !token.guest) {
            try {
                token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
            } catch (error) {
                token = await getTokens(tweetUrl);
                fs.writeFileSync(tokenPath, JSON.stringify(token), 'utf8');
            }
        }
        if (!token.bearer || !token.guest) throw new Error(`Failed to get bearer token. This might indicate a script bug. Please open a GitHub issue.`);
        const { guest, bearer } = token
        const tweetId = extractTweetId(tweetUrl);
        let url = getDetailsUrl(tweetId, features, variables);
        let details;

        for (let retries = 0; retries < 10; retries++) {
            try {
                details = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${bearer}`,
                        'x-guest-token': guest,
                    },
                });
                if (details.status === 200) break;
            } catch (error) {
                if (error.response?.status === 400) {
                    updateFeaturesAndVariables(error.response.data);
                    url = getDetailsUrl(tweetId, features, variables);
                } else {
                    throw error;
                }
            }
        }

        if (details?.status !== 200) throw new Error(`Failed to get tweet details. Status code: ${details?.status}. Tweet URL: ${tweetUrl}`);
        return extractMp4s(details.data.data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result);
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Token expired, renewing one...');
            token = await getTokens(tweetUrl);
            fs.writeFileSync(tokenPath, JSON.stringify(token), 'utf8');
            return twitterDownloader(tweetUrl);
        }
        console.error(error);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message
        }
    }
}

module.exports = twitterDownloader