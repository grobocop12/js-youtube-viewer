const express = require('express')
const bodyParser = require('body-parser')
const socketio = require('socket.io')
const { v4: uuid } = require('uuid')

const app = express()
const expressServer = app.listen(8080)
const io = socketio(expressServer)
const namespaces = {}

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/', (req, res) => {
    const videoUrl = req.body.videoUrl
    if (videoUrl === null || videoUrl.trim() === "") {
        res.redirect('/')
    }
    const params = new URLSearchParams(videoUrl.split('?')[1])
    const v = params.get('v')
    const id = uuid()
    namespaces[id] = {
        videoId: v,
        nsp: setNamespace(id),
        numberOfViewers : 0
    }
    res.redirect(`/${id}`)
})

app.get('/:uuid', (req, res) => {
    const id = req.params.uuid
    const namespace = namespaces[id]
    if (namespace !== undefined && namespace !== null) {
        res.render('video', {
            id: id,
            videoId: namespace.videoId
        })
    } else {
        res.redirect('/')
    }
})

function setNamespace(id) {
    const nsp = io.of(`/${id}`);
    nsp.on('connection', (socket) => {
        socket.join("video-room")
        const number = nsp.adapter.rooms['video-room'].length
        console.log(number)
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
        socket.on('changeVideo', (msg) => {
            const videoUrl = msg.videoUrl
            if (videoUrl === null || videoUrl.trim() === "") {
                return
            }
            const params = new URLSearchParams(videoUrl.split('?')[1])
            const v = params.get('v')
            namespaces[id].videoId = v
            nsp.emit('changeVideo', msg)
        })
        socket.on('disconnect', () => {
            nsp.to('video-room').emit('updateCounter', {
                value: nsp.adapter.rooms['video-room'].length
            })
        })
        nsp.to('video-room').emit('updateCounter', {
            value: nsp.adapter.rooms['video-room'].length
        })
    })
    return nsp
}

