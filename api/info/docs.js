// api/info/docs.js
export default async function handler(req, res) {
  const endpoints = {
    downloader: [
      '/api/downloader/youtube?apikey=YOUR_KEY&url=YOUTUBE_URL',
      '/api/downloader/tiktok?apikey=YOUR_KEY&url=TIKTOK_URL',
      '/api/downloader/instagram?apikey=YOUR_KEY&url=INSTAGRAM_URL'
    ],
    ai: [
      '/api/ai/chatgpt?apikey=YOUR_KEY&text=YOUR_QUESTION',
      '/api/ai/gemini?apikey=YOUR_KEY&text=YOUR_QUESTION'
    ],
    tools: [
      '/api/tools/shortlink?apikey=YOUR_KEY&url=LONG_URL',
      '/api/tools/qrcode?apikey=YOUR_KEY&text=TEXT_TO_ENCODE'
    ]
  };

  res.status(200).json({
    status: true,
    creator: 'BangBotz-API',
    endpoints
  });
}