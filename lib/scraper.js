// lib/scraper.js
import axios from 'axios';

// YouTube Downloader (pakai third-party API atau library)
export async function getYoutubeInfo(url) {
  try {
    // Option 1: Pakai ytdl-core (return URL aja, jangan download)
    // Option 2: Pakai third-party API
    
    // Contoh pakai API gratis:
    const response = await axios.get(`https://api.example.com/youtube?url=${encodeURIComponent(url)}`);
    
    return {
      title: response.data.title,
      thumbnail: response.data.thumbnail,
      duration: response.data.duration,
      author: response.data.author,
      downloadUrl: response.data.downloadUrl, // Direct URL
      quality: response.data.quality || '720p'
    };
  } catch (error) {
    throw new Error('Failed to fetch YouTube data');
  }
}

// TikTok Downloader
export async function getTikTokInfo(url) {
  // Similar implementation
}

// Instagram Downloader
export async function getInstagramInfo(url) {
  // Similar implementation
}
```

---

### **6. Setup Environment Variables di Vercel**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Tambahkan:
```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key-here