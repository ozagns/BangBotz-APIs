// api/downloader/tiktok.js
import { validateApiKey, checkRateLimit } from '../../lib/middleware.js';
import { getTikTokMedia } from '../../lib/scraper.js';

export default async function handler(req, res) {
  const { apikey, url } = req.query;

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

  // Validate URL parameter
  if (!url) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "url" is required',
      example: '/api/downloader/tiktok?apikey=YOUR_KEY&url=https://www.tiktok.com/@username/video/xxx'
    });
  }

  // Check if valid TikTok URL
  if (!url.includes('tiktok.com')) {
    return res.status(400).json({
      status: false,
      message: 'Invalid TikTok URL'
    });
  }

  try {
    const result = await getTikTokMedia(url);

    res.status(200).json({
      status: true,
      creator: 'BangBotz-API',
      data: result,
      quota: {
        used: auth.user.requests,
        limit: auth.user.limit,
        remaining: auth.user.limit - auth.user.requests
      }
    });
  } catch (error) {
    console.error('TikTok API error:', error);
    res.status(500).json({
      status: false,
      message: error.message || 'Failed to process TikTok URL'
    });
  }
}