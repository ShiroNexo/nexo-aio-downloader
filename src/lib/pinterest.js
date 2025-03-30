const pinterest = {
    api: {
        base: "https://www.pinterest.com",
        endpoints: {
            search: "/resource/BaseSearchResource/get/",
            pin: "/resource/PinResource/get/",
            user: "/resource/UserResource/get/"
        }
    },

    headers: {
        'accept': 'application/json, text/javascript, */*, q=0.01',
        'referer': 'https://www.pinterest.com/',
        'user-agent': 'Postify/1.0.0',
        'x-app-version': 'a9522f',
        'x-pinterest-appstate': 'active',
        'x-pinterest-pws-handler': 'www/[username]/[slug].js',
        'x-requested-with': 'XMLHttpRequest'
    },

    isUrl: (str) => {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    },

    isPin: (url) => {
        if (!url) return false;
        const patterns = [
            /^https?:\/\/(?:www\.)?pinterest\.com\/pin\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.(?:ca|co\.uk|com\.au|de|fr|id|es|mx|br|pt|jp|kr|nz|ru|at|be|ch|cl|dk|fi|gr|ie|nl|no|pl|pt|se|th|tr)\/pin\/[\w.-]+/,
            /^https?:\/\/pin\.it\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.com\/amp\/pin\/[\w.-]+/,
            /^https?:\/\/(?:[a-z]{2}|www)\.pinterest\.com\/pin\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.com\/pin\/[\d]+(?:\/)?$/,
            /^https?:\/\/(?:www\.)?pinterest\.[\w.]+\/pin\/[\d]+(?:\/)?$/,
            /^https?:\/\/(?:www\.)?pinterestcn\.com\/pin\/[\w.-]+/,
            /^https?:\/\/(?:www\.)?pinterest\.com\.[\w.]+\/pin\/[\w.-]+/
        ];

        const clean = url.trim().toLowerCase();
        return patterns.some(pattern => pattern.test(clean));
    },

    getCookies: async () => {
        try {
            const response = await axios.get(pinterest.api.base);
            const setHeaders = response.headers['set-cookie'];
            if (setHeaders) {
                const cookies = setHeaders.map(cookieString => {
                    const cp = cookieString.split(';');
                    const cv = cp[0].trim();
                    return cv;
                });
                return cookies.join('; ');
            }
            console.warn("Could not extract cookies from Pinterest response headers.");
            return null;
        } catch (error) {
            console.error("Error fetching Pinterest cookies:", error.message);
            return null;
        }
    },

    _errorResponse: (message) => {
        return {
            creator: '@ShiroNexo',
            status: false,
            message: message || 'An unknown error occurred.'
        };
    },

    _successResponse: (data) => {
        return {
            creator: '@ShiroNexo',
            status: true,
            data: data
        };
    },

    search: async (query, limit = 10) => {
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return pinterest._errorResponse("Query cannot be empty.");
        }

        const safeLimit = Math.max(1, Math.min(limit, 50));

        try {
            const cookies = await pinterest.getCookies();
            if (!cookies) {
                return pinterest._errorResponse("Failed to retrieve Pinterest session cookies.");
            }

            const params = {
                source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
                data: JSON.stringify({
                    options: {
                        isPrefetch: false,
                        query: query,
                        scope: "pins",
                        no_fetch_context_on_resource: false,
                        page_size: safeLimit
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const dynamicHeaders = {
                ...pinterest.headers,
                'cookie': cookies,
            };


            const { data } = await axios.get(`${pinterest.api.base}${pinterest.api.endpoints.search}`, {
                headers: dynamicHeaders,
                params: params
            });

            if (!data?.resource_response?.data?.results) {
                console.warn("Unexpected response structure from Pinterest search:", data);
                return pinterest._errorResponse("Could not parse search results from Pinterest.");
            }

            const results = data.resource_response.data.results;
            const pins = results
                .filter(v => v?.images?.orig?.url)
                .map(result => ({
                    id: result.id,
                    title: result.title || result.grid_title || "",
                    description: result.description || "",
                    created_at: result.created_at,
                    pin_url: `${pinterest.api.base}/pin/${result.id}/`,
                    image_url: result.images.orig.url,
                    images: {
                        original: result.images.orig?.url,
                        large: result.images['736x']?.url,
                        medium: result.images['474x']?.url,
                        small: result.images['236x']?.url,
                    },
                    video_url: result.videos?.video_list?.V_720P?.url || result.videos?.video_list?.V_HLSV4?.url || null,
                    videos: result.videos ? {
                        duration_ms: result.videos.duration,
                        list: result.videos.video_list
                    } : null,
                    is_video: result.is_video || !!result.videos,
                    dominant_color: result.dominant_color,
                    repin_count: result.repin_count || 0,
                    uploader: {
                        username: result.pinner?.username,
                        full_name: result.pinner?.full_name,
                        profile_url: result.pinner?.username ? `${pinterest.api.base}/${result.pinner.username}/` : null,
                        avatar_url: result.pinner?.image_medium_url
                    }
                }));

            if (pins.length === 0) {
                return pinterest._errorResponse(`No results found for query: "${query}".`);
            }

            return pinterest._successResponse({
                query: query,
                count: pins.length,
                pins: pins
            });

        } catch (error) {
            console.error(`Pinterest search error for query "${query}":`, error.response?.data || error.message);
            const statusCode = error.response?.status;
            let message = "Pinterest search failed due to a server error.";
            if (statusCode === 404) message = "Pinterest search endpoint not found (404).";
            if (statusCode === 429) message = "Rate limited by Pinterest. Please try again later.";
            return pinterest._errorResponse(message);
        }
    },

    download: async (pinUrl) => {
        if (!pinUrl || typeof pinUrl !== 'string') {
            return pinterest._errorResponse("Pin URL must be provided as a string.");
        }
        if (!pinterest.isUrl(pinUrl)) {
            return pinterest._errorResponse("Invalid URL format provided.");
        }
        if (!pinterest.isPin(pinUrl)) {
            return pinterest._errorResponse("The provided URL does not appear to be a valid Pinterest Pin URL.");
        }
        if (/^https?:\/\/pin\.it\//.test(pinUrl)) {
            try {
                const response = await axios.get(pinUrl, { maxRedirects: 0, validateStatus: status => status === 308 });
                const redirectUrl = response.headers.location;

                const resolve = await axios.get(redirectUrl, { maxRedirects: 0, validateStatus: status => status === 302 });
                const resolvedUrl = resolve.headers.location;

                console.log("Resolved pin.it link to:", resolvedUrl);
                if (resolvedUrl && pinterest.isPin(resolvedUrl)) {
                    pinUrl = resolvedUrl;
                } else {
                    return pinterest._errorResponse("Could not resolve pin.it link or it doesn't lead to a valid Pin.");
                }
            } catch (resolveError) {
                console.log("Failed to resolve pin.it link:", resolveError);
                return pinterest._errorResponse("Failed to resolve pin.it link.");
            }
        }

        let pinId;
        try {
            const match = pinUrl.match(/\/pin\/([\w-]+)/);
            if (!match || !match[1]) {
                throw new Error("Could not extract Pin ID from URL.");
            }
            pinId = match[1];
        } catch (e) {
            return pinterest._errorResponse("Could not extract Pin ID from the provided URL.");
        }


        try {
            const cookies = await pinterest.getCookies();
            if (!cookies) {
                return pinterest._errorResponse("Failed to retrieve Pinterest session cookies.");
            }

            const params = {
                source_url: `/pin/${pinId}/`,
                data: JSON.stringify({
                    options: {
                        field_set_key: "detailed",
                        id: pinId,
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const dynamicHeaders = {
                ...pinterest.headers,
                'cookie': cookies,
                'x-pinterest-source-url': params.source_url
            };

            const { data } = await axios.get(`${pinterest.api.base}${pinterest.api.endpoints.pin}`, {
                headers: dynamicHeaders,
                params: params
            });

            if (!data?.resource_response?.data) {
                if (data?.resource_response?.error?.message?.includes('not found')) {
                    return pinterest._errorResponse(`Pin with ID ${pinId} not found.`);
                }
                console.warn("Unexpected response structure from Pinterest pin details:", data);
                return pinterest._errorResponse("Could not parse pin details from Pinterest.");
            }

            const pd = data.resource_response.data;

            const media = {
                images: {},
                videos: []
            };

            if (pd.images) {
                if (pd.images.orig) media.images.original = { url: pd.images.orig.url, width: pd.images.orig.width, height: pd.images.orig.height };
                if (pd.images['736x']) media.images.large = { url: pd.images['736x'].url, width: pd.images['736x'].width, height: pd.images['736x'].height };
                if (pd.images['474x']) media.images.medium = { url: pd.images['474x'].url, width: pd.images['474x'].width, height: pd.images['474x'].height };
                if (pd.images['236x']) media.images.small = { url: pd.images['236x'].url, width: pd.images['236x'].width, height: pd.images['236x'].height };
            }

            if (pd.videos?.video_list) {
                media.videos = Object.values(pd.videos.video_list)
                    .filter(v => v.url)
                    .sort((a, b) => b.width - a.width)
                    .map(v => ({
                        quality: `${v.width}x${v.height}`,
                        url: v.url,
                        width: v.width,
                        height: v.height,
                        duration_ms: v.duration || pd.videos.duration || null,
                        thumbnail_url: v.thumbnail || media.images?.original?.url || null
                    }));
            }

            if (Object.keys(media.images).length === 0 && media.videos.length === 0) {
                return pinterest._errorResponse("No downloadable media (images or videos) found for this pin.");
            }

            const pinData = {
                id: pd.id,
                title: pd.title || pd.grid_title || "",
                description: pd.description || "",
                created_at: pd.created_at,
                pin_url: `${pinterest.api.base}/pin/${pd.id}/`,
                dominant_color: pd.dominant_color || null,
                is_video: pd.is_video || media.videos.length > 0,
                media: media,
                link: pd.link || null,
                repin_count: pd.repin_count || 0,
                comment_count: pd.comment_count || 0,
                board: pd.board ? {
                    id: pd.board.id,
                    name: pd.board.name,
                    url: pd.board.url ? `${pinterest.api.base}${pd.board.url}` : null,
                } : null,
                uploader: pd.pinner ? {
                    id: pd.pinner.id,
                    username: pd.pinner.username,
                    full_name: pd.pinner.full_name,
                    profile_url: pd.pinner.username ? `${pinterest.api.base}/${pd.pinner.username}/` : null,
                    avatar_url: pd.pinner.image_medium_url
                } : null,
                tags: pd.pin_join?.visual_descriptions?.map(desc => desc.display_name) || pd.hashtags || []
            };

            return pinterest._successResponse(pinData);

        } catch (error) {
            const statusCode = error.response?.status;
            let message = "Pinterest download failed due to a server error.";
            if (statusCode === 404) message = `Pin not found (404). It might have been deleted or the URL is incorrect.`;
            if (statusCode === 429) message = "Rate limited by Pinterest. Please try again later.";
            return pinterest._errorResponse(message);
        }
    },

    profile: async (username) => {
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return pinterest._errorResponse("Username cannot be empty.");
        }

        const cleanUsername = username.replace(/^@/, '').trim();

        try {
            const cookies = await pinterest.getCookies();
            if (!cookies) {
                return pinterest._errorResponse("Failed to retrieve Pinterest session cookies.");
            }

            const params = {
                source_url: `/${cleanUsername}/`,
                data: JSON.stringify({
                    options: {
                        username: cleanUsername,
                        field_set_key: "profile",
                        isPrefetch: false,
                    },
                    context: {}
                }),
                _: Date.now()
            };

            const dynamicHeaders = {
                ...pinterest.headers,
                'cookie': cookies,
                'x-pinterest-source-url': params.source_url
            };

            const { data } = await axios.get(`${pinterest.api.base}${pinterest.api.endpoints.user}`, {
                headers: dynamicHeaders,
                params: params
            });

            if (!data?.resource_response?.data) {
                if (data?.resource_response?.error?.message?.includes('not found')) {
                    return pinterest._errorResponse(`User profile "${cleanUsername}" not found.`);
                }
                console.warn("Unexpected response structure from Pinterest user profile:", data);
                return pinterest._errorResponse("Could not parse user profile from Pinterest.");
            }

            const userx = data.resource_response.data;

            const profileData = {
                id: userx.id,
                username: userx.username,
                full_name: userx.full_name || "",
                bio: userx.about || "",
                profile_url: `${pinterest.api.base}/${userx.username}/`,
                avatar_url: userx.image_xlarge_url || userx.image_large_url || userx.image_medium_url,
                stats: {
                    pins: userx.pin_count || 0,
                    followers: userx.follower_count || 0,
                    following: userx.following_count || 0,
                    boards: userx.board_count || 0,
                },
                website_url: userx.website_url || null,
                location: userx.location || null,
                country: userx.country || null,
                is_verified: userx.verified_identity || false,
                account_type: userx.account_type || null,
                created_at: userx.created_at || null,
            };

            return pinterest._successResponse(profileData);

        } catch (error) {
            const statusCode = error.response?.status;
            let message = "Fetching Pinterest profile failed due to a server error.";
            if (statusCode === 404) message = `User profile "${cleanUsername}" not found (404).`;
            if (statusCode === 429) message = "Rate limited by Pinterest. Please try again later.";

            return pinterest._errorResponse(message);
        }
    }
};

module.exports = pinterest;