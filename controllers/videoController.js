const { createHttpError, successResponse } = require('../helpers/responseHelper');
const {
  findVideo,
  getVisitorId,
  listVideos,
  recordVideoShare,
  serializeVideo,
  toggleVideoLike,
} = require('../helpers/videoHelper');

const sharePlatforms = new Set(['native_share', 'copy_link', 'whatsapp', 'facebook', 'x']);

function getVideos(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 40);
    const visitorId = getVisitorId(req.query.visitorId, req.ip);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw createHttpError(400, 'page and limit must be positive integers; limit cannot exceed 100');
    }
    if (visitorId.length > 128) throw createHttpError(400, 'visitorId is too long');

    const { items, total } = listVideos({ page, limit });
    return successResponse(res, {
      data: items.map((video) => serializeVideo(req, video, visitorId)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}

function toggleLike(req, res, next) {
  try {
    const { videoId, visitorId } = req.body || {};
    if (typeof videoId !== 'string' || !videoId.trim()) throw createHttpError(400, 'videoId is required');
    if (visitorId !== undefined && (typeof visitorId !== 'string' || !visitorId.trim() || visitorId.length > 128)) {
      throw createHttpError(400, 'visitorId must be a non-empty string of at most 128 characters');
    }

    const video = findVideo(videoId);
    if (!video) throw createHttpError(404, 'Video not found');
    return successResponse(res, { data: toggleVideoLike(video, getVisitorId(visitorId, req.ip)) });
  } catch (error) {
    return next(error);
  }
}

function shareVideo(req, res, next) {
  try {
    const { videoId, platform } = req.body || {};
    if (typeof videoId !== 'string' || !videoId.trim()) throw createHttpError(400, 'videoId is required');
    if (typeof platform !== 'string') throw createHttpError(400, 'platform is required');

    const video = findVideo(videoId);
    if (!video) throw createHttpError(404, 'Video not found');
    if (!sharePlatforms.has(platform)) throw createHttpError(400, 'Invalid share platform');
    return successResponse(res, { data: recordVideoShare(video) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getVideos, shareVideo, toggleLike };
