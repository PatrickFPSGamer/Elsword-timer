document.addEventListener('DOMContentLoaded', () => {
    const comboList = document.getElementById('comboList');
    let timers = {};

    // Function to format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Function to update combo list with timers
    function updateComboList(combos) {
        console.log('Updating combo list with:', combos); // Debug log
        if (!combos || combos.length === 0) {
            console.log('No combos available'); // Debug log
            comboList.innerHTML = '<div class="combo-item">No combos available</div>';
            return;
        }

        comboList.innerHTML = combos.map(combo => `
            <div class="combo-item">
                <div class="combo-header">
                    <div class="combo-name">${combo.name}</div>
                    <div class="timer" id="timer-${combo.name}">0:00</div>
                </div>
                <div class="combo-title">${combo.title}</div>
                <div class="combo-keys">
                    ${combo.keys.map(key => `<span class="key-item">${key}</span>`).join('')}
                </div>
            </div>
        `).join('');

        // Initialize timers for each combo
        combos.forEach(combo => {
            if (!timers[combo.name]) {
                timers[combo.name] = {
                    seconds: 0,
                    interval: setInterval(() => {
                        timers[combo.name].seconds++;
                        const timerElement = document.getElementById(`timer-${combo.name}`);
                        if (timerElement) {
                            timerElement.textContent = formatTime(timers[combo.name].seconds);
                        }
                    }, 1000)
                };
            }
        });
    }

    // Load existing combos
    async function loadExistingCombos() {
        try {
            console.log('Loading existing combos...'); // Debug log
            const result = await window.electronAPI.loadCombos();
            console.log('Load result:', result); // Debug log
            if (result.success) {
                updateComboList(result.combos);
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