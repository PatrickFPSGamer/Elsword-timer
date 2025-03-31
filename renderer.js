document.addEventListener('DOMContentLoaded', () => {
    const titleSelect = document.getElementById('title');
    const namaInput = document.getElementById('nama');
    const keyDisplay = document.getElementById('keyDisplay');
    const recordButton = document.getElementById('recordButton');
    const clearButton = document.getElementById('clearButton');
    const addButton = document.getElementById('addButton');
    const listButton = document.getElementById('listButton');
    const comboTableBody = document.getElementById('comboTableBody');
    const otherFields = document.getElementById('otherFields');
    const otherNameInput = document.getElementById('otherName');
    const cooldownTimerInput = document.getElementById('cooldownTimer');
    const buffTimerInput = document.getElementById('buffTimer');

    let isRecording = false;
    let recordedKeys = [];

    // Function to reset form
    function resetForm() {
        namaInput.value = '';
        titleSelect.value = '';
        otherNameInput.value = '';
        cooldownTimerInput.value = '';
        buffTimerInput.value = '';
        otherFields.style.display = 'none';
        recordedKeys = [];
        updateKeyDisplay();
        if (isRecording) {
            stopRecording();
        }
    }

    // Show/hide other fields based on title selection
    titleSelect.addEventListener('change', () => {
        if (titleSelect.value === '0') {
            otherFields.style.display = 'block';
        } else {
            otherFields.style.display = 'none';
        }
    });

    // Function to update the key display
    function updateKeyDisplay() {
        keyDisplay.innerHTML = recordedKeys.length > 0 
            ? recordedKeys.map(key => `<span class="key-item">${key}</span>`).join('')
            : 'Press button to record combo...';
    }

    // Function to handle global key press
    function handleGlobalKeyPress(e, down) {
        // Ignore left mouse button events
        if (e.name === 'MOUSE LEFT') {
            return;
        }

        if (!isRecording || !down) {
            return;
        }

        const key = e.name;
        console.log('Renderer received key event:', {
            key,
            isRecording,
            currentKeys: recordedKeys
        });

        // If Enter is pressed, stop recording
        if (key === 'ENTER') {
            console.log('Enter pressed, stopping recording');
            stopRecording();
            return;
        }

        // Add the key to recorded keys if it's not already there
        if (!recordedKeys.includes(key)) {
            console.log('Adding new key:', key);
            recordedKeys.push(key);
            updateKeyDisplay();
        } else {
            console.log('Key already recorded:', key);
        }
    }

    // Function to start recording
    function startRecording() {
        console.log('Starting recording...');
        isRecording = true;
        recordButton.textContent = 'Stop Recording';
        recordButton.classList.add('recording');
        keyDisplay.innerHTML = 'Press keys to record combo...';
        
        // Initialize the key listener
        window.electronAPI.initializeKeyListener(handleGlobalKeyPress);
    }

    // Function to stop recording
    function stopRecording() {
        console.log('Stopping recording. Final keys:', recordedKeys);
        isRecording = false;
        recordButton.textContent = 'Start Recording';
        recordButton.classList.remove('recording');
        
        // Kill the key listener when stopping recording
        window.electronAPI.killKeyListener();
    }

    // Function to update combo table
    function updateComboTable(combos) {
        console.log('Updating combo table with:', combos);
        if (!combos || combos.length === 0) {
            comboTableBody.innerHTML = '<tr><td colspan="4">No combos available</td></tr>';
            return;
        }
        comboTableBody.innerHTML = combos.map(combo => `
            <tr>
                <td>${combo.name}</td>
                <td>${combo.title}</td>
                <td>
                    <div class="combo-keys">
                        ${combo.keys.map(key => `<span class="key-item">${key}</span>`).join('')}
                    </div>
                </td>
                <td>
                    <button class="delete-btn" data-combo='${JSON.stringify(combo)}'>Delete</button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to all delete buttons
        const deleteButtons = comboTableBody.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const combo = JSON.parse(button.dataset.combo);
                handleDelete(combo);
            });
        });
    }

    // Function to handle delete
    async function handleDelete(combo) {
        if (confirm(`Are you sure you want to delete "${combo.name}"?`)) {
            try {
                const result = await window.electronAPI.deleteCombo(combo);
                if (result.success) {
                    loadExistingCombos();
                } else {
                    alert('Failed to delete combo: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting combo:', error);
                alert('Failed to delete combo. Please try again.');
            }
        }
    }

    // Load existing combos when the page loads
    async function loadExistingCombos() {
        try {
            console.log('Loading existing combos...');
            const result = await window.electronAPI.loadCombos();
            console.log('Load result:', result);
            if (result.success) {
                updateComboTable(result.combos);
            } else {
                console.error('Failed to load combos:', result.message);
                comboTableBody.innerHTML = '<tr><td colspan="4">Error loading combos</td></tr>';
            }
        } catch (error) {
            console.error('Error loading combos:', error);
            comboTableBody.innerHTML = '<tr><td colspan="4">Error loading combos</td></tr>';
        }
    }

    // Event listeners
    recordButton.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    clearButton.addEventListener('click', () => {
        recordedKeys = [];
        updateKeyDisplay();
    });

    addButton.addEventListener('click', async () => {
        const title = titleSelect.value;
        const nama = namaInput.value.trim();
        
        if (!nama) {
            alert('Please enter a combo name first!');
            return;
        }
        if (!title) {
            alert('Please select a title!');
            return;
        }
        if (recordedKeys.length === 0) {
            alert('Please record some keys first!');
            return;
        }

        // Validate other fields if "Other" is selected
        if (title === '0') {
            const otherName = otherNameInput.value.trim();
            const cooldownTimer = parseInt(cooldownTimerInput.value);
            let buffTimer = parseInt(buffTimerInput.value);
            console.log(buffTimer);
            

            if (!otherName) {
                alert('Please enter a title name!');
                return;
            }
            if (!cooldownTimer || cooldownTimer <= 0) {
                alert('Please enter a valid cooldown timer!');
                return;
            }
            if (!buffTimer || buffTimer < -1) {
                buffTimer = 0;
            }
        }

        // Prepare the combo data
        const comboData = {
            name: nama,
            title: title === '0' ? otherNameInput.value.trim() : title,
            keys: [...recordedKeys]
        };

        // If this is a custom timer, save it to timerCooldown.js first
        if (title === '0') {
            try {
                const success = await window.electronAPI.saveCustomTimer(
                    otherNameInput.value.trim(),
                    parseInt(cooldownTimerInput.value),
                    parseInt(buffTimerInput.value)
                );
                
                if (!success) {
                    throw new Error('Failed to save custom timer configuration');
                }
            } catch (error) {
                console.error('Error saving custom timer:', error);
                alert('Failed to save custom timer configuration. Please try again.');
                return;
            }
        }

        try {
            console.log('Saving combo:', comboData);
            const result = await window.electronAPI.saveCombo(comboData);
            console.log('Save result:', result);
            
            if (result.success) {
                resetForm();
                loadExistingCombos();
                alert('Combo added successfully!');
            } else {
                alert('Failed to save combo: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving combo:', error);
            alert('Failed to save combo. Please try again.');
        }
    });

    listButton.addEventListener('click', async () => {
        try {
            await window.electronAPI.openList();
        } catch (error) {
            console.error('Error opening list:', error);
            alert('Failed to open list page. Please try again.');
        }
    });

    // Load existing combos when the page loads
    loadExistingCombos();
}); 