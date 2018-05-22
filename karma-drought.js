const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const config = require('./config/config');

const r = new Snoowrap({
    userAgent: config.userAgent,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    username: config.username,
    password: config.password
});

const client = new Snoostorm(r);

const streamOptions = {
    subreddit: 'all',
    requests: 1,
    pollTime: 8000
}

const comments = client.CommentStream(streamOptions);

comments.on('comment', (comment) => {
    isKarmaFarmBot(comment)
        .then((res) => {
            console.log(res);
        });
});

function isKarmaFarmBot(comment) {
    let author = comment.author;
    let promises = [hasCommentReposts(author), hasPostReposts(author)];
    return new Promise((resolve, reject) => {
        Promise.all(promises)
        .then((isKarmaFarmBotArr) => {
            for (let i in isKarmaFarmBotArr) {
                if (isKarmaFarmBotArr[i] == true)
                    return resolve(true);
            }
            return resolve(false);
        });
    })
    
}

function hasCommentReposts(author) {
    return author.getComments()
        .then((comments) => {
            // iterate through n amount of comments
            // get submission
            // get duplicates
            let promises = [];
            for (let i = 0; i < 1; i++) {
                console.log(comments[i]);
                let submission = r.getSubmission(comments[i].link_id);
                promises.push(hasCommentRepost(comments[i].body, submission))
            }
            return Promise.all(promises);
        })
        .then((promises) => {
            for (let i in promises) {
                if (promises[i] == true)
                    return true;
            }
            return false;
        })
        .catch((err) => {
            // console.log(err);
        });
}

function hasCommentRepost(commentBody, submission) {
    return getMostUpvotedDuplicateSubmission(submission)
        .then((upvotedSubmission) => {
            if (upvotedSubmission == false)
                return false;
            
        });
}

function getMostUpvotedDuplicateSubmission(submission) {
    // console.log(submission);
    return submission.getDuplicates()
        .then((duplicates) => {
            // console.log(duplicates.comments);
            if (duplicates.comments.length == 0)
                return false;
            
            // sort descending by upvotes
            let submissions = duplicates.comments.sort((a, b) => {
                return b.ups - a.ups;
            });
            
            // console.log(duplicates.comments);
            console.log(submissions[0]);
        })
        .catch((err) => {
           console.log(err);
        })
}

function hasPostReposts(author) {
    return new Promise((resolve, reject) => {
        resolve(false);
    });
}