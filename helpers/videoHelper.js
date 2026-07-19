const sourceVideos = require('../data/videos.json');

const videos = sourceVideos.map((video) => ({ ...video }));
const likedVisitors = new Map();

const findVideo = (id) => videos.find((video) => video.id === id);
const getVisitorId = (visitorId, fallbackIp) => (
  typeof visitorId === 'string' && visitorId.trim() ? visitorId.trim() : fallbackIp
);
const publicUrl = (req, mediaPath) => new URL(
  mediaPath,
  `${req.protocol}://${req.get('host')}`,
).href;

function serializeVideo(req, video, visitorId) {
  return {
    ...video,
    videoUrl: publicUrl(req, video.videoUrl),
    profileUrl: publicUrl(req, video.profile),
    thumbnailUrl: publicUrl(req, video.thumbnail),
    isLiked: likedVisitors.get(video.id)?.has(visitorId) || false,
  };
}

function listVideos({ page, limit }) {
  const start = (page - 1) * limit;
  return {
    items: videos.slice(start, start + limit),
    total: videos.length,
  };
}

function toggleVideoLike(video, visitorId) {
  const visitors = likedVisitors.get(video.id) || new Set();
  const isLiked = !visitors.has(visitorId);
  if (isLiked) {
    visitors.add(visitorId);
    video.likes += 1;
  } else {
    visitors.delete(visitorId);
    video.likes = Math.max(0, video.likes - 1);
  }
  likedVisitors.set(video.id, visitors);
  return { videoId: video.id, isLiked, likes: video.likes };
}

function recordVideoShare(video) {
  video.shares += 1;
  return { videoId: video.id, shares: video.shares };
}

module.exports = {
  findVideo,
  getVisitorId,
  listVideos,
  recordVideoShare,
  serializeVideo,
  toggleVideoLike,
};
