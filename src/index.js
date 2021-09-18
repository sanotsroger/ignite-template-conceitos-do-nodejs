const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => {
    return user.username === username;
  });

  if (!user) {
    return response.status(400).json({ error: "User not exists." });
  }

  request.user = user;
  return next();
}

function checkExistTodoUserAccount(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  
  const todoIndex = user.todos.findIndex(todo => {
    return todo.id === id;
  });

  if (todoIndex < 0) {
    return response.status(404).json({ error: "Todo not found" });
  }

  request.todoIndex = todoIndex;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userIfExists = users.some(user => {
    return user.username === username;
  });

  if (userIfExists) {
    return response.status(400).json({ error: "User exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const todo = {
      id: uuidv4(),
      title,
      done: false, 
      deadline: new Date(deadline), 
      created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistTodoUserAccount, (request, response) => {
  const { user, todoIndex } = request;
  const { title, deadline } = request.body;

  const todo = user.todos[todoIndex] = {
    ... user.todos[todoIndex],
    ... {
      title,
      deadline
    }
  }

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistTodoUserAccount, (request, response) => {
  const { user, todoIndex } = request;

  const todo = user.todos[todoIndex] = {
    ... user.todos[todoIndex],
    ... {
      done: true
    }
  }

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistTodoUserAccount, (request, response) => {
  const { user, todoIndex } = request;
  
  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;