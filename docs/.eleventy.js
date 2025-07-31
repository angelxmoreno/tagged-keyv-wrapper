module.exports = (eleventyConfig) => {
    eleventyConfig.addPassthroughCopy('static');

    return {
        dir: {
            input: '.',
            includes: '_includes',
            data: '_data',
            output: '_site',
        },
        markdownTemplateEngine: 'njk',
    };
};
