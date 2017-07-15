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
    // =========================================================================
    // Function to flatten and clean reddit comment structure
    // =========================================================================
    function formatComment(redditComment, currentArray = []) {
        //When called from the main code, the currentArray will not be provided
        //currentArray is only used for the recursive loop to aggregate the final result
        
        //Set initial arrays
        let redditCommentArray = [];
        let redditReplyArray = []; //Reply array
        
        // === Foreplay sanity check ===
        if (redditComment === undefined) {
            // Failsafe
            //console.log("Entered UNDEFINED", currentArray); //Test
            return currentArray;
        }
        else if (Object.prototype.toString.call( redditComment ) === '[object Array]') {

            //console.log("Entered IF"); //Test
            if (redditComment.length === 0)
            {
                return currentArray;
            }
            redditCommentArray = redditComment;
        }
        else {
            //console.log("Entered ELSE"); //Test
            redditCommentArray.push(redditComment);
        }
        // === End of sanity check ===
        
        //console.log("REDDIT!!!!",redditCommentArray); //Test
        //Clean the current level of comments
        let formattedComment = redditCommentArray.map(currentReddit => {
            //console.log("Current Reddit MAP", currentReddit); //Test
            var commentItem = {
                commentRedditId: currentReddit.name,
                commentParentRedditId: currentReddit.parent_id,
                postRedditId: currentReddit.link_id,
                author: currentReddit.author,
                body: currentReddit.body,
                depth: currentReddit.depth,
                subreddit: currentReddit.subreddit
            };

            // Check for the current comment if there are any replies
            if (currentReddit.replies !== undefined && currentReddit.replies !== '') {
                //console.log('======================================================'); //Test delimiter
                //console.log("Comment replies child",currentReddit.replies.data.children); //Test
                
                //There are replies. Load the reply array
                var repliesChildren = currentReddit.replies.data.children;
                for (let i in repliesChildren) {
                    redditReplyArray.push(repliesChildren[i].data);
                }
            }
            // Return the current formatted comment to the map
            return commentItem;
        });
        
        // Load the current level of formatted comments to the main array (the currentArray)
        for (let i in formattedComment) {
            currentArray.push(formattedComment[i]);
        }

        //Logging info
        //console.log("Reddit Reply Array Size", redditReplyArray.length);
        //console.log("Current Array SIZE", currentArray.length);
        //console.log('======================================================');
        //console.log("Current Array", currentArray);
        
        // Exit logic
        if (redditReplyArray.length > 0) {
            //There is a lower level of replies, need to process that level
            return formatComment(redditReplyArray, currentArray);
        }
        else {
            //There are no replies at a lower level. The comment structure is complete
            return currentArray;
        }

    }
    
    // =========================================================================
    // =========================================================================
    // The reddit crawling code
    // =========================================================================
    // =========================================================================
    
    return request('https://www.reddit.com/' + postPermanentLink + '/.json')
    .then(response => {
        // Parse the response as JSON and store in variable called result
        var result = JSON.parse(response);
        //console.log(result); //Test
        
        var childArray = result.map(item => {
            return item.data.children;
        });
        
        // ----- Get raw information for the comments -----
        // t3 is the parent post, the comments are in t1
        var childCommentArray = childArray.filter(child => {
            return child[0].kind === 't1';
        });
        //console.log("child array=",childArray); //Test
        
        //Get the entire comment structure
        var commentArray = childCommentArray[0].map(filteredChild => {
            return filteredChild.data;
        });

        //Format and flatten reddit comment structure for DB insert
        var formattedArray = formatComment(commentArray);
        console.log("Formatted Array:",formattedArray); //Test
        //Return result
        return formattedArray;
    });
}

getCommentsForPost('r/thatHappened/comments/6ncbvu/drug_addict_returns_stolen_money_after_5_years/'); //Test

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