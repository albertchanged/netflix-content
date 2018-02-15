process.env.NODE_ENV = 'test';
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../server/index.js');

describe('routes: index', () => {
  describe('GET /', () => {
    it('should return JSON', (done) => {
      chai.request(server)
        .get('/')
        .end((err, res) => {
          should.not.exist(err);
          res.type.should.eql('application/json');
          res.status.should.eql(200);
          res.body.message.should.eql('Content Microservice for Netflix');
          done();
        });
    });
  });
});