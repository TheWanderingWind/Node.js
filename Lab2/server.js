const http = require('http');
const fs = require('fs');

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
    
    // Зчитуємо список з файлу
    const directoryPath = './Lab2/news';
    try {
      files = fs.readdirSync(directoryPath)
    }catch (err) {
      console.error('Error reading directory:', err);
      return;
    }

    html += '<ul class="list-container">';
    let container;
    let i = 0
    files.forEach(file => {
      container = '';
      i++

      try {
        data = fs.readFileSync(directoryPath+'/'+file, 'utf8')
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    
      lines = data.split('\n');

      lines = lines.filter(function(value) {
        return value !== '';
      });

      if (lines.length >= 2) {
        const secondLine = lines.splice(1, 1)[0];
        /*
        if (secondLine == ''){
          secondLine = 'Немає назви'
        }
        */
        // Генеруємо HTML списо
        container += `<li class="bg_${i%2}"><a href="#" class="clik-elem">${secondLine}</a><div class="hidden-element hidden">`;
        
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

// Функція для запуску scraper.js
function runScraper() {
  console.log("Scrap site")

  const scraperProcess = spawn('node', ['./Lab2/scraper.js']);

  scraperProcess.stdout.on('data', (data) => {
    console.log(`Scraper output: ${data}`);
  });

  scraperProcess.stderr.on('data', (data) => {
    console.error(`Scraper error: ${data}`);
  });

  scraperProcess.on('close', (code) => {
    console.log(`Scraper process exited with code ${code}`);
  });
}

// Запуск scraper.js на початку
runScraper();

const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Запуск scraper.js кожну хвилину (60000 мс)
setInterval(runScraper, 60000);
