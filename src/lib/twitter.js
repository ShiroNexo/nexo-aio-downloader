const axios = require('axios');
const querystring = require('querystring');

const defaultFeatures = {
    "creator_subscriptions_tweet_preview_api_enabled": true,
    "premium_content_api_read_enabled": false,
    "communities_web_enable_tweet_community_results_fetch": true,
    "c9s_tweet_anatomy_moderator_badge_enabled": true,
    "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
    "responsive_web_grok_analyze_post_followups_enabled": false,
    "responsive_web_jetfuel_frame": false,
    "responsive_web_grok_share_attachment_enabled": true,
    "articles_preview_enabled": true,
    "responsive_web_edit_tweet_api_enabled": true,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
    "view_counts_everywhere_api_enabled": true,
    "longform_notetweets_consumption_enabled": true,
    "responsive_web_twitter_article_tweet_consumption_enabled": true,
    "tweet_awards_web_tipping_enabled": false,
    "responsive_web_grok_show_grok_translated_post": false,
    "responsive_web_grok_analysis_button_from_backend": false,
    "creator_subscriptions_quote_tweet_preview_enabled": false,
    "freedom_of_speech_not_reach_fetch_enabled": true,
    "standardized_nudges_misinfo": true,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
    "longform_notetweets_rich_text_read_enabled": true,
    "longform_notetweets_inline_media_enabled": true,
    "profile_label_improvements_pcf_label_in_post_enabled": true,
    "rweb_tipjar_consumption_enabled": true,
    "responsive_web_graphql_exclude_directive_enabled": true,
    "verified_phone_label_enabled": false,
    "responsive_web_grok_image_annotation_enabled": true,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
    "responsive_web_graphql_timeline_navigation_enabled": true,
    "responsive_web_enhance_cards_enabled": false
};

const defaultVariables = {
    "withCommunity": false,
    "includePromotedContent": false,
    "withVoice": false
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0';

const DEFAULT_HEADERS = {
    'User-Agent': USER_AGENT,
    'Accept': '*/*',
    'Accept-Language': 'en-US, en, *;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'TE': 'trailers',
};

const tokenCache = new Map();

async function getTokens(tweetUrl) {
    if (tokenCache.has(tweetUrl)) {
        return tokenCache.get(tweetUrl);
    }

    try {
        const { data: redirectPageData } = await axios.get(tweetUrl, { headers: DEFAULT_HEADERS });
        const mainJsUrlMatch = redirectPageData.match(/https:\/\/abs.twimg.com\/responsive-web\/client-web-legacy\/main\.[^\.]+\.js/);

        if (!mainJsUrlMatch) {
            throw new Error('Failed to find main JS URL.');
        }

        const mainJsUrl = mainJsUrlMatch[0];
        const bearerToken = await extractBearerToken(mainJsUrl);
        const guestToken = await getGuestToken(redirectPageData);
        const tokens = { bearer: bearerToken, guest: guestToken };
        tokenCache.set(tweetUrl, tokens);
        return tokens;

    } catch (error) {
        console.error("Error getting tokens:", error);
        throw error;
    }
}

async function extractBearerToken(mainJsUrl) {
    try {
        const { data: mainJsData } = await axios.get(mainJsUrl);
        const match = mainJsData.match(/:"Bearer ([^"]+)"/);
        if (!match) throw new Error(`Failed to find bearer token.`);
        return match[1];
    } catch (error) {
        console.error("Error extracting bearer token:", error);
        throw error;
    }
}

async function getGuestToken(data) {
    const match = data.match(/gt=(\d+)/);
    if (!match) throw new Error(`Failed to find guest token.`);
    return match[1];
}

function extractTweetId(tweetUrl) {
    const match = tweetUrl.match(/(?<=status\/)\d+/);
    if (!match) throw new Error(`Could not parse tweet id from URL. Make sure you are using the correct URL.`);
    return match[0];
}

function updateFeaturesAndVariables(errorData, features, variables) {
    const neededVariablesPattern = /Variable '([^']+)'/;
    const neededFeaturesPattern = /The following features cannot be null: ([^"]+)/;

    if (!errorData || !errorData.errors || !Array.isArray(errorData.errors)) {
        console.warn("Invalid error data format.");
        return;
    }

    errorData.errors.forEach(error => {
        if (!error || !error.message) {
            console.warn("Invalid error format.");
            return;
        }

        const neededVars = error.message.match(neededVariablesPattern);
        if (neededVars) {
            neededVars.slice(1).forEach(v => variables[v] = true);
        }

        const neededFeatures = error.message.match(neededFeaturesPattern);
        if (neededFeatures) {
            neededFeatures[1].split(',').forEach(feature => {
                features[feature.trim()] = true;
            });
        }
    });
}

function getDetailsUrl(tID, features, variables) {
    const variablesCopy = { ...variables, tweetId: tID };
    const variablesEncoded = querystring.escape(JSON.stringify(variablesCopy));
    const featuresEncoded = querystring.escape(JSON.stringify(features));
    return `https://api.x.com/graphql/Vg2Akr5FzUmF0sTplA5k6g/TweetResultByRestId?variables=${variablesEncoded}&features=${featuresEncoded}`;
}

function extractMp4s(data) {
    if (!data || !data.core || !data.legacy || !data.views) {
        console.warn("Invalid data format for extracting MP4s.");
        return {
            creator: '@ShiroNexo',
            status: false,
            message: 'Invalid data format from Twitter API'
        };
    }

    const { core, legacy, views } = data;
    const author = core.user_results.result.legacy.screen_name;
    let description = legacy.full_text.replace(/https:\/\/t\.co\/[a-zA-Z0-9_-]+\s*$/, '').trim();
    // console.log(legacy.entities.media[0].video_info);
    const listUrl = legacy.entities?.media?.map(media => {
        if (media.type === 'video' || media.type === 'animated_gif') {
            const variants = media.video_info?.variants;

            if (variants && variants.length > 0) {
                // Filter hanya variant yang punya bitrate
                const mp4Variants = variants.filter(v => v.bitrate !== undefined);

                if (mp4Variants.length > 0) {
                    // Ambil variant dengan bitrate terbesar
                    const bestQualityVariant = mp4Variants.reduce((prev, curr) => (
                        curr.bitrate > prev.bitrate ? curr : prev
                    ), mp4Variants[0]);

                    return {
                        type: media.type === 'video' ? 'video' : 'gif',
                        thumb: media.media_url_https,
                        url: bestQualityVariant.url
                    };
                }
            }
            return null;
        } else if (media.type === 'photo') {
            return {
                type: 'image',
                url: `${media.media_url_https}?format=png&name=large`
            };
        }
        return null;
    }).filter(Boolean) || [];


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
    let features = { ...defaultFeatures };
    let variables = { ...defaultVariables };

    try {
        const token = await getTokens(tweetUrl);
        if (!token.bearer || !token.guest) throw new Error(`Failed to get bearer token.`);
        const { guest, bearer } = token;
        const tweetId = extractTweetId(tweetUrl);
        let url = getDetailsUrl(tweetId, features, variables);
        let details;

        for (let retries = 0; retries < 3; retries++) {
            try {
                const { data, status } = await axios.get(url, {
                    headers: {
                        "Authorization": `Bearer ${bearer}`,
                        "X-Guest-Token": guest,
                    },
                });

                if (status === 200 && data?.data?.tweetResult?.result) {
                    details = data.data.tweetResult.result;
                    break;
                } else {
                    console.warn(`Request failed with status ${status}.  Data:`, data);
                    throw new Error(`Request failed with status ${status}`);
                }
            } catch (error) {
                if (error.response?.status === 400 && error.response.data) {
                    updateFeaturesAndVariables(error.response.data, features, variables);
                    url = getDetailsUrl(tweetId, features, variables);
                    console.log(`Retrying with updated features and variables. Retry count: ${retries + 1}`);
                } else {
                    console.error("Error fetching details:", error);
                    throw error;
                }
            }
        }

        if (!details) {
            return {
                creator: '@ShiroNexo',
                status: false,
                message: 'Failed to retrieve tweet details after multiple retries.'
            };
        }

        return extractMp4s(details);
    } catch (error) {
        console.error("General error:", error);
        tokenCache.delete(tweetUrl);
        return {
            creator: '@ShiroNexo',
            status: false,
            message: error.message || 'An unexpected error occurred'
        };
    }
}

module.exports = twitterDownloader