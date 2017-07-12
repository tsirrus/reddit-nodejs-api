'using strict';
var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password. we will learn about hashing next week.
        the goal of hashing is to store a digested version of the password from which
        it is infeasible to recover the original password, but which can still be used
        to assess with great confidence whether a provided password is the correct one or not
         */
        return bcrypt.hash(user.password, HASH_ROUNDS)
            .then(hashedPassword => {
                return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
            })
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                // Special error handling for duplicate entry
                if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('A user with this username already exists');
                }
                else {
                    throw error;
                }
            });
    }

    createPost(post) {
        return this.conn.query(
            `
            INSERT INTO posts (userId, title, url, createdAt, updatedAt)
            VALUES (?, ?, ?, NOW(), NOW())`,
            [post.userId, post.title, post.url]
        )
        .then(result => {
            return result.insertId;
        });
    }

    createSubreddit(subreddit) {
        return this.conn.query(
            `
            INSERT INTO subreddits(name, description, createdAt, updatedAt)
            VALUES (?, ?, NOW(), NOW())`,
            [subreddit.name, subreddit.description]
        )
        .then(result => {
            return result.insertId;
        })
        .catch(error => {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('A subreddit with this name already exists');
            }
            else {
                throw error;
            }
        });
    }
    
    createVote(vote) {
        //Need to complete logic to validate voteDirection value
        return this.conn.query(
            `INSERT INTO votes (userId, postId, voteDirection, createdAt, updatedAt)
            VALUES (?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE voteDirection=?, updatedAt=NOW()
            `,[vote.userId, vote.postId, vote.voteDirection]
            );
    }
    
    getAllPosts() {
        /*
        strings delimited with ` are an ES2015 feature called "template strings".
        they are more powerful than what we are using them for here. one feature of
        template strings is that you can write them on multiple lines. if you try to
        skip a line in a single- or double-quoted string, you would get a syntax error.

        therefore template strings make it very easy to write SQL queries that span multiple
        lines without having to manually split the string line by line.
         */
        return this.conn.query(
            `
            SELECT p.id, p.title, p.url, p.userId, p.createdAt, p.updatedAt, u.username, u.createdAt AS userCreatedAt, u.updatedAt AS userUpdatedAt
            FROM posts p
            JOIN users u ON p.userId = u.id
            ORDER BY p.createdAt DESC
            LIMIT 25`
        )
        // Map the denormalized info into postObject(userObject) as requested
        .then(result => {
            return result.map(function(post) {
                return {
                    id: post.id,
                    title: post.title,
                    url: post.url,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                    user: {
                        id: post.userId,
                        createdAd: post.userCreatedAt,
                        updatedAt: post.userUpdatedAt
                    }
                };
            });
        });
    }

    getAllSubreddits() {
        
    }
}

module.exports = RedditAPI;