const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

// Configure marked to use highlight.js for code blocks
marked.setOptions({
  gfm: true,
  breaks: false,
  smartypants: true,
  highlight: function (code, lang) {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch (e) {
      // Fallback to escaped code if highlighting fails
      return code;
    }
  },
});

async function getTodoHtml() {
  try {
    const todoPath = path.join(__dirname, '..', '..', 'docs', 'TODO.md');
    const md = await fs.readFile(todoPath, { encoding: 'utf8' });
    // Convert markdown to HTML (marked will apply highlight.js to code blocks)
    const html = marked.parse(md || '');
    return html;
  } catch (err) {
    console.error('Error reading TODO.md:', err && err.message ? err.message : err);
    return '<p style="color:darkred">Unable to load TODO.md</p>';
  }
}

module.exports = {
  getTodoHtml,
};
