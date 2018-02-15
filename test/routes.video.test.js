process.env.NODE_ENV = 'test';
const request = require('request');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const faker = require('faker');
chai.use(chaiHttp);

const server = require('../server/index.js');

describe('routes: video', () => {
  describe('GET /home', () => {
    it('should get all home videos (30 for each genre)', (done) => {
      chai.request(server)
        .get('/home')
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(200);
          res.type.should.equal('application/json');
          res.body.status.should.eql('success');
          var length = Object.keys(res.body.data['homePage']).length;
          var expect = chai.expect;
          expect(length).to.be.at.least(1);
          done();
        });
    });
  });
  describe('GET /content/:id', () => {
    it('should get one video', (done) => {
      chai.request(server)
        .get('/content/0438cda6-b1f4-4468-acf2-f244cbd6091f')
        .end((err, res) => {
          console.log(res.body.data);
          should.not.exist(err);
          res.status.should.equal(200);
          res.type.should.equal('application/json');
          res.body.status.should.eql('success');
          res.body.data.should.include.keys(
            'id', 'lastupdated', 'title', 'description', 'genres', 'cast', 'director', 'duration', 
            'rating', 'releasedate', 'isoriginal', 'ismovie', 'locationuri', 'regions',
            'thumbnailurl', 'trailerurl'
          );
          done();
        });
    });
  });
  describe('Fail to GET /content/:id', () => {
    it('should fail to retrieve a nonexistent video', (done) => {
      const Uuid = require('cassandra-driver').types.Uuid;
      const id = Uuid.random();
      chai.request(server)
        .get(`/content/${id}`)
        .end((err, res) => {
          res.status.should.equal(404);
          res.body.status.should.eql('failed');
          done();
        });
    });
  });
  describe('POST /content', () => {
    it('should post a new video', (done) => {
      chai.request(server)
        .post('/content')
        .send({
          title: 'Transformers',
          description: 'Movie about robots',
          genres: ['Action', 'Science Fiction'],
          cast: ['Shia LaBeouf', 'Megan Fox'],
          director: 'Michael Bay',
          duration: 8580,
          rating: 'PG-13',
          releaseDate: '07/03/07',
          isOriginal: false,
          isMovie: true,
          locationURI: 'http://s3storage.com/transformers',
          thumbnailURL: 'http://www.thumbnails.com/transformers',
          trailerURL: 'http://www.trailers.com/transformers',
          regions: ['United States', 'Canada']
        })
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(201);
          res.body.status.should.eql('success');
          done();
        });
    });
  });
  describe('Fail to POST /content', () => {
    it('should fail to post a new video', (done) => {
      chai.request(server)
        .post('/content')
        .send({
          title: 'Transformers',
          description: 'Movie about robots',
          genres: ['Action', 'Science Fiction'],
          cast: ['Shia LaBeouf', 'Megan Fox'],
          director: 'Michael Bay',
          duration: 'long',
          rating: 'PG-13',
          releaseDate: '07/03/07',
          isOriginal: false,
          isMovie: true,
          locationURI: 'http://s3storage.com/transformers',
          thumbnailURL: 'http://www.thumbnails.com/transformers',
          trailerURL: 'http://www.trailers.com/transformers',
          regions: ['United States', 'Canada']
        })
        .end((err, res) => {
          should.exist(err);
          res.status.should.equal(404);
          res.body.status.should.eql('failed');
          res.body.message.should.eql('Could not post an invalid video');
          done();
        });
    });
  });
  describe('DELETE /content/:id', () => {
    it('should delete an existing video', (done) => {
      chai.request(server)
        .del('/content/dce2349d-26f2-4c1d-9835-20d81d8a67ce')
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(200);
          res.body.status.should.eql('success');
          done();
        });
    });
  });
  describe('Fail to DELETE /content/:id', () => {
    it('should fail to delete a nonexistent video', (done) => {
      chai.request(server)
        .del('/content/999999999999')
        .end((err, res) => {
          should.exist(err);
          res.status.should.equal(404);
          res.body.status.should.equal('failed');
          res.body.message.should.eql('Could not delete a nonexistent video');
          done();
        });
    });
  });
  describe('UPDATE /content/:id', () => {
    it('should update an existing video', (done) => {
      chai.request(server)
        .patch('/content/e92a9a7e-63f8-48bd-af19-ddd85cfb4823')
        .send({
          lastUpdated: '0eee7f20-0a51-11e8-8761-a38f185c91c1',
          genres: '{\'Thriller\', \'Drama\', \'Horror\'}'
        })
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(200);
          res.body.status.should.eql('success');
          done();
        });
    });
  });
  describe('Fail to UPDATE /content/:id', () => {
    it('should fail to update a nonexistent video', (done) => {
      const Uuid = require('cassandra-driver').types.Uuid;
      const id = Uuid.random();
      chai.request(server)
        .patch(`/content/${id}`)
        .send({
          lastUpdated: '0eee7f20-0a51-11e8-8761-a38f185c91c1'
        })
        .end((err, res) => {
          should.exist(err);
          res.status.should.equal(404);
          res.body.status.should.equal('failed');
          res.body.message.should.eql('Could not update a nonexistent video');
          done();
        });
    });
  });
  describe('GET /content/genre/:genre', () => {
    it('should get 30 video ids of one genre', (done) => {
      chai.request(server)
        .get('/content/genre/Automotive')
        .end((err, res) => {
          res.status.should.equal(200);
          res.type.should.equal('application/json');
          res.body.status.should.eql('success');
          res.body.data.should.include.keys(
            'Automotive'
          );
          done();
        });
    });
  });
  describe('Fail to GET /content/genre/:genre', () => {
    it('should fail to get video ids of nonexistent genre', (done) => {
      chai.request(server)
        .get('/content/genre/Coding')
        .end((err, res) => {
          res.status.should.equal(404);
          res.body.status.should.eql('failed');
          done();
        });
    });
  });
  describe('GET all UUIDs', () => {
    it('should get all UUIDs', (done) => {
      chai.request(server)
        .get('/uuids')
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.equal(200);
          res.body.status.should.eql('success');
          res.body.data.length.should.equal(5000);
          done();
        });
    });
  });
});