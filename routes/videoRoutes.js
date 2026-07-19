const express = require('express');
const {
  getVideos,
  shareVideo,
  toggleLike,
} = require('../controllers/videoController');
const engagementLimiter = require('../middleware/engagementLimiter');

const router = express.Router();  

router.get('/videos', getVideos);
router.post('/like', engagementLimiter, toggleLike);
router.post('/share', engagementLimiter, shareVideo);

module.exports = router;
