const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')

let mainWindow = null;
let listWindow = null;

// Function to get the combos file path
function getCombosFilePath() {
  const combosDir = path.join(__dirname, 'combos')
  console.log('Combos directory:', combosDir); // Debug log
  if (!fs.existsSync(combosDir)) {
    console.log('Creating combos directory...'); // Debug log
    fs.mkdirSync(combosDir)
  }
  const filePath = path.join(combosDir, 'combos.json')
  console.log('Combos file path:', filePath); // Debug log
  return filePath
}

// Function to read existing combos
function readCombos() {
  const filePath = getCombosFilePath()
  try {
    console.log('Checking if file exists:', fs.existsSync(filePath)); // Debug log
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      console.log('File content:', data); // Debug log
      return JSON.parse(data)
    }
    console.log('No combos file found, returning empty array'); // Debug log
    return []
  } catch (error) {
    console.error('Error reading combos:', error)
    return []
  }
}

// Function to save combos
function saveCombos(combos) {
  const filePath = getCombosFilePath()
  try {
    console.log('Saving combos to:', filePath); // Debug log
    fs.writeFileSync(filePath, JSON.stringify(combos, null, 2))
    console.log('Combos saved successfully'); // Debug log
  } catch (error) {
    console.error('Error saving combos:', error)
    throw error
  }
}

// Register IPC handlers
ipcMain.handle('load-combos', async () => {
  try {
    console.log('Loading combos...'); // Debug log
    const combos = readCombos()
    console.log('Loaded combos:', combos); // Debug log
    return { success: true, combos }
  } catch (error) {
    console.error('Error loading combos:', error)
    return { success: false, message: 'Failed to load combos' }
  }
})

ipcMain.handle('save-combo', async (event, combo) => {
  try {
    console.log('Saving new combo:', combo); // Debug log
    const combos = readCombos()
    combos.push(combo)
    saveCombos(combos)
    return { success: true, message: 'Combo saved successfully' }
  } catch (error) {
    console.error('Error saving combo:', error)
    return { success: false, message: 'Failed to save combo' }
  }
})

ipcMain.handle('open-list', async () => {
  try {
    if (listWindow) {
      listWindow.focus()
      return { success: true }
    }

    listWindow = new BrowserWindow({
      width: 300,
      height: 400,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })

    await listWindow.loadFile('list.html')
    
    listWindow.on('closed', () => {
      listWindow = null
    })

    return { success: true }
  } catch (error) {
    console.error('Error opening list page:', error)
    return { success: false, message: 'Failed to open list page' }
  }
})

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})