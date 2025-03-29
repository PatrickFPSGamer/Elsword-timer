document.addEventListener('DOMContentLoaded', () => {
    console.log('list.js loaded');
    const comboList = document.getElementById('comboList');
    console.log('comboList element:', comboList);
    
    let timers = {};
    let currentComboKeys = [];

    // Function to format time
    function formatTime(seconds, isBuff = false) {
        if (seconds === 0) return isBuff ? 'not ready' : 'ready';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to start timer for a combo
    function startTimer(comboName, config) {
        console.log(`Starting timer for ${comboName} with config:`, config);
        
        // Check if timer exists and is not at 0
        if (timers[comboName]?.cooldown?.seconds > 0) {
            console.log(`Timer for ${comboName} is still running, ignoring reset`);
            return;
        }
        
        // Reset cooldown timer
        if (timers[comboName]?.cooldown?.interval) {
            clearInterval(timers[comboName].cooldown.interval);
            console.log(`Cleared existing cooldown timer for ${comboName}`);
        }

        // Reset buff timer if exists
        if (timers[comboName]?.buff?.interval) {
            clearInterval(timers[comboName].buff.interval);
            console.log(`Cleared existing buff timer for ${comboName}`);
        }
        
        // Initialize timers
        timers[comboName] = {
            cooldown: {
                seconds: config.timerCooldown
            }
        };

        if (config.timerBuff) {
            timers[comboName].buff = {
                seconds: config.timerBuff
            };
        }

        // Create a single interval for both timers
        const interval = setInterval(() => {
            // Update cooldown timer
            if (timers[comboName].cooldown.seconds > 0) {
                timers[comboName].cooldown.seconds--;
                const cooldownElement = document.getElementById(`cooldown-${comboName}`);
                if (cooldownElement) {
                    cooldownElement.textContent = formatTime(timers[comboName].cooldown.seconds);
                    console.log(`Updated cooldown timer for ${comboName}: ${cooldownElement.textContent}`);
                }
            }

            // Update buff timer if exists
            if (timers[comboName].buff && timers[comboName].buff.seconds > 0) {
                timers[comboName].buff.seconds--;
                const buffElement = document.getElementById(`buff-${comboName}`);
                if (buffElement) {
                    buffElement.textContent = formatTime(timers[comboName].buff.seconds, true);
                    console.log(`Updated buff timer for ${comboName}: ${buffElement.textContent}`);
                }
            }
        }, 1000);

        // Store the interval reference
        timers[comboName].cooldown.interval = interval;
        if (timers[comboName].buff) {
            timers[comboName].buff.interval = interval;
        }
    }

    // Function to handle global key press
    function handleGlobalKeyPress(e, down) {
        // Ignore left mouse button events
        if (e.name === 'MOUSE LEFT') {
            return;
        }

        if (!down) return;

        const key = e.name;
        console.log('Key pressed:', key);

        // Add key to current combo
        currentComboKeys.push(key);
        console.log('Current combo keys:', currentComboKeys);

        // Check if the current combo matches any saved combo
        const combos = window.electronAPI.getCurrentCombos();
        console.log('Available combos:', combos);

        // Check for matching combo
        const matchingCombo = combos.find(combo => {
            // For single key combos, check if the key matches exactly
            if (combo.keys.length === 1) {
                console.log('Checking single key combo:', {
                    comboKey: combo.keys[0],
                    pressedKey: key,
                    matches: combo.keys[0] === key
                });
                return combo.keys[0] === key;
            }
            
            // For multi-key combos, check if the current sequence matches
            if (currentComboKeys.length === combo.keys.length) {
                console.log("combo:", combo);
                
                console.log('Checking multi-key combo:', {
                    comboKeys: combo.keys,
                    currentKeys: currentComboKeys,
                    matches: combo.keys.every((comboKey, index) => currentComboKeys[index] === comboKey)
                });
                return combo.keys.every((comboKey, index) => currentComboKeys[index] === comboKey);
            }
            
            return false;
        });

        if (matchingCombo) {
            console.log('Combo matched:', matchingCombo);
            const config = window.electronAPI.getTimerConfig(matchingCombo.title);
            console.log('Found timer config:', config);
            if (config) {
                startTimer(matchingCombo.name, config);
            }
            // Reset current combo
            currentComboKeys = [];
        } else {
            // If we have more keys than any combo, reset the current combo
            const maxComboLength = Math.max(...combos.map(combo => combo.keys.length));
            console.log(maxComboLength);
            
            if (currentComboKeys.length >= maxComboLength) {
                console.log('Too many keys pressed, resetting combo');
                currentComboKeys = [];
            }
            console.log('No matching combo found');
        }
    }

    // Function to update combo list with timers
    function updateComboList(combos) {
        console.log('Updating combo list with:', combos);
        if (!combos || combos.length === 0) {
            console.log('No combos available');
            comboList.innerHTML = '<div class="combo-item">No combos available</div>';
            return;
        }

        try {
            comboList.innerHTML = combos.map(combo => {
                const config = window.electronAPI.getTimerConfig(combo.title);
                const hasBuff = config && config.timerBuff;
                
                return `
                    <div class="combo-item">
                        <div class="combo-header">
                            <div class="combo-name">${combo.name}</div>
                            <div class="timers">
                                <div class="timer-container">
                                    <div class="timer-label">Cooldown</div>
                                    <div class="timer cooldown" id="cooldown-${combo.name}">ready</div>
                                </div>
                                ${hasBuff ? `
                                    <div class="timer-container">
                                        <div class="timer-label">Buff</div>
                                        <div class="timer buff" id="buff-${combo.name}">not ready</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="combo-title">${combo.title}</div>
                        <div class="combo-keys">
                            ${combo.keys.map(key => `<span class="key-item">${key}</span>`).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            console.log('Combo list updated successfully');
        } catch (error) {
            console.error('Error updating combo list:', error);
            comboList.innerHTML = '<div class="combo-item">Error updating combo list</div>';
        }
    }

    // Load existing combos
    async function loadExistingCombos() {
        try {
            console.log('Loading existing combos...');
            console.log('window.electronAPI:', window.electronAPI);
            const result = await window.electronAPI.loadCombos();
            console.log('Load result:', result);
            if (result.success) {
                window.electronAPI.setCurrentCombos(result.combos);
                updateComboList(result.combos);
                // Initialize key listener after combos are loaded
                window.electronAPI.initializeKeyListener(handleGlobalKeyPress);
            } else {
                console.error('Failed to load combos:', result.message);
                comboList.innerHTML = '<div class="combo-item">Error loading combos</div>';
            }
        } catch (error) {
            console.error('Error loading combos:', error);
            comboList.innerHTML = '<div class="combo-item">Error loading combos</div>';
        }
    }

    // Load combos when the page loads
    loadExistingCombos();
}); 