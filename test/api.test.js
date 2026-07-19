const request = require('supertest');
const app = require('../src/app');

describe('video API', () => {
  it('returns paginated backend metadata and public media URLs', async () => {
    const response = await request(app)
      .get('/api/videos?limit=5&visitorId=list-test-user')
      .expect(200);

    expect(response.body.data).toHaveLength(5);
    expect(response.body.pagination.total).toBe(30);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      videoUrl: expect.stringMatching(/^http/),
      thumbnailUrl: expect.stringMatching(/^http/),
      profileUrl: expect.stringMatching(/^http/),
      isLiked: false,
    }));
  });

  it('toggles likes and returns visitor-specific liked state', async () => {
    const visitorId = 'like-test-user';
    const liked = await request(app)
      .post('/api/like')
      .send({ videoId: 'video-2', visitorId })
      .expect(200);
    expect(liked.body.data.isLiked).toBe(true);

    const videos = await request(app)
      .get(`/api/videos?visitorId=${visitorId}`)
      .expect(200);
    expect(videos.body.data.find((video) => video.id === 'video-2').isLiked).toBe(true);
  });

  it('tracks valid shares and rejects malformed engagement requests', async () => {
    await request(app)
      .post('/api/share')
      .send({ videoId: 'video-3', platform: 'copy_link' })
      .expect(200);
    await request(app).post('/api/like').send({}).expect(400);
    await request(app)
      .post('/api/share')
      .send({ videoId: 'video-3', platform: 'invalid' })
      .expect(400);
  });
});
