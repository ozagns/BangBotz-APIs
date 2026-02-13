// api/downloader/youtube.js
import { validateApiKey, checkRateLimit } from '../../lib/middleware';
import { getYoutubeInfo } from '../../lib/scraper';

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

  // Validate URL
  if (!url) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "url" is required'
    });
  }

  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return res.status(400).json({
      status: false,
      message: 'Invalid YouTube URL'
    });
  }

  try {
    const result = await getYoutubeInfo(url);

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
    console.error('YouTube error:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to process YouTube URL'
    });
  }
}