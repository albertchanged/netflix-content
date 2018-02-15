const faker = require('faker');
const moment = require('moment');
const fs = require('fs');

var insertfds = [];
for (var i = 0; i < 5; i++) {
  insertfds.push(fs.openSync('insert' + i, 'a+'));
}

for (var i = 0; i < 5000000; i++) {
  var releaseDate = moment(faker.date.past()).format('LL');
  const Uuid = require('cassandra-driver').types.Uuid;
  const TimeUuid = require('cassandra-driver').types.TimeUuid;
  const timeId = TimeUuid.now();
  const id = Uuid.random();
  var randomRegionsNum = Math.floor(Math.random() * 5) + 1;
  var regionsStr = '\'' + faker.address.country().replace('\'', ' ') + '\'' + ',';

  for (var j = 0; j < randomRegionsNum; j++) {
    regionsStr = regionsStr.concat('\'' + faker.address.country().replace('\'', ' ') + '\'' + ',');
  }

  const ratingArray = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
  var randomRatingNum = Math.floor(Math.random() * ratingArray.length);
  var rating = ratingArray[randomRatingNum];
  const insertData = `${id}|{'${faker.name.findName().replace('\'', '\'\'')}','${faker.name.findName().replace('\'', '\'\'')}'}|${faker.name.jobDescriptor().replace('\'', '\'\'')}|${faker.name.findName().replace('\'', '\'\'')}|${Math.floor(Math.random() * (7200 - 1800 + 1)) + 1800}|{'${faker.commerce.department()}','${faker.commerce.department()}'}|${faker.random.boolean()}|${faker.random.boolean()}|${faker.internet.domainName()}|${rating}|{${regionsStr.slice(0, regionsStr.length - 1)}}|${releaseDate}|${faker.internet.domainName()}|${faker.name.title().replace('\'', '\'\'')}|${faker.internet.domainName()}`;

  fs.writeSync(insertfds[i % 5], `${insertData}\n`);
}