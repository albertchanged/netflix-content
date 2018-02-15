const faker = require('faker');
const moment = require('moment');
const fs = require('fs');
const axios = require('axios');
const redis = require('./redis.js');
const env = require('../env.js');
const statsD = require('node-statsd');

const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: [ process.env.CASSANDRA_HOST || '127.0.0.1' ], keyspace: 'content_mv' });
client.connect();

const statsDClient = new statsD({
  host: 'statsd.hostedgraphite.com',
  port: 8125,
  prefix: env.statsD
});
statsDClient.socket.on('error', () => {
  return;
});

module.exports = {

  /******************************** NETFLIX CONTENT MANAGER ********************************/

  insertVideo: (video) => {
    let genres = video.genres.map((genre) => { return '\'' + genre.toString() + '\''; });
    let cast = video.cast.map((member) => { return '\'' + member.toString() + '\''; });
    let regions = video.regions.map((region) => { return '\'' + region.toString() + '\''; });

    let insertQuery = 
    `INSERT INTO content_mv.video 
    (id, lastUpdated, title, description, genres, cast, director, duration, rating, releaseDate, isOriginal, isMovie, locationURI, thumbnailURL, trailerURL, regions) 
    VALUES 
    (uuid(), now(), '${video.title}', '${video.description}', {${genres}}, {${cast}}, '${video.director}', ${video.duration}, '${video.rating}', '${video.releaseDate}', 
    ${video.isOriginal}, ${video.isMovie}, '${video.locationURI}', '${video.thumbnailURL}', '${video.trailerURL}', {${regions}});`;

    return client.execute(insertQuery, { prepare: true })
      .then((success) => {
        // Somehow send new video's data to CFS
      })
      .catch((err) => {
        throw new Error('Cannot insert video');
      });
  },
  deleteVideo: (id) => {
    let query = `DELETE FROM content_mv.video WHERE id = ${id};`;
    return client.execute(query, { prepare: true })
      .then((success) => {
      })
      .catch((err) => {
        throw new Error('Cannot delete video');
      });
  },
  updateVideo: (id, lastUpdated, genres, text) => {
    let query = `UPDATE content_mv.video SET description = '${text}' WHERE id = ${id} AND lastUpdated = ${lastUpdated} AND genres = ${genres};`;
    return client.execute(query, { prepare: true })
      .then((success) => {
        console.log('Successfully updated video!', success);
      })
      .catch((err) => {
        throw new Error('Cannot update video');
      });
  },
  
  /******************************** CFS - GET /content ********************************/

  getOneVideo: async (id) => {
    let query = `SELECT * FROM content_mv.video WHERE id = ${id}`;
    const start = Date.now();
    var video = await redis.hgetallAsync(id)
      .then((res) => {
        statsDClient.timing('.service.content.id.redis.time', Date.now() - start, 0.25);
        return res;
      });
    if (video && video['id']) {
      for (var key in video) {
        if (video[key].includes('|')) {
          video[key] = video[key].split('|');
        }
      }
      return video;
    } else {
      return client.execute(query, { prepare: true })
        .then((res) => {
          statsDClient.timing('.service.content.id.cass.time', Date.now() - start, 0.25);
          let v = res.rows[0];
          if (v && v['id']) {
            redis.hmsetSync(id, {
              'id': v['id'].toString(),
              'genres': v['genres'].join('|').toString(),
              'cast': v['cast'].join('|').toString(),
              'description': v['description'],
              'director': v['director'],
              'duration': v['duration'],
              'ismovie': v['ismovie'],
              'isoriginal': v['isoriginal'],
              'locationuri': v['locationuri'],
              'rating': v['rating'],
              'regions': v['regions'].join('|').toString(),
              'releasedate': v['releasedate'],
              'thumbnailurl': v['thumbnailurl'],
              'title': v['title'],
              'trailerurl': v['trailerurl']
            });
            return v;
          } else {
            throw new Error('Cannot get one video');
          }
        })
        .catch((err) => {
          console.error(err);
          return err;
        });
    }
  },

  /******************************** CFS - GET /home ********************************/

  getTop30InGenre: async (genre) => {
    let genreQuery = `SELECT id FROM content_mv.video_by_genres WHERE genres CONTAINS '${genre}' LIMIT 30 ALLOW FILTERING;`;
    var genreObj = {};
    const top30 = await redis.getAsync(genre);
    if (top30) {
      genreObj[genre] = top30.split('|');
      return genreObj;
    } else {
      return client.execute(genreQuery, { prepare: true })
        .then((res) => {
          var idArray = [];
          if (res.rows && res.rows.length > 0) {
            res.rows.forEach((id) => {
              idArray.push(id['id']);
            });
            redis.setAsync(genre, idArray.join('|').toString());
            genreObj[genre] = idArray;
            return genreObj;
          } else {
            throw new Error('Cannot get top 30 in genre');
          }
        })
        .catch((err) => {
          return err;
        });
    }
  },
  getAllHomeVideos: async () => {
    var genres = [];
    for (var i = 0; i < 10; i++) {
      genres.push(faker.commerce.department());
    }
    var promises = genres.map(async (genre) => {
      return await module.exports.getTop30InGenre(genre);
    });
    return await Promise.all(promises);
  },

  /****************************** FOR TESTING PURPOSES ******************************/
  
  getAllUUIDs: () => {
    let query = 'SELECT id FROM content_mv.video';
    return client.execute(query, { prepare: true })
      .then(async (res) => {
        return await res.rows && await res.rows.map((row) => {
          return row.id;
        })
      });
  }
};