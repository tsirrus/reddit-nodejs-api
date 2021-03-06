'use strict';
// load the mysql library
var mysql = require('promise-mysql');

// create a connection to our Cloud9 server
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'tsirrus',
    password : '',
    database: 'reddit',
    connectionLimit: 10
});

// load our API and pass it the connection
var RedditAPI = require('./reddit');

var myReddit = new RedditAPI(connection);


// We call this function to create a new user to test our API
// The function will return the newly created user's ID in the callback
/*
myReddit.createUser({
    username: 'Test',
    password: 'Test'
    })
    .then(newUserId => {
        // Now that we have a user ID, we can use it to create a new post
        // Each post should be associated with a user ID
        console.log('New user created! ID=' + newUserId);

        return myReddit.createPost({
            title: 'Hello Reddit! This is my first post',
            url: 'http://www.digg.com',
            userId: newUserId
        });
    })
    .then(newPostId => {
        // If we reach that part of the code, then we have a new post. We can print the ID
        console.log('New post created! ID=' + newPostId);
        //Return something?
        //return true;
    })
    //.then(myReddit.closeConnection(connection));
    .then(function() {return connection.end()})
    .catch(error => {
        console.log(error.stack);
        //Return something?
        //return false;
    })
    .then(function() {return connection.end()});
*/

//Return result of getAllPosts()
/*
myReddit.getAllPosts()
.then(function (result) {console.log(result);})
.then(function () {return connection.end()});
*/

//Test insert into subreddits
/*
var test = {
    name : "blah test",
    description: "blah test desc"
};

myReddit.createSubreddit(test)
.then(function (result) {
    console.log(result);
})
.then(function() {return connection.end()})
.catch(error => { console.log(error);
})
.then(function() {return connection.end()});
*/

//Return all subreddits
/*
myReddit.getAllSubreddits()
.then(function (result) {console.log(result);})
.then(function() {return connection.end()})
.catch(error => { console.log(error);
})
.then(function() {return connection.end()});
*/


//Testing modification to posts for subreddits
/*
myReddit.createPost({
    subredditId: 1,
    redditName: 't3_6n46lk',
    title: 'Hello Reddit! This is my first post',
    url: 'http://www.digg.com',
    permanentLink: "r/thatHappened/comments/6n46lk/14_year_old_history_buff_brilliantly_teaches/",
    userId: 1
})
.then(function (result) {console.log(result);})
.then(function() {return connection.end()})
.catch(error => { console.log(error);
})
.then(function() {return connection.end()});
*/

//Testing createVote
/*
var vote = {
    userId: 7,
    postId: 2,
    voteDirection: 1
};
myReddit.createVote(vote)
.then(function (result) {console.log(result);})
.then(function() {return connection.end()})
.catch(error => { console.log(error);
})
.then(function() {return connection.end()});
*/

//Testing createComment
/*
var comment = {
    userId: 7,
    postId: 2,
    parentId: 4,
    text: "I am a level 3 reply?"
};
myReddit.createComment(comment)
.then(function (result) {console.log(result);})
.then(function() {return connection.end()})
.catch(error => { console.log(error);
})
.then(function() {return connection.end()});
*/


//Testing getCommentsForPost
/*
myReddit.getCommentsForPost(2,4)
//.then(function (result) {console.log(result);})
.then(function(result) { console.log(JSON.stringify(result, null, " "));})
.then(function() {return connection.end()})
.catch(error => { console.log(error);})
.then(function() {return connection.end()});
*/