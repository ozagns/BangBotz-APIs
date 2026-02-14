// api/downloader.js
import { validateApiKey, checkRateLimit } from '../lib/middleware.js';
import { getYoutubeInfo, getTikTokMedia, getInstagramMedia } from '../lib/scraper.js';

export default async function handler(req, res) {
  const { apikey, url, platform } = req.query;

  // Validate API Key
  const auth = await validateApiKey(apikey);
  
  if (!auth.valid) {
    return res.status(auth.code).json({
      status: false,
      message: auth.message
    });
  }

  // Rate Limiting
  const rateLimit = checkRateLimit(apikey, auth.user.tier);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      status: false,
      message: `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds`
    });
  }

  // Validate parameters
  if (!url) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "url" is required'
    });
  }

  if (!platform) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "platform" is required. Options: youtube, tiktok, instagram'
    });
  }

  try {
    let result;

    switch(platform.toLowerCase()) {
      case 'youtube':
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
          return res.status(400).json({
            status: false,
            message: 'Invalid YouTube URL'
          });
        }
        result = await getYoutubeInfo(url);
        break;

      case 'tiktok':
        if (!url.includes('tiktok.com')) {
          return res.status(400).json({
            status: false,
            message: 'Invalid TikTok URL'
          });
        }
        result = await getTikTokMedia(url);
        break;

      case 'instagram':
        if (!url.includes('instagram.com')) {
          return res.status(400).json({
            status: false,
            message: 'Invalid Instagram URL'
          });
        }
        result = await getInstagramMedia(url);
        break;

      default:
        return res.status(400).json({
          status: false,
          message: 'Invalid platform. Options: youtube, tiktok, instagram'
        });
    }

    res.status(200).json({
      status: true,
      creator: 'BangBotz-API',
      platform: platform,
      data: result,
      quota: {
        used: auth.user.requests,
        limit: auth.user.limit,
        remaining: auth.user.limit - auth.user.requests
      }
    });
  } catch (error) {
    console.error(`${platform} API error:`, error);
    res.status(500).json({
      status: false,
      message: error.message || `Failed to process ${platform} URL`
    });
  }
}