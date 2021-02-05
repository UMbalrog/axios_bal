const express = require('express')
const bodyParser = require('body-parser')
const multiparty = require('multiparty')
const fs = require('fs');
const path = require('path');

const app = express()
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
// parse application/json
app.use(bodyParser.json({ limit: '50mb' }))

app.get('/', (req, res) => {
  res.end(fs.readFileSync(path.join(__dirname, './index.html')))
})

app.post('/api/upload', (req, res) => {
  
})

app.post('/api/delete', (req, res) => {
  
})

app.listen(3000, console.log('running...'))

