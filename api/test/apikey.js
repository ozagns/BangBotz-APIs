// api/test/apikey.js
import { validateApiKey, checkRateLimit } from '../../lib/middleware.js';  // ← harus ada .js

export default async function handler(req, res) {
  const { apikey } = req.query;

  const auth = await validateApiKey(apikey);
  
  if (!auth.valid) {
    return res.status(auth.code).json({
      status: false,
      message: auth.message
    });
  }

  const rateLimit = checkRateLimit(apikey, auth.user.tier);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      status: false,
      message: `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds`
    });
  }

  res.status(200).json({
    status: true,
    message: 'API Key valid!',
    user: auth.user,
    rateLimit: {
      remaining: rateLimit.remaining
    }
  });
}