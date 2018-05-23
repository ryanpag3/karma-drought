const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const Twilio = require('twilio');
const config = require('./config/config');

const twilio = new Twilio(config.twilio.account_sid, config.twilio.auth_token);

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
    requests: 25,
    pollTime: 10000
}

const comments = client.CommentStream(streamOptions);

comments.on('comment', (comment) => {
    isKarmaFarmBot(comment)
        .then((res) => {
            console.log('is karma farm bot? ' + res);
            if (res == true)
                sendAlert();
        })
        .catch((err) => {
            console.log(err);    
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
                // console.log(comments[i]);
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

/**
 * returns boolean based on whether a user's comment
 * in a particular submission is a repost of another
 * comment in a duplicate posting
 * @param {String} commentBody the comment value
 * @param {Promise} submission submission promise object
 */
function hasCommentRepost(commentBody, submission) {
    return getMostUpvotedDuplicateSubmissions(submission, 3)
        .then((upvotedSubmissions) => {
            if (upvotedSubmissions.length == 0)
                return false;
            return submissionsContainCommentRepost(commentBody, upvotedSubmissions);
        });
}


function getMostUpvotedDuplicateSubmissions(submission, amount) {
    // console.log(submission);
    return submission.getDuplicates()
        .then((duplicates) => {
            if (duplicates.comments.length == 0){
                return [];
            }

            // sort descending by upvotes
            let submissions = duplicates.comments.sort((a, b) => {
                return b.ups - a.ups;
            });
            if (submissions.length > amount)
                submissions = submissions.slice(0, amount);
            // console.log(submissions.length);
            try {
                // console.log(submissions);
                return submissions.fetchAll();
            } catch (e) {
                // suppress weird snoowrap bug
                // console.log(e);
                return [];
            }
        })
        .catch((err) => {
            console.log(err);
        })
}

function submissionsContainCommentRepost(comment, submissions) {
    let promises = [];
    submissions.forEach((submission, index, array) => {
        promises.push(submissionContainsCommentRepost(comment, submission))
    });

    return new Promise((resolve, reject) => {
        Promise.all(promises)
            .then((results) => {
                for (let i in results) {
                    if (results[i] == true)
                        return resolve(true);
                }
                resolve(false);
            })
            .catch((err) => {
                console.log(err + ' ' + err.stack);
            });
    });
}

function submissionContainsCommentRepost(comment, submission) {
    // console.log(submission);
    return submission.comments.fetchMore({
        sort: 'top',
        skipReplies: true,
        amount: 10
    })
    .then((comments) => {
        // console.log(comments);
        comments.forEach((c, index, arr) => {
            console.log('***** OG comment: ' + comment);
            console.log('***** against top dup comment: ' + c.body);
            if (comment == c.body)
                return true;
        });
        return false;
    })
    .catch((err) => {
        console.log(err);
    });
}

function hasPostReposts(author) {
    return new Promise((resolve, reject) => {
        resolve(false);
    });
}

function sendAlert() {
    twilio.messages.create({
        body: 'found karma farm bot',
        to: config.twilio.addressTo,
        from: config.twilio.addressFrom
    })
    .then((message) => console.log('sent alert'));
}