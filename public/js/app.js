const buttonChangeId = document.getElementById('submitChange')
const inputVideoId = document.getElementById('inputVideoId')
const socket = io(`/${id}`)
var firstPlay = false;
var paused = true;
var player;

buttonChangeId.addEventListener('click', (e) => {
    e.preventDefault()
    const newVideoId = inputVideoId.value;
    inputVideoId.value = ""
    changeVideo(newVideoId);
})

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

socket.on('returnTime', (message) => {
    const time = message.time
    paused = false
    player.seekTo(time)
    player.playVideo()
})

socket.on('changeVideo', (message) => {
    window.location.reload();
})

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

function changeVideo(videoId) {
    socket.emit('changeVideo', {
        'videoId': videoId
    })
}

function createPlayer(id) {
	player = new YT.Player('player', {
        height: '720',
        width: '1280',
        videoId: id,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onYouTubeIframeAPIReady() {
   createPlayer(videoId);
}
