const { contextBridge, ipcRenderer } = require('electron')
const { GlobalKeyboardListener } = require('node-global-key-listener')
const timerConfig = require('./timerCooldown.js')

let currentCombos = [];
let keyListener = null;

contextBridge.exposeInMainWorld('electronAPI', {
    loadCombos: () => ipcRenderer.invoke('load-combos'),
    saveCombo: (combo) => ipcRenderer.invoke('save-combo', combo),
    saveCustomTimer: (title, cooldown, buff) => ipcRenderer.invoke('save-custom-timer', { title, cooldown, buff }),
    deleteCombo: (combo) => ipcRenderer.invoke('delete-combo', combo),
    openList: () => ipcRenderer.invoke('open-list'),
    setCurrentCombos: (combos) => {
        currentCombos = combos;
        console.log('Current combos set:', currentCombos);
    },
    getCurrentCombos: () => {
        return currentCombos;
    },
    getTimerConfig: (title) => {
        const configs = timerConfig.getAllTimers();
        return configs.find(c => c.id === title.toLowerCase().replace(/\s+/g, '_'));
    },
    initializeKeyListener: (callback) => {
        if (keyListener) {
            keyListener.kill();
        }
        keyListener = new GlobalKeyboardListener();
        keyListener.addListener(callback);
        return keyListener;
    },
    killKeyListener: () => {
        if (keyListener) {
            keyListener.kill();
            keyListener = null;
        }
    }
})
