let player;
let socket
var firstPlay = false;
var paused = false;

function onPlayerReady(event) {
    event.target.playVideo();
    paused = false;
    socket = io(`/${id}`)
    socket.on('connect', () => {
        socket.on('pause', (message) => {
            const time = message.time
            paused = true
            player.seekTo(time)
            player.pauseVideo()
        })
        socket.on('play', (message) => {
            const time = message.time
            paused = false
            player.seekTo(time)
            player.playVideo()
        })
        socket.on('getTime', (message) => {
            socket.emit('returnTime', {
                'queryId' : message.queryId,
                'time': player.getCurrentTime()
            })
        })
        socket.on('returnTime', (message => {
            const time = message.time
            paused = false
            player.seekTo(time)
            player.playVideo()
        }))
        socket.emit('getTime', {})
    })
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PAUSED) {
        socket.emit('pause', { 
            'time': player.getCurrentTime()
        })
    } else if (event.data == YT.PlayerState.PLAYING && paused === true) {
        paused = false
        socket.emit('play', { 
            'time': player.getCurrentTime()
        })
    }
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}
