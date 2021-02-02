const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const socketio = require('socket.io')
const { v4: uuid } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))
const expressServer = app.listen(8080)
const io = socketio(expressServer)
const namespaces = {}
const rooms = {}

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/', (req, res) => {
    const videoId = req.body.videoId
    if(videoId=== null || videoId.trim() === "") {
        res.redirect('/')
    }
    const id = uuid();
    rooms[id] = {
        videoId: videoId,
        nsp: setNamespace(id)
    }
    res.redirect(`/${id}`)
})

app.get('/:uuid', (req, res) => {
    const id = req.params.uuid
    const room = rooms[id]
    if (room !== undefined) {
        res.render('video', {
            id: id,
            videoId: room.videoId
        })
    } else {
        res.redirect('/')
    }

})

function setNamespace(id) {
    const nsp = io.of(`/${id}`);
    nsp.on('connection', (socket) => {
        socket.on('pause', (msg) => {
            socket.broadcast.emit('pause', msg)
        })
        socket.on('play', (msg) => {
            socket.broadcast.emit('play', msg)
        })
        socket.on('getTime', (msg) => {
            const socketIds = Object.keys(nsp.sockets)
            const id = socketIds.find(id => id !== socket.id)
            if (id !== undefined) {
                nsp.sockets[id].emit('getTime', {
                    queryId: socket.id
                })
            } else {
                socket.emit('returnTime', { 'time': 0.0 })
            }
        })
        socket.on('returnTime', (msg) => {
            nsp.sockets[msg.queryId].emit('returnTime', msg)
        })
    })
    return nsp
}

