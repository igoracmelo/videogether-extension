const newStatus = (video) => {
  return {
    timestamp: new Date().getTime(),
    paused: video.paused,
    currentTime: video.currentTime
  }
}

const updateCurrentTime = (newTime) => {
  lastUpdate = new Date()
  const delta = Math.abs(video.currentTime - newTime)
  if (delta >= 0.50) {
    video.currentTime = newTime
  }
}

const timeUpdate = () => {
  const now = new Date()
  if (now - lastUpdate > 5_000) {
    console.log('5 seg sem atividad')
    socket.emit('timeupdated', video.currentTime)
    lastUpdate = new Date()
  }
}

let interval
let video

const cleanup = () => {
  if (video) {
    video.removeEventListener('pause', sendCurrentStatus)
    video.removeEventListener('play', sendCurrentStatus)
    video.removeEventListener('seeked', sendCurrentStatus)
    video.removeEventListener('timeupdate', throttledSendCurrentStatus)
  }

  clearInterval(interval)
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  cleanup()

  if (req === 'startHost') {
    const socket = io.connect('{{SOCKET_SERVER}}')

    socket.on('connect', () => {
      console.log('[HOST] connected');
    })

    video = document.querySelector('video')
    if (!video) {
      alert('No video found')
    }

    let lastUpdate = 0

    socket.emit('set-enable-relay', true)

    const sendCurrentStatus = () => {
      if (!video) {
        console.log('[HOST] no video. Click to host again', status)
        cleanup()
      }
      lastUpdate = new Date().getTime()
      const status = newStatus(video)
      socket.emit('update-status', status)
      console.log('[HOST] update-status', status)
    }

    const throttledSendCurrentStatus = () => {
      const now = new Date().getTime()

      if (now - lastUpdate > 5_000) {
        sendCurrentStatus()
      }
    }

    interval = setInterval(throttledSendCurrentStatus, 2_000);

    video.addEventListener('pause', sendCurrentStatus)
    video.addEventListener('play', sendCurrentStatus)
    video.addEventListener('seeked', sendCurrentStatus)
    video.addEventListener('timeupdate', throttledSendCurrentStatus)
  } else if (req === 'startClient'){
    const socket = io.connect('{{SOCKET_SERVER}}')

    socket.on('connect', () => {
      console.log('[CLIENT] connected');
    })

    video = document.querySelector('video')
    if (!video) {
      alert('No video found')
    }

    socket.on('update-status', async (status) => {
      if (!video) {
        console.log('[CLIENT] no video. Click to connect again', status)
        cleanup()
      }

      console.log('[CLIENT] update-status', status)

      const now = new Date()
      const delayToGetHere = (now - status.timestamp) / 1000

      // ignore events that are too old
      if (delayToGetHere > 1) {
        return
      }

      let hisCurrentTimeNow = status.currentTime

      // if its not paused, add delay
      if (!status.paused && status.paused === video.paused) {
        hisCurrentTimeNow += delayToGetHere
      }

      const delta = Math.abs(hisCurrentTimeNow - video.currentTime)

      if (delta >= 0.50) {
        video.currentTime = hisCurrentTimeNow
      }

      if (status.paused) {
        video.pause()
      } else {
        await video.play()
      }
    })
  } else if (req === 'stopHost') {
    socket.emit('set-enable-relay', false)
  }
})
