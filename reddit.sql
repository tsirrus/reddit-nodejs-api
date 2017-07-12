-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(60) NOT NULL, -- why 60??? ask me :)
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY username (username)
);

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) DEFAULT NULL,
  url VARCHAR(2000) DEFAULT NULL,
  userId INT DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  KEY userId (userId), -- why did we add this here? ask me :)
  CONSTRAINT validUser FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
);

-- Votes mapping table
CREATE TABLE votes (
  userId INT,
  postId INT,
  voteDirection TINYINT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (userId, postId), -- this is called a composite key because it spans multiple columns. the combination userId/postId must be unique and uniquely identifies each row of this table.
  KEY userId (userId), -- this is required for the foreign key
  KEY postId (postId), -- this is required for the foreign key
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE, -- CASCADE means also delete the votes when a user is deleted
  FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE -- CASCADE means also delete the votes when a post is deleted
);

-- Create Subreddits table
CREATE TABLE subreddits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  UNIQUE KEY name (name)
);

-- Add subredditsId to posts and foreign key constraint.
ALTER TABLE posts 
ADD COLUMN subredditId INT AFTER id,
ADD CONSTRAINT validSubredditId FOREIGN KEY (subredditId) REFERENCES subreddits(id) ON DELETE CASCADE;