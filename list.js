document.addEventListener('DOMContentLoaded', () => {
    const comboList = document.getElementById('comboList');
    let timers = {};
    let currentComboKeys = [];
    let keyTimeout;
    let draggedItem = null;
    let initialX = 0;
    let initialY = 0;
    let currentX = 0;
    let currentY = 0;

    // Function to format time
    function formatTime(seconds, isBuff = false) {
        if (seconds === 0) return isBuff ? 'not ready' : 'ready';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to start timer for a combo
    function startTimer(title, config) {
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
                const cooldownElement = document.getElementById(`cooldown-${title}`);
                if (cooldownElement) {
                    cooldownElement.textContent = `${timers[titleId].cooldown.seconds}s`;
                    cooldownElement.className = 'status-value off';
                }
            } else {
                const cooldownElement = document.getElementById(`cooldown-${title}`);
                if (cooldownElement) {
                    cooldownElement.textContent = 'READY';
                    cooldownElement.className = 'status-value on';
                }
            }

            // Update buff timer if exists
            if (timers[titleId].buff && timers[titleId].buff.seconds > 0) {
                timers[titleId].buff.seconds--;
                const buffElement = document.getElementById(`buff-${title}`);
                if (buffElement) {
                    buffElement.textContent = `${timers[titleId].buff.seconds}s`;
                    buffElement.className = 'status-value off';
                }
            } else if (timers[titleId].buff) {
                const buffElement = document.getElementById(`buff-${title}`);
                if (buffElement) {
                    buffElement.textContent = 'NOT READY';
                    buffElement.className = 'status-value on';
                }
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
        const uniqueTitles = [...new Set(combos.map(combo => combo.title))];
        
        uniqueTitles.forEach(title => {
            const config = window.electronAPI.getTimerConfig(title);
            if (config) {
                // Reset cooldown timer
                const cooldownElement = document.getElementById(`cooldown-${title}`);
                if (cooldownElement) {
                    cooldownElement.textContent = 'READY';
                    cooldownElement.className = 'status-value on';
                }

                // Reset buff timer if exists
                if (config.timerBuff) {
                    const buffElement = document.getElementById(`buff-${title}`);
                    if (buffElement) {
                        buffElement.textContent = 'READY';
                        buffElement.className = 'status-value on';
                    }
                }
            }
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

        // Immediately check for matching combos
        const combos = window.electronAPI.getCurrentCombos();

        // Find matching combos
        const matchingCombos = combos.filter(combo => {
            // Check if the current keys match the combo keys exactly
            return currentComboKeys.length === combo.keys.length &&
                currentComboKeys.every((key, index) => key === combo.keys[index]);
        });

        if (matchingCombos.length > 0) {
            // Get unique titles from matching combos
            const uniqueTitles = [...new Set(matchingCombos.map(combo => combo.title))];
            
            // Start timers for each unique title
            uniqueTitles.forEach(title => {
                const config = window.electronAPI.getTimerConfig(title);
                if (config) {
                    startTimer(title, config);
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
        }, 350);
    }

    // Function to handle mouse down event
    function handleMouseDown(e) {
        if (e.target.closest('.combo-item')) {
            draggedItem = e.target.closest('.combo-item');
            draggedItem.classList.add('dragging');
            
            // Get initial position
            const rect = draggedItem.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            // Set initial position
            currentX = rect.left;
            currentY = rect.top;
            
            // Add event listeners for dragging
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    }

    // Function to handle mouse move event
    function handleMouseMove(e) {
        if (draggedItem) {
            e.preventDefault();
            
            // Calculate new position
            const newX = e.clientX - initialX;
            const newY = e.clientY - initialY;
            
            // Update position
            draggedItem.style.left = `${newX}px`;
            draggedItem.style.top = `${newY}px`;
        }
    }

    // Function to handle mouse up event
    function handleMouseUp() {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            
            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }

    // Add mouse down event listener to combo list
    comboList.addEventListener('mousedown', handleMouseDown);

    // Function to update combo list with timers
    function updateComboList(combos) {
        if (!combos || combos.length === 0) {
            comboList.innerHTML = '<div class="combo-item">No combos available</div>';
            return;
        }

        try {
            // Group combos by title
            const groupedCombos = combos.reduce((acc, combo) => {
                if (!acc[combo.title]) {
                    acc[combo.title] = {
                        image: combo.image,
                        config: window.electronAPI.getTimerConfig(combo.title)
                    };
                }
                return acc;
            }, {});

            // Create HTML for each title group
            comboList.innerHTML = Object.entries(groupedCombos).map(([title, data], index) => {
                const config = data.config;
                const hasBuff = config && config.timerBuff;

                return `
                    <div class="combo-item" style="left: 0; top: ${index * 60}px;">
                        <div class="combo-header">
                            ${data.image ? `<img src="${data.image}" alt="${title}" class="title-image">` : ''}
                            <div class="status-container">
                                <div class="status-item">
                                    <span class="status-label">CD:</span>
                                    <span class="status-value on" id="cooldown-${title}">READY</span>
                                </div>
                                ${hasBuff ? `
                                    <div class="status-item">
                                        <span class="status-label">Buff:</span>
                                        <span class="status-value on" id="buff-${title}">READY</span>
                                    </div>
                                ` : ''}
                            </div>
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