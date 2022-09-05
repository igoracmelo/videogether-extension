let started = false

document.addEventListener('DOMContentLoaded', () => {
  const btnStartHost = document.getElementById('btn-start-host')
  const btnConnect = document.getElementById('btn-connect')

  btnStartHost.addEventListener('click', () => {
    chrome.tabs.query({ currentWindow: true, active: true }, ([tab]) => {
      if (!started) {
        chrome.tabs.sendMessage(tab.id, 'startHost')
      } else {
        chrome.tabs.sendMessage(tab.id, 'stopHost')
      }
      started = !started
      btnStartHost.innerText = started ? 'Stop Host' : 'Start Host'
    })
  })

  btnConnect.addEventListener('click', () => {
    chrome.tabs.query({ currentWindow: true, active: true }, ([tab]) => {
      if (!started) {
        chrome.tabs.sendMessage(tab.id, 'startClient')
        started = true
        btnConnect.innerText = 'Connected'
      }
    })
  })
})
