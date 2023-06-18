const express = require('express');
const session = require('express-session');
const app = express();
const ejs = require('ejs');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// We use session ID for identify clients
app.use(session({
  secret: 'secret-keyed',
  resave: false,
  saveUninitialized: false
}));

// Here we save all queues data
let queues = [];

// Hendler for main page
app.get('/', (req, res) => {
  res.render('mainPage', { queues: queues });
});

// Hendler for create new queue
app.post('/create', (req, res) => {
  // Get client data
  const hostName = req.body.userName;
  const hostId = req.session.id;
  const queueName = `Черга ${hostName}`;

  // create new queue
  const newQueue = {
    id: queues.length,
    queueName: queueName,
    hostName: hostName,
    hostId: hostId,
    participants: [],
    nextInQueue: null,
    participantsOut: []
  };

  queues.push(newQueue);

  // send data of new queue to Host
  res.send({data:newQueue});
});

// Event handler for join to queue
app.get('/queue/:id', (req, res) => {
  // Get id of queue
  const queueId = parseInt(req.params.id);

  // Get data client

  // Try get data of client session id
  // If client is`t Host of this queue, it have not session id
  let sessionId
  if (!req.query.sessionId) {
    sessionId = req.session.id;
  } else {
    sessionId = req.query.sessionId;
  }  

  const userName = req.query.name;

  // try find queue by id
  const queue = queues.find(q => q.id === queueId);
  if (!queue) {
    res.status(404).send('Queue not found');
    return;
  }

  // Check if client is Host
  const isHost = queue.hostId === sessionId;
  
  // Check if client is next
  // (if client is next, then it will not be in the general list)
  let isNext = false
  if (!!queue.next) {
    isNext = queue.next.sessionId === sessionId;
  }

  const isOut = queue.participantsOut.some(p => p.sessionId === sessionId);

  // Check if client in queue
  let isParticipantJoined = false;
  if (!isHost && !isNext && !isOut) {
    isParticipantJoined = queue.participants.some(p => p.sessionId === sessionId);

    // if clientn not in queue, then add it to queue
    if (!isParticipantJoined) {
      const newParticipant = {
        sessionId: sessionId,
        name: userName,
        position: queue.participants.length + 1
      };
      queue.participants.push(newParticipant);
    }
  }

  // Find client in participant list
  // (for Host and 'Next' will be null)
  const participant = queue.participants.find(q => q.sessionId === sessionId);

  // Create general data (for any client)
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
    // Data only for Host
    data.participants = queue.participants;
  } else {
    if (isNext) {
      // Data only for 'Next'
      data.position = queue.next.position;
      data.clientName = queue.next.name;
    } else {
      // Data for all other clients
      data.position = participant.position;
      data.clientName = participant.name;
    }
  }
  res.render('queuePage', data);
});

// Event handler update main page
app.post('/update', (req, res) => {
  const data = {
    queues: queues,
  };
  res.json(data);
});

// Event handler update queue page
app.post('/queue/:id/update', (req, res) => {
  // Get id of queue
  const queueId = parseInt(req.params.id);

  // Get client data
  let sessionId
  if (!req.body.sessionId) {
    sessionId = req.session.id;
  } else {
    sessionId = req.body.sessionId;
  }  

  // try find queue
  const queue = queues.find(q => q.id === queueId);
  if (!queue) {
    res.status(404).send('Queue not found');
    return;
  }

  // Check if client is Host
  const isHost = queue.hostId === sessionId;

  // Check if client is 'Next'
  let isNext = false
  if (!!queue.next) {
    isNext = queue.next.sessionId === sessionId;
  }

  // Check if client is out of queue
  let isOut = false;
  if (queue.participantsOut.length > 0) {
    isOut = queue.participantsOut.some(p => p.sessionId == sessionId);
  }

  // Find client in general list
  const participant = queue.participants.find(p => p.sessionId === sessionId);

  // Create general data
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
    // Data only for Host
    data.participants = queue.participants;
    data.next = queue.next;
  } else {
    if (isNext && !isOut) {
      // Data only for 'Next'
      data.position = queue.next.position;
      data.clientName = queue.next.name;
    } else if (!isOut) {
    // Data only for other clients
      data.position = participant.position;
      data.clientName = participant.name;
    }
  }
  res.json(data);
});

// Event handler call next participant
app.post('/queue/:id/next', (req, res) => { 
  // Get id of queue
  const queueId = parseInt(req.params.id);

  // Find queue
  const queue = queues.find(q => q.id === queueId);
  if (!queue) {
    res.status(404).send('Queue not found');
    return;
  }

  // Check if client is Host
  const isHost = queue.hostId === req.body.sessionId;
  if (!isHost) {
    res.status(403).send('Only the host can perform this action');
    return;
  }

  // Check if general list have participants
  if (queue.participants.length === 0) {
    if (!!queue.next) {
      queue.participantsOut.push(queue.next);
    }
    queue.next = null;
    res.json({});
    return;
  }

  // Decrease participants positions
  for (let i=0; i < queue.participants.length; i++) {
    queue.participants[i].position -= 1;
  }

  // if next is't null, push this participant to list of out
  if (!!queue.next) {
    queue.participantsOut.push(queue.next);
  }

  // Push from general list to next first participant in list
  queue.next = queue.participants.shift();

  res.json({});
});

// Event handler for change queue name
app.post('/queue/:id/change', (req, res) => {
  // Get queue id
  const queueId = parseInt(req.params.id);

  // Get session id
  const sessionId = req.body.sessionId;
  // New name
  const newQueueName = req.body.queueName;
  // Find queue
  const queue = queues.find(p => p.id === queueId);

  // Check if client is Host
  const isHost = queue.hostId === sessionId;

  if (isHost) {
    queue.queueName = newQueueName;
    res.status(200).end();
  } else {
    res.status(403).end();
  }
});

// Setup server
app.listen(3000, () => {
  console.log('Сервер запущений на порті 3000');
});
