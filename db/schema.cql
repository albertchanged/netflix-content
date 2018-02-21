CREATE KEYSPACE IF NOT EXISTS content_mv 
WITH replication = {
  'class': 'SimpleStrategy', 
  'replication_factor' : 3
};

CREATE TABLE IF NOT EXISTS content_mv.video (
  id UUID,
  title TEXT,
  description TEXT,
  genres FROZEN <SET<TEXT>>,
  cast SET<TEXT>,
  director TEXT,
  duration INT,
  rating TEXT,
  releaseDate TEXT,
  isOriginal BOOLEAN,
  isMovie BOOLEAN,
  locationURI TEXT,
  thumbnailURL TEXT,
  trailerURL TEXT,
  regions SET<TEXT>,
  PRIMARY KEY (id, genres)
);

CREATE INDEX video_genres ON content_mv.video (FULL(genres));

CREATE MATERIALIZED VIEW content_mv.video_by_genres
AS SELECT id, genres FROM content_mv.video
WHERE id IS NOT NULL AND genres IS NOT NULL
PRIMARY KEY (genres, id);