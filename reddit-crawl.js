var request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');

function getSubreddits() {
    return request('https://www.reddit.com/subreddits.json?limit=50') // default limit is 25, this gives us more data!!
        .then(result => {
            // Parse the result as JSON
            result = JSON.parse(result);

            // Reddit gives us too much data. We just need a list of subreddit names
            return result.data.children
                .map(item => {
                    return item.display_name;
                });
        });
}

function getPostsForSubreddit(subredditName) {
    // Some of the code has been provided for you. Fill in the blanks!

    return request(/* url based on the subredditName */)
        .then(result => {
            result = JSON.parse(result);

            // Reddit includes selfposts in the result so we will filter them, and only return the required data
            return result.data.children
                .filter(item => {
                    // return true if the current item is not a self post
                })
                .map(item => {
                    // return an object with only title, url, user
                });
        });
}

function crawl() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'ziad_saab', // CHANGE THIS :)
        password : '',
        database: 'reddit',
        connectionLimit: 10
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);

    // This object will be used as a dictionary from usernames to user IDs
    var users = {};

    // This object will be used as a dictionary from subreddit names to subreddit IDs
    var subreddits = {};

    /*
    Crawling will go as follows:

        1. Get a list of all subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post
     */

    getSubreddits()
        .then(subredditNames => {

        })
}