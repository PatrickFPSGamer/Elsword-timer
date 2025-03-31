const fs = require('fs');
const path = require('path');

// Default timer configurations
const defaultConfig = [
    {
        id: "night_parade_of_the_white_ghost",
        timerCooldown: 25,
    },
    {
        id: "freed_shadow",
        timerCooldown: 60,
        timerBuff: 40
    },
    {
        id: "concerto",
        timerCooldown: 60,
        timerBuff: 40
    }
];

// Function to get the config file path
function getConfigFilePath() {
    const configDir = path.join(__dirname, 'config');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }
    return path.join(configDir, 'timerCooldown.json');
}

// Function to read timer configurations
function readConfig() {
    const filePath = getConfigFilePath();
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultConfig;
    } catch (error) {
        console.error('Error reading timer config:', error);
        return defaultConfig;
    }
}

// Function to save timer configurations
function saveConfig(config) {
    const filePath = getConfigFilePath();
    try {
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving timer config:', error);
        return false;
    }
}

// Function to add custom timer
function addCustomTimer(title, cooldown, buff) {
    const config = readConfig();
    const newTimer = {
        id: title.toLowerCase().replace(/\s+/g, '_'),
        timerCooldown: cooldown,
        timerBuff: buff
    };
    config.push(newTimer);
    return saveConfig(config);
}

// Function to delete timer config
function deleteTimerConfig(title) {
    try {
        const config = readConfig();
        console.log(config);
        
        const filteredConfig = config.filter(c => 
            c.id !== title.toLowerCase().replace(/\s+/g, '_')
        );
        return saveConfig(filteredConfig);
    } catch (error) {
        console.error('Error deleting timer config:', error);
        return false;
    }
}

// Function to get all timer configurations
function getAllTimers() {
    return readConfig();
}

module.exports = {
    addCustomTimer,
    getAllTimers,
    deleteTimerConfig
};