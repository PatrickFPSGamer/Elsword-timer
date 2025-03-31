const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')
const timerConfig = require('./timerCooldown.js')

let mainWindow = null;
let listWindow = null;

// Function to get the combos file path
function getCombosFilePath() {
  const combosDir = path.join(__dirname, 'combos')
  console.log('Combos directory:', combosDir);
  if (!fs.existsSync(combosDir)) {
    console.log('Creating combos directory...');
    fs.mkdirSync(combosDir)
  }
  const filePath = path.join(combosDir, 'combos.json')
  console.log('Combos file path:', filePath);
  return filePath
}

// Function to read existing combos
function readCombos() {
  const filePath = getCombosFilePath()
  try {
    console.log('Checking if file exists:', fs.existsSync(filePath));
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      console.log('File content:', data);
      return JSON.parse(data)
    }
    console.log('No combos file found, returning empty array');
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
    console.log('Saving combos to:', filePath);
    fs.writeFileSync(filePath, JSON.stringify(combos, null, 2))
    console.log('Combos saved successfully');
  } catch (error) {
    console.error('Error saving combos:', error)
    throw error
  }
}

// Function to delete timer config
function deleteTimerConfig(title) {
  try {
    const configs = timerConfig.getAllTimers();
    const filteredConfigs = configs.filter(config => 
      config.id !== title.toLowerCase().replace(/\s+/g, '_')
    );
    return timerConfig.saveConfig(filteredConfigs);
  } catch (error) {
    console.error('Error deleting timer config:', error);
    return false;
  }
}

// Register IPC handlers
ipcMain.handle('load-combos', async () => {
  try {
    console.log('Loading combos...');
    const combos = readCombos()
    console.log('Loaded combos:', combos);
    return { success: true, combos }
  } catch (error) {
    console.error('Error loading combos:', error)
    return { success: false, message: 'Failed to load combos' }
  }
})

ipcMain.handle('focus-window', async () => {
  try {
    if (mainWindow) {
      mainWindow.focus();
      return { success: true };
    }
    return { success: false, message: 'Main window not found' };
  } catch (error) {
    console.error('Error focusing window:', error);
    return { success: false, message: 'Failed to focus window' };
  }
});

ipcMain.handle('save-custom-timer', async (event, { title, cooldown, buff }) => {
  try {
    console.log('Saving custom timer:', { title, cooldown, buff });
    const success = timerConfig.addCustomTimer(title, cooldown, buff);
    if (!success) {
      throw new Error('Failed to save custom timer configuration');
    }
    return { success: true, message: 'Custom timer saved successfully' };
  } catch (error) {
    console.error('Error saving custom timer:', error);
    return { success: false, message: 'Failed to save custom timer' };
  }
});

ipcMain.handle('delete-combo', async (event, combo) => {
  try {
    console.log('Deleting combo:', combo);
    const combos = readCombos();
    const filteredCombos = combos.filter(c => c.name !== combo.name);
    saveCombos(filteredCombos);

    // If this is a custom timer, also delete it from timerCooldown.json
    if (combo.title !== 'Freed Shadow' && combo.title !== 'Concerto') {
      const success = timerConfig.deleteTimerConfig(combo.title);
      if (!success) {
        console.warn('Failed to delete timer config for:', combo.title);
      }
    }

    return { success: true, message: 'Combo deleted successfully' };
  } catch (error) {
    console.error('Error deleting combo:', error);
    return { success: false, message: 'Failed to delete combo' };
  }
});

ipcMain.handle('save-combo', async (event, combo) => {
  try {
    console.log('Saving new combo:', combo);
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
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: true
      }
    })

    await listWindow.loadFile('list.html')
    
    // Remove DevTools opening
    // listWindow.webContents.openDevTools();
    
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
  console.log('Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})