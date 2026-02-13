// api/info/status.js
export default async function handler(req, res) {
  res.status(200).json({
    status: 'online',
    message: 'BangBotz-API is running!',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}