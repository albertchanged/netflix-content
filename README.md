# Netflix Content Microservice

Click below to view a full size image!

<a href="https://i.imgur.com/676rcCs.png
" target="_blank"><img src="https://i.imgur.com/676rcCs.png" 
alt="Netflix Content Microservice Achieved Metrics" width="70%" border="10" /></a>

## What Is It?

This microservice simulates vigorous activity on Netflix's website, focusing on two (2) primary use cases:
1. A user hovers over a video thumbnail to view information
2. A user clicks on a video to watch it

## What Did I Do?

I architected the routes, endpoints, and database functions in a Node.js runtime environment. To evaluate my application's performance, I stress tested my heaviest endpoint using custom Artillery settings. Initially, my
``GET content/:id`` functionality could only reach a throughput of 400 requests per second (RPS) and took 2,600 milliseconds (ms) to complete a request at one point in the test. However, after implementing Redis to cache results and achieve constant time retrieval, I increased my throughput by 400% to 1,300 RPS and reduced my latency by 75% to 630 ms!

It was time to take things to the next level.

I then enlisted a Docker Swarm to deploy my service on Amazon Web Services EC2 Linux Instances. I started with 1 t2.medium instance to hold Cassandra, Redis, and a proxy server, and 1 t2.micro to hold my application's web server. My goal for deployment was to achieve 1,000+ RPS and a latency below 200 ms. Stress testing this setup yielded a throughput of 650 RPS and latency of 722 ms. Not quite there yet. So, to distribute request load across more nodes, I horizontally scaled my service by adding 2 more t2.micro instances, both of which carried my web server as well. With this new and robust setup, I more than doubled my throughput of 1,400 RPS and cut my latency by 85% to 115 ms!

## Technologies

Powered by Amazon Web Services, Docker and Docker Swarm, Node.js, Koa.js, Cassandra, and Redis

## Requirements

- Node 6.4.x
- Koa 2.4.1
- Cassandra 3.11.1
- Redis

### Installing Dependencies

From within the root directory:

`npm install`
