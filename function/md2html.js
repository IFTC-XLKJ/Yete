const { marked } = require('marked');
module.exports = function (md) {
    if (md) {
        return marked(md);
    }
}