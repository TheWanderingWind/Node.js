const express = require('express');
const session = require('express-session');
const app = express();
const ejs = require('ejs');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.json()); // Обробка JSON-даних
app.use(express.urlencoded({ extended: true })); // Обробка URL-кодованих даних
// Налаштування сесій
app.use(session({
  secret: 'secret-keyed', // Секретний ключ для підпису сесійного ідентифікатора
  resave: false,
  saveUninitialized: false
}));

// Змінна для зберігання списку черг
let queues = [];

// Обробка запиту головної сторінки
app.get('/', (req, res) => {
  res.render('mainPage', { queues: queues });
});

// Запит для створення нової черги
app.post('/create', (req, res) => {
  // Отримання даних від клієнта
  const hostName = req.body.userName;
  const hostId = req.session.id;
  const queueName = `Черга ${hostName}`;

  // Створення нового об'єкта черги
  const newQueue = {
    id: queues.length,
    queueName: queueName,
    hostName: hostName,
    hostId: hostId,
    participants: [],
    nextInQueue: null,
    participantsOut: []
  };

  // Додавання черги до списку черг
  queues.push(newQueue);

  // Відправка відповіді з даними нової черги
  res.send({data:newQueue});
});

// Запит для приєднання до черги
app.get('/queue/:id', (req, res) => {
  // Отримання ідентифікатора черги з URL-параметра
  const queueId = parseInt(req.params.id);

  // Отримання ідентифікатора сесії
  let sessionId
  if (!req.query.sessionId) {
    sessionId = req.session.id;
  } else {
    sessionId = req.query.sessionId;
  }  
  // Отримання імені користувача з запиту
  const userName = req.query.name;

  // Знаходження черги за її ідентифікатором
  const queue = queues.find(q => q.id === queueId);
  // Перевірка, чи черга існує
  if (!queue) {
    res.status(404).send('Queue not found');
    return;
  }

  // Перевірка, чи користувач є хостом черги
  const isHost = queue.hostId === sessionId;
  
  // Перевірка, чи користувач є наступним в черзі
  let isNext = false
  if (!!queue.next) {
    isNext = queue.next.sessionId === sessionId;
  }

  const isOut = queue.participantsOut.some(p => p.sessionId === sessionId);

  let isParticipantJoined = false;
  if (!isHost && !isNext && !isOut) {
    // Перевірка, чи учасник уже приєднаний до черги
    isParticipantJoined = queue.participants.some(p => p.sessionId === sessionId);

    // Якщо учасник не приєднаний, додати його до черги
    if (!isParticipantJoined) {
      const newParticipant = {
        sessionId: sessionId,
        name: userName,
        position: queue.participants.length + 1
      };
      queue.participants.push(newParticipant);
    }
  }

  const participant = queue.participants.find(q => q.sessionId === sessionId);

  // Формування даних для відправки на сторінку черги
  let data = {
    isHost: isHost,
    isNext: isNext,
    isOut: isOut,
    queueName: queue.queueName,
    queueId: queue.id,
    hostName: queue.hostName,
    sessionId: sessionId,
  };
  if (isHost) {
    data.participants = queue.participants;
  } else {
    if (isNext) {
      data.position = queue.next.position;
      data.clientName = queue.next.name;
    } else {
      data.position = participant.position;
      data.clientName = participant.name;
    }
  }

  //console.log(`(/queue/${queue.id}) Send Data: `, data)
  // Відправка сторінки queuePage.ejs з даними черги та користувача
  res.render('queuePage', data);
});

// Запит для оновлення списку черг
app.post('/update', (req, res) => {
  const data = {
    queues: queues,
  };
  res.json(data);
});

// Запит для оновлення черги
app.post('/queue/:id/update', (req, res) => {
  // Отримання ідентифікатора черги з URL-параметра
  const queueId = parseInt(req.params.id);

  // Отримання ідентифікатора сесії
  let sessionId
  if (!req.body.sessionId) {
    sessionId = req.session.id;
  } else {
    sessionId = req.body.sessionId;
  }  

  // Знаходження черги за її ідентифікатором
  const queue = queues.find(q => q.id === queueId);

  // Перевірка, чи черга існує
  if (!queue) {
    res.status(404).send('Queue not found');
    return;
  }

  // Перевірка, чи користувач є хостом черги
  const isHost = queue.hostId === sessionId;

  // Перевірка, чи користувач є наступним в черзі
  let isNext = false
  if (!!queue.next) {
    isNext = queue.next.sessionId === sessionId;
  }

  let isOut = false;
  if (queue.participantsOut.length > 0) {
    //console.log("queue.Out:", queue.participantsOut)
    //console.log("sessionId:", sessionId)
    isOut = queue.participantsOut.some(p => p.sessionId == sessionId);
    //console.log("isOut:", isOut)
  }

  // Перевірка, чи користувач є учасником черги
  const participant = queue.participants.find(p => p.sessionId === sessionId);
  //console.log("queue: ", queue)
  //console.log("participant: ", participant)
  //console.log("isHost: ", isHost)
  //console.log("sessionId: ", sessionId)

  // Формування даних для відправки на сторінку черги
  let data = {
    isHost: isHost,
    isNext: isNext,
    isOut: isOut,
    queueName: queue.queueName,
    queueId: queue.id,
    hostName: queue.hostName,
    sessionId: sessionId,
  };
  if (isHost) {
    data.participants = queue.participants;
    data.next = queue.next;
  } else {
    if (isNext && !isOut) {
      data.position = queue.next.position;
      data.clientName = queue.next.name;
    } else if (!isOut) {
      data.position = participant.position;
      data.clientName = participant.name;
    }
  }

  //console.log(`(/queue/${queue.id}/update) Send Data: `, data)

  res.json(data);
});

app.post('/queue/:id/next', (req, res) => {
  // Отримання ідентифікатора черги з URL-параметра
  const queueId = parseInt(req.params.id);

  // Знаходження черги за її ідентифікатором
  const queue = queues.find(q => q.id === queueId);

  // Перевірка, чи черга існує
  if (!queue) {
    res.status(404).send('Queue not found');
    //console.log("out 404");
    return;
  }

  //console.log("client id:", req.body.sessionId);
  //console.log("host id:", queue.hostId);

  // Перевірка, чи користувач є хостом черги
  const isHost = queue.hostId === req.body.sessionId;
  //console.log("isHost:", isHost);
  if (!isHost) {
    res.status(403).send('Only the host can perform this action');
    //console.log("out 403");
    return;
  }

  // Перевірка, чи є учасники в черзі
  if (queue.participants.length === 0) {
    if (!!queue.next) {
      queue.participantsOut.push(queue.next);
    }
    queue.next = null;
    res.json({});
    //console.log("out null");
    return;
  }

  for (let i=0; i < queue.participants.length; i++) {
    queue.participants[i].position -= 1;
  }

  if (!!queue.next) {
    queue.participantsOut.push(queue.next);
  }
  // Видалення першого учасника зі списку та вставлення його у поле 'next'
  queue.next = queue.participants.shift();
  //console.log('next', queue.next)

  res.json({});
  //console.log("out 0");
});

// Маршрут для зміни назви черги
app.post('/queue/:id/change', (req, res) => {
  const queueId = parseInt(req.params.id);

  // Отримання ідентифікатора сесії та нової назви черги з тіла запиту
  const sessionId = req.body.sessionId;
  const newQueueName = req.body.queueName;

  const queue = queues.find(p => p.id === queueId);

  // Здійснення перевірки, чи користувач є хостом
  const isHost = queue.hostId === sessionId; // Потрібно використовувати вашу власну логіку для отримання даних черги

  if (isHost) {
    // Зміна назви черги
    queue.queueName = newQueueName; // Потрібно використовувати вашу власну логіку для зміни назви черги

    // Відсилання успішної відповіді
    res.status(200).end();
  } else {
    // Відсилання помилки доступу
    res.status(403).end();
  }
});

// Запуск сервера
app.listen(3000, () => {
  console.log('Сервер запущений на порті 3000');
});
