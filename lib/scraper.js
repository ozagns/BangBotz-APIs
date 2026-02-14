// lib/scraper.js
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Tiktok from '@tobyg74/tiktok-api-dl';

export async function getYoutubeInfo(url) {
  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Get video formats
    const videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    // Get best quality
    const bestVideo = videoFormats.find(f => f.qualityLabel === '720p') || videoFormats[0];
    const bestAudio = audioFormats.find(f => f.audioBitrate === 128);

    return {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      views: info.videoDetails.viewCount,
      description: info.videoDetails.description.substring(0, 200) + '...',
      video: {
        quality: bestVideo?.qualityLabel || '360p',
        url: bestVideo?.url,
        size: bestVideo?.contentLength
      },
      audio: {
        quality: bestAudio?.audioBitrate + 'kbps' || '128kbps',
        url: bestAudio?.url,
        size: bestAudio?.contentLength
      }
    };
  } catch (error) {
    console.error('YouTube error:', error);
    throw new Error('Failed to fetch YouTube data: ' + error.message);
  }
}

// TikTok Downloader - FIXED MAPPING
export async function getTikTokMedia(url) {
  try {
    if (!url.includes('tiktok.com')) {
      throw new Error('Invalid TikTok URL');
    }

    const result = await Tiktok.Downloader(url, {
      version: "v3"
    });
    
    if (!result.status || result.status !== 'success') {
      throw new Error('Failed to fetch TikTok data');
    }

    const data = result.result;

    return {
      type: data.type || 'video',
      title: data.desc || 'TikTok Video',
      author: {
        username: data.author?.nickname || 'Unknown',
        avatar: data.author?.avatar
      },
      video: {
        noWatermark: data.videoHD || data.videoSD, // HD quality tanpa watermark
        watermark: data.videoWatermark, // Dengan watermark
        quality: {
          hd: data.videoHD,
          sd: data.videoSD
        }
      },
      images: data.images || [], // Untuk TikTok slideshow
      note: 'Statistics and music info not available in v3 API'
    };
  } catch (error) {
    console.error('TikTok error:', error);
    throw new Error('Failed to fetch TikTok media: ' + error.message);
  }
}

// Instagram - Placeholder
export async function getInstagramMedia(url) {
  throw new Error('Instagram downloader is under maintenance.');
}