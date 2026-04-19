const { marked } = require('marked');
const katexExtension = require('marked-katex-extension');
marked.use(katexExtension());
/**
 *  Markdown转HTML
 * @param {string} md
 * @param {object} options
 */
module.exports = function (md, options = {}) {
    if (md) {
        return marked(md, options);
    }
}