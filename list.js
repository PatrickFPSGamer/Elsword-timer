document.addEventListener('DOMContentLoaded', () => {
    const comboList = document.getElementById('comboList');
    let timers = {};
    let currentComboKeys = [];
    let keyTimeout;

    // Function to format time
    function formatTime(seconds, isBuff = false) {
        if (seconds === 0) return isBuff ? 'not ready' : 'ready';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to start timer for a combo
    function startTimer(comboName, config) {
        // Convert title to id format for consistency
        const titleId = config.id;

        // Check if timer exists and is not at 0
        if (timers[titleId]?.cooldown?.seconds > 0) {
            return;
        }

        // Reset cooldown timer
        if (timers[titleId]?.cooldown?.interval) {
            clearInterval(timers[titleId].cooldown.interval);
        }

        // Reset buff timer if exists
        if (timers[titleId]?.buff?.interval) {
            clearInterval(timers[titleId].buff.interval);
        }

        // Initialize timers
        timers[titleId] = {
            cooldown: {
                seconds: config.timerCooldown
            }
        };

        if (config.timerBuff) {
            timers[titleId].buff = {
                seconds: config.timerBuff
            };
        }

        // Create a single interval for both timers
        const interval = setInterval(() => {
            // Update cooldown timer
            if (timers[titleId].cooldown.seconds > 0) {
                timers[titleId].cooldown.seconds--;
                // Update all combos with this title
                const combos = window.electronAPI.getCurrentCombos();
                combos.forEach(combo => {
                    const comboConfig = window.electronAPI.getTimerConfig(combo.title);
                    if (comboConfig && comboConfig.id === titleId) {
                        const cooldownElement = document.getElementById(`cooldown-${combo.name}`);
                        if (cooldownElement) {
                            cooldownElement.textContent = formatTime(timers[titleId].cooldown.seconds);
                        }
                    }
                });
            }

            // Update buff timer if exists
            if (timers[titleId].buff && timers[titleId].buff.seconds > 0) {
                timers[titleId].buff.seconds--;
                // Update all combos with this title
                const combos = window.electronAPI.getCurrentCombos();
                combos.forEach(combo => {
                    const comboConfig = window.electronAPI.getTimerConfig(combo.title);
                    if (comboConfig && comboConfig.id === titleId) {
                        const buffElement = document.getElementById(`buff-${combo.name}`);
                        if (buffElement) {
                            buffElement.textContent = formatTime(timers[titleId].buff.seconds, true);
                        }
                    }
                });
            }
        }, 1000);

        // Store the interval reference
        timers[titleId].cooldown.interval = interval;
        if (timers[titleId].buff) {
            timers[titleId].buff.interval = interval;
        }
    }

    // Function to reset all timers
    function resetAllTimers() {
        // Clear all intervals
        Object.values(timers).forEach(timer => {
            if (timer.cooldown?.interval) {
                clearInterval(timer.cooldown.interval);
            }
            if (timer.buff?.interval) {
                clearInterval(timer.buff.interval);
            }
        });

        // Reset all timer displays
        const combos = window.electronAPI.getCurrentCombos();
        combos.forEach(combo => {
            const cooldownElement = document.getElementById(`cooldown-${combo.name}`);
            const buffElement = document.getElementById(`buff-${combo.name}`);
            if (cooldownElement) cooldownElement.textContent = 'ready';
            if (buffElement) buffElement.textContent = 'not ready';
        });

        // Clear timers object
        timers = {};
    }

    // Function to handle global key press
    function handleGlobalKeyPress(e, down) {
        // Ignore left mouse button events
        if (e.name === 'MOUSE LEFT') {
            return;
        }

        if (!down) return;

        const key = e.name;

        // Check for Del key to reset all timers
        if (key === 'DELETE') {
            resetAllTimers();
            return;
        }

        // Add the key to current combo if it's not already there
        if (!currentComboKeys.includes(key)) {
            currentComboKeys.push(key);
        }
        console.log(currentComboKeys);


        // Immediately check for matching combos
        const combos = window.electronAPI.getCurrentCombos();

        // Find matching combos
        const matchingCombos = combos.filter(combo => {
            // Check if the current keys match the combo keys exactly
            return currentComboKeys.length === combo.keys.length &&
                currentComboKeys.every((key, index) => key === combo.keys[index]);
        });

        if (matchingCombos.length > 0) {
            // Start timers for all matching combos
            matchingCombos.forEach(combo => {
                const config = window.electronAPI.getTimerConfig(combo.title);
                if (config) {
                    startTimer(combo.name, config);
                }
            });
            // Reset current combo after matching
            currentComboKeys = [];
        } else {
            // If we have more keys than any combo, reset the current combo
            const maxComboLength = Math.max(...combos.map(combo => combo.keys.length));
            if (currentComboKeys.length >= maxComboLength) {
                currentComboKeys = [];
            }
        }

        // Delay reset if no input for 0.5 seconds
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(() => {
            currentComboKeys = [];
        }, 700);
    }

    // Function to update combo list with timers
    function updateComboList(combos) {
        if (!combos || combos.length === 0) {
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
        } catch (error) {
            comboList.innerHTML = '<div class="combo-item">Error updating combo list</div>';
        }
    }

    // Load existing combos
    async function loadExistingCombos() {
        try {
            const result = await window.electronAPI.loadCombos();
            if (result.success) {
                window.electronAPI.setCurrentCombos(result.combos);
                updateComboList(result.combos);
                // Initialize key listener after combos are loaded
                window.electronAPI.initializeKeyListener(handleGlobalKeyPress);
            } else {
                comboList.innerHTML = '<div class="combo-item">Error loading combos</div>';
            }
        } catch (error) {
            comboList.innerHTML = '<div class="combo-item">Error loading combos</div>';
        }
    }

    // Load combos when the page loads
    loadExistingCombos();
});