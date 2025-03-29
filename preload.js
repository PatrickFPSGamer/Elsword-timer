const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    loadCombos: () => ipcRenderer.invoke('load-combos'),
    saveCombo: (combo) => ipcRenderer.invoke('save-combo', combo),
    openList: () => ipcRenderer.invoke('open-list')
})
