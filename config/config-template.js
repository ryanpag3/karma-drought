const env = require('./environment');
const config = {
    userAgent: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
};
module.exports = config[env];