let player;
const socket = io(`/${id}`)
var firstPlay = false;
var paused = true;

socket.on('pause', (message) => {
    const time = message.time
    paused = true
    player.seekTo(time)
    player.pauseVideo()
})

socket.on('play', (message) => {
    console.log('play received')
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
    console.log('return time')
    const time = message.time
    paused = false
    player.seekTo(time)
    player.playVideo()
}))

function onPlayerReady(event) {
    socket.emit('getTime', {})
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PAUSED) {
        paused = true
        socket.emit('pause', { 
            'time': player.getCurrentTime()
        })
    } else if (event.data === YT.PlayerState.PLAYING && paused === true) {
        paused = false
        socket.emit('play', { 
            'time': player.getCurrentTime()
        })
    }
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '720',
        width: '1280',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}
