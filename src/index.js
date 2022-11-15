const express = require('express')
const cors = require('cors')

const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(cors())
app.use(express.json())

const users = []

function findUser(username) {
  return users.find((user) => user.username === username)
}

function verifyUuidTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const findTask = user.todos.find((task) => task.id === id);

  if (!findTask) return response.status(404).json({ error: 'Task not found!' });

  request.task = findTask;
  next();
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request?.headers

  if (!findUser(username)) {
    return response
      .status(404)
      .json({ error: 'You must provide an username!' })
  }

  next()
}

app.post('/users', (request, response) => {
  if (users?.find((user) => user.username === request.body.username)) {
    return response
      .status(400)
      .json({ error: 'This user already exists!', code: 'USER_ALREADY_EXISTS' })
  }

  const user = { id: uuidv4(), todos: [], name: request.body.name, username: request.body.username }

  users.push(user)
  return response
    .status(201)
    .json(user)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request?.headers
  const todos = findUser(username)?.todos ?? []

  return response.status(200).json(todos)
})

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request?.body
  const { username } = request?.headers
  const todo = {
    id: uuidv4(),
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
    title,
  }

  users.forEach((user) => {
    if (user.username === username) {
      user.todos.push(todo)
    }
  })

  return response.status(201).json(todo)
})

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request?.headers
  const { title, deadline } = request?.body
  const targetTodo = findUser(username)?.todos?.find((todo) => todo.id === id)

  if (!targetTodo) {
    return response.status(404).json({ error: 'Todo not found!' })
  }

  for (const user of users) {
    if (user.username === username) {
      for (const todo of user.todos) {
        if (todo.id === id) {
          todo.title = title
          todo.deadline = deadline
        }
      }
    }
  }

  return response
    .status(200)
    .json({ ...targetTodo, title, deadline })
})

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request?.headers
  const targetTodo = findUser(username)?.todos?.find((todo) => todo.id === id)

  if (!targetTodo) {
    return response.status(404).json({ error: 'Todo not found!' })
  }

  for (const user of users) {
    if (user.username === username) {
      user.todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, done: true }
        }

        return todo
      })
    }
  }

  return response
    .status(200)
    .json({ ...targetTodo, done: true })
})

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { username } = request?.headers
  const targetTodo = findUser(username)?.todos?.find((todo) => todo.id === id)

  if (!targetTodo) {
    return response.status(404).json({ error: 'Todo not found!' })
  }

  for (const user of users) {
    if (user.username === username) {
      user.todos = user.todos.filter((todo) => todo.id !== id)
    }
  }

  return response.status(204).send()
})

module.exports = app