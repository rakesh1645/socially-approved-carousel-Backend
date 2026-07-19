const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const videos = require('../data/videos.json').map((video) => ({ ...video }));

const app = express();
const likedVisitors = new Map();
const sharePlatforms = new Set(['native_share', 'copy_link', 'whatsapp', 'facebook', 'x']);
const engagementLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));
app.use('/videos', express.static(path.join(__dirname, '..', 'public', 'videos'), { acceptRanges: true, maxAge: '1d' }));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images'), { maxAge: '1d' }));
app.use('/thumbnails', express.static(path.join(__dirname, '..', 'public', 'thumbnails'), { maxAge: '1d' }));

const findVideo = (id) => videos.find((video) => video.id === id);
const publicUrl = (req, mediaPath) => new URL(mediaPath, `${req.protocol}://${req.get('host')}`).href;
const serialize = (req, video, visitorId) => ({
  ...video,
  videoUrl: publicUrl(req, video.videoUrl),
  profileUrl: publicUrl(req, video.profile),
  thumbnailUrl: publicUrl(req, video.thumbnail),
  isLiked: likedVisitors.get(video.id)?.has(visitorId) || false,
});

app.get('/api/videos', (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 40);
  const visitorId = typeof req.query.visitorId === 'string' && req.query.visitorId.trim()
    ? req.query.visitorId.trim()
    : req.ip;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, error: 'page and limit must be positive integers; limit cannot exceed 100' });
  }
  if (visitorId.length > 128) return res.status(400).json({ success: false, error: 'visitorId is too long' });
  const start = (page - 1) * limit;
  return res.json({
    success: true,
    data: videos.slice(start, start + limit).map((video) => serialize(req, video, visitorId)),
    pagination: { page, limit, total: videos.length, pages: Math.ceil(videos.length / limit) },
  });
});

app.post('/api/like', engagementLimiter, (req, res) => {
  const { videoId, visitorId } = req.body || {};
  if (typeof videoId !== 'string' || !videoId.trim()) {
    return res.status(400).json({ success: false, error: 'videoId is required' });
  }
  if (visitorId !== undefined && (typeof visitorId !== 'string' || !visitorId.trim() || visitorId.length > 128)) {
    return res.status(400).json({ success: false, error: 'visitorId must be a non-empty string of at most 128 characters' });
  }
  const video = findVideo(videoId);
  if (!video) return res.status(404).json({ success: false, error: 'Video not found' });

  const identity = typeof visitorId === 'string' && visitorId.trim() ? visitorId.trim() : req.ip;
  const visitors = likedVisitors.get(videoId) || new Set();
  const isLiked = !visitors.has(identity);
  if (isLiked) {
    visitors.add(identity);
    video.likes += 1;
  } else {
    visitors.delete(identity);
    video.likes = Math.max(0, video.likes - 1);
  }
  likedVisitors.set(videoId, visitors);
  return res.json({ success: true, data: { videoId, isLiked, likes: video.likes } });
});

app.post('/api/share', engagementLimiter, (req, res) => {
  const { videoId, platform } = req.body || {};
  if (typeof videoId !== 'string' || !videoId.trim()) {
    return res.status(400).json({ success: false, error: 'videoId is required' });
  }
  if (typeof platform !== 'string') {
    return res.status(400).json({ success: false, error: 'platform is required' });
  }
  const video = findVideo(videoId);
  if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
  if (!sharePlatforms.has(platform)) return res.status(400).json({ success: false, error: 'Invalid share platform' });
  video.shares += 1;
  return res.json({ success: true, data: { videoId, shares: video.shares } });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

module.exports = app;
