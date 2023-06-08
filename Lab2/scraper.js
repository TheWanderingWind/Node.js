const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Fetch html
async function scrapeWebsite(url) {
    var tem;

    tem = await fetch(url)
    .then(function (response) {
        switch (response.status) {
            // status "OK"
            case 200:
                return response.text();
            // status "Not Found"
            case 404:
                throw response;
        }
    })
    .then(function (template) {
        return template
    })
    .catch(function (response) {
        // "Not Found"
        console.log(response.statusText);
    });

    const dom = new JSDOM(tem);
    return document = dom.window.document;
}

// Save new to file
function saveNewsToFile(url, content, index) {
    const directory = path.join(__dirname, 'news');
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
  
    const filename = path.join(directory, `news_${index}.txt`);

    str = 'Джерело: '+url+'\n'
    content.forEach((item) => {
        str += item+'\n'
    });

    fs.writeFileSync(filename, str);    
  }


// Main function
async function main(max_news){

    var doc = await scrapeWebsite('https://suspilne.media/archive/')

    items = doc.getElementsByClassName('c-article-card--small-headline')

    var doc_i
    var cont_objs = []

    if (max_news > items.length) {max_news = items.length}

    for (let i = 0; i < max_news; i++) {
        var cont_text = []

        doc_i = await scrapeWebsite(items[i].href)
        cont_objs = doc_i.getElementsByClassName('pt-bd_wrp')[0].getElementsByClassName('align-left')

        for (let j=0; j < cont_objs.length; j++) {
            cont_text.push(cont_objs[j].textContent)
        }
        
        cont_text.pop()
        
        await saveNewsToFile(items[i].href, cont_text, i)
    }
}

// Setup main function
// Check only first 30 news
main(30)