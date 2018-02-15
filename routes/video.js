const Router = require('koa-router');
const db = require('../db/index.js');
const qs = require('qs');
const axios = require('axios');
const bodyParser = require('koa-bodyparser');
const env = require('../env.js');

const router = new Router();

const statsD = require('node-statsd');
const statsDClient = new statsD({
  host: 'statsd.hostedgraphite.com',
  port: 8125,
  prefix: env.statsD
});

statsDClient.socket.on('error', () => {
  return;
});

/*************************** MICROSERVICE ENDPOINTS ***************************/

// CFS sends a get request for top 30 videos for 10 genres, Content responds with those videos
router.get('/home', async (ctx) => {
  try {
    const homeVideos = { homePage: await db.getAllHomeVideos() };

    // Remember to periodically send CFS these homeVideos too
    // axios.post --- 300 videoIds

    if (Object.keys(homeVideos).length > 0) {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: homeVideos
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'failed',
        message: 'Could not get home videos'
      }
      throw new Error('Error getting home videos');
    }
  } catch (err) {
    console.error(err);
  }
});

// CFS sends a get request with a video id, Content sends back the corresponding video
router.get('/content/:id', async (ctx) => {
  const start = Date.now();
  try {
    const video = await db.getOneVideo(ctx.params.id);
    if (typeof video === 'object') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: video
      }
      statsDClient.increment('.service.content.id.success', 1, 0.25);
      statsDClient.timing('.service.content.id.success.latency', Date.now() - start, 0.25);
    }
    if (video instanceof Error) {
      ctx.status = 404;
      ctx.body = {
        status: 'failed'
      }
      statsDClient.increment('.service.content.id.failure', 1, 0.25);
      statsDClient.timing('.service.content.id.failure.latency', Date.now() - start, 0.25);
      throw new Error('Could not get requested video');
    }
  } catch (err) {
    console.error(err);
  }
});


/*************************** ENDPOINTS FOR TESTING ***************************/

// For testing purposes -- acting as Netflix content manager
router.post('/content', async (ctx) => {
  try {
    const video = await db.insertVideo(ctx.request.body);
    // axios.post('/content', { data: {} })
    //   .then(())
    ctx.status = 201;
    ctx.body = {
      status: 'success',
      data: video
    };
  } catch (err) {
    ctx.status = 404;
    ctx.body = {
      status: 'failed',
      message: 'Could not post an invalid video'
    }
  }
});

// For testing purposes -- acting as Netflix content manager
router.delete('/content/:id', async (ctx) => {
  try {
    const deleted = await db.deleteVideo(ctx.params.id);
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: deleted
    }
  } catch (err) {
    ctx.status = 404;
    ctx.body = {
      status: 'failed',
      message: 'Could not delete a nonexistent video'
    }
  }
});

router.patch('/content/:id', async (ctx) => {
  const lastUpdated = ctx.request.body['lastUpdated'];
  const genres = ctx.request.body['genres'];
  try {
    const updated = await db.updateVideo(ctx.params.id, lastUpdated, genres, 'A show about black mirrors');
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: updated
    }
  } catch (err) {
    ctx.status = 404;
    ctx.body = {
      status: 'failed',
      message: 'Could not update a nonexistent video'
    }
  }
});

// Testing purposes only
router.get('/videos', async (ctx) => {
  try {
    const uuids = await db.getAllUUIDs();
    var randomUUID = uuids[Math.floor(Math.random() * uuids.length)];
    axios.get('http://localhost:1337/content', { params: { videoId: randomUUID }})
      .then((success) => {
      })
      .catch((err) => {
        console.error('Failed to get videos', err);
      });
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: randomUUID
    }
  } catch (err) {
    ctx.status = 404;
    ctx.body = {
      status: 'failed'
    }
  }
});

// Testing purposes only
router.get('/content', async (ctx) => {
  try {
    const video = await db.getOneVideo(ctx.request.query['videoId'].replace(/"/g, ''));
    if (typeof video === 'object') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: video
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'failed'
      }
      throw new Error('Error getting the video');
    }    
  } catch (err) {
    console.error(err);
  }
});

// Testing purposes only
router.get('/content/genre/:genre', async (ctx) => {
  try {
    const videos = await db.getTop30InGenre(ctx.params.genre);
    if (typeof videos === 'object') {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: videos
      }
    }
    if (videos instanceof Error) {
      ctx.status = 404;
      ctx.body = {
        status: 'failed'
      }
      throw new Error('Could not get videos from genre');
    }
  } catch (err) {
    console.error(err);
  }
});

// Testing purposes only
router.get('/uuids', async (ctx) => {
  try {
    const uuids = await db.getAllUUIDs();
    ctx.status = 200;
    ctx.body = {
      status: 'success',
      data: uuids
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;

