const http = require('http');
const fs = require('fs');

// Create server
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    let html = '<!DOCTYPE html>\
    <html>\
    <head>\
    <meta charset="utf-8">\
    <title>Список новин</title>\
    <style>.hidden-element {background-color: hsl(50, 100%, 90%);}</style>\
    <style>.hidden {display: none;}</style>\
    <style>.bg_0 {background-color: hsl(0, 0%, 90%);}</style>\
    <style>.bg_1 {background-color: hsl(0, 0%, 80%);}</style>\
    </head>\
    <body>\
    '
    
    // Get all files path in directory
    const directoryPath = './Lab2/news';
    try {
      files = fs.readdirSync(directoryPath)
    }catch (err) {
      console.error('Error reading directory:', err);
      return;
    }

    // Gen news list
    html += '<ul class="list-container">';
    let container;
    let i = 0
    files.forEach(file => {
      container = '';
      i++

      // Reading file of news
      try {
        data = fs.readFileSync(directoryPath+'/'+file, 'utf8')
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    
      // Split lines and remove null-line
      lines = data.split('\n');
      lines = lines.filter(function(value) {
        return value !== '';
      });

      if (lines.length >= 2) {
        // first line is link to original site (have "Джерело: *link*")
        const firstLine = lines.splice(0, 1)[0].split(": ");
        // second line is name of news
        const newsName = lines.splice(0, 1)[0];

        // make name of news
        container += `<li class="bg_${i%2}"><a href="#" class="clik-elem">${newsName}</a><div class="hidden-element hidden">`;
        container += `<a href="${firstLine[1]}">${firstLine[0]}</a>`

        // make content of news
        lines.forEach(line => {
          if (line != '') {
            container += `<p>${line}</p>`
          }
        })
        container += '</div></li>';

      } else if (lines.length == 1) {
        container += `<li class="clik-elem">${lines[0]}<div class="hidden-element hidden"><p>Змісту новини нема</p></div></li>`
      }

      html += container;
    });
    html += '</ul>';

    // Add script for hidden/show news
    html += '\
    <script>\r\
    document.querySelector(".list-container").addEventListener("click", function(event) {\r\
      if (event.target.matches(".clik-elem")) {\r\
        hiddenElement = event.target.parentNode.querySelector(".hidden-element");\r\
        hiddenElement.classList.toggle("hidden");\r\
      }});\r\
    </script></body></html>'

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);

  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
});

const { spawn } = require('child_process');

// Function for setup scraper.js
function runScraper() {
  console.log("Scrap site")

  const scraperProcess = spawn('node', ['./Lab2/scraper.js']);

  scraperProcess.stderr.on('data', (data) => {
    console.error(`Scraper error: ${data}`);
  });

  scraperProcess.on('close', (code) => {
    console.log(`scraper.js exited with code ${code}`);
  });
}

// Setup scraper.js before start the server
runScraper();

// Star server
const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Setup scraper.js every minut (60000 ms)
setInterval(runScraper, 60000);
