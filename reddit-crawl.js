'use strict';
var request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');

function getSubreddits() {
    return request('https://www.reddit.com/.json')
        .then(response => {
            // Parse response as JSON and store in variable called result
            var result = JSON.parse(response); // continue this line

            // Use .map to return a list of subreddit names (strings) only
            return result.data.children.map(function (child) {
                //console.log(child.data.subreddit); //Test
                return child.data.subreddit;
            });
        });
}

//getSubreddits(); //Test

function getPostsForSubreddit(subredditName) {
    return request('https://www.reddit.com/r/' + subredditName + '/.json')
    .then(response => {
        // Parse the response as JSON and store in variable called result
        var result = JSON.parse(response); // continue this line

        //console.log(result.data.children); //Test
        return result.data.children
            .filter(function(child) {
                //console.log(child.data.is_self); //Test
                return child.data.is_self !== true;
            }) // Use .filter to remove self-posts
            .map(function(filteredChild) {
                //console.log("ChildTitle=" + filteredChild.data.title + " User=" + filteredChild.data.author);
                //console.log("URL=" + filteredChild.data.url);
                //console.log(filteredChild); //Test
                return {
                    title: filteredChild.data.title,
                    url: filteredChild.data.url,
                    user: filteredChild.data.author,
                    redditName: filteredChild.data.name,
                    subreddit: filteredChild.data.subreddit,
                    permanentLink: filteredChild.data.permalink,
                    commentCount: filteredChild.data.num_comments
                };
            }); // Use .map to return title/url/user objects only
        }
    );
}

//getPostsForSubreddit('thatHappened'); //Test

function getCommentsForPost(postPermanentLink) {
    return request('https://www.reddit.com/' + postPermanentLink + '/.json')
    .then(response => {
        // Parse the response as JSON and store in variable called result
        var result = JSON.parse(response); // continue this line
        //console.log(result); //Test
        
        var childArray = result.map(item => {
            return item.data.children;
        });
        
        // ----- Get information for the comments -----
        var childCommentArray = childArray.filter(child => {
            return child[0].kind === 't1';
        });
        //console.log("child array=",childArray); //Test
        var commentArray = childCommentArray[0].map(filteredChild => {
            return filteredChild.data;
        });
        //console.log("comment array=",commentArray); //Test
        return commentArray.map(comment => {
            return {
                postRedditId: comment.parentId,
                commentRedditId: comment.id,
                author: comment.author,
                body: comment.body,
                depth: comment.depth,
                replies: comment.replies,
                subreddit: comment.subreddit
            };
        });
    });
}

//getCommentsForPost('r/thatHappened/comments/6n46lk/14_year_old_history_buff_brilliantly_teaches'); //Test

function crawl() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database: 'reddit',
        connectionLimit: 10
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);

    // This object will be used as a dictionary from usernames to user IDs
    var users = {};

    /*
    Crawling will go as follows:

        1. Get a list of popular subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post if it doesn't exist
                2. Create the post using the subreddit Id, userId, title and url
     */

    // Get a list of subreddits
    getSubreddits()
    .then(subredditNames => {
        subredditNames.forEach(subredditName => {
            var subId;
            myReddit.createSubreddit({name: subredditName})
            .then(subredditId => {
                subId = subredditId;
                return getPostsForSubreddit(subredditName);
            })
            .then(posts => {
                posts.forEach(post => {
                    console.log(post);
                    var userIdPromise;
                    if (users[post.user]) {
                        userIdPromise = Promise.resolve(users[post.user]);
                    }
                    else {
                        userIdPromise = myReddit.createUser({
                            username: post.user,
                            password: 'abc123'
                    })
                    .catch(function(err) {
                            return users[post.user];
                        });
                    }

                    userIdPromise.then(userId => {
                        users[post.user] = userId;
                        return myReddit.createPost({
                            redditName: post.redditName,
                            subredditId: subId,
                            userId: userId,
                            title: post.title,
                            url: post.url,
                            permanentLink: post.permanentLink
                        });
                    });
                });
            });
        });
    })
    //.then(function () {connection.end();});
    
}

//crawl();
/*
function crawlForComments() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database: 'reddit',
        connectionLimit: 10
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);
    
    // Plan!!!
    // 1-Get all info from db (subreddit, posts, users)
    //just need posts, comments don't care about subreddits, they are associated with a post
    
    // 2-For each subreddit, get all posts from reddit
    
    // 3-For all posts:
    // 3.a-Check if post exists in db. (If not, create it?)
    // 3.b-Get comments from posts with comments
    
    // 4-Parse the comment tree (ie: flatline)
    // 5-Create missing users?
    // 6-Create comments
    
    //Fetch all data we currently have in database
    return Promise.all([myReddit.getAllSubreddits(),myReddit.getAllPosts(),myReddit.getAllUsers()])
    .then(dbData => {
        // dbData[0] = subreddits
        // dbData[1] = posts
        // dbData[2] = users
        console.log(dbData);
        var newPostArray = [];
        var newUserArray = [];
        
        return dbData[0].map(subreddit => {
            return getPostsForSubreddit(subreddit.name)
            .catch(error => {
            console.log(dbData[0]);
            })
        })
        
        //Filter out the posts without comments
        .then(redditPostArray => {
            return redditPostArray.filter(post => {
                return post.commentCount > 0;
            });
        })
        
        //Identify new posts and enrich existing ones
        .then(redditFilteredPostArray => {
            for (var j in redditFilteredPostArray) {
                var flagNewPost = true;
                for (var i in dbData[1]) {
                    if (dbData[1][i].title === redditFilteredPostArray[j].title) {
                        flagNewPost = false;
                        dbData[1][i].permalink = redditFilteredPostArray[j].permalink;
                        dbData[1][i].redditId = redditFilteredPostArray[j].redditId;
                        dbData[1][i].subreddit = redditFilteredPostArray[j].subreddit;
                    }
                }
                if (flagNewPost) {
                    newPostArray.push(redditFilteredPostArray[j]);
                }
            }
            return redditFilteredPostArray;
        })
        //Identify new users
        .then(redditFilteredPostArray => {
            console.log(redditFilteredPostArray);
        });
    })
    .catch(error => {
        console.log(error);
    });
}
*/
//crawlForComments();