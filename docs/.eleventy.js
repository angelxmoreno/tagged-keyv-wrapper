const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

module.exports = (eleventyConfig) => {
    eleventyConfig.addPassthroughCopy('static');

    /* Markdown Overrides */
    eleventyConfig.setLibrary(
        'md',
        markdownIt({
            html: true,
            breaks: true,
            linkify: true,
        }).use(markdownItAnchor, {
            permalink: markdownItAnchor.permalink.ariaHidden({
                placement: 'before',
                class: 'header-anchor',
                symbol: '',
            }),
            level: [1, 2, 3, 4],
        })
    );

    return {
        dir: {
            input: '.',
            includes: '_includes',
            data: '_data',
            output: '_site',
        },
        markdownTemplateEngine: 'liquid',
        htmlTemplateEngine: 'liquid',
    };
};
