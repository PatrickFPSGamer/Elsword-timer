document.addEventListener('DOMContentLoaded', () => {
    const titleSelect = document.getElementById('title');
    const namaInput = document.getElementById('nama');
    const keyDisplay = document.getElementById('keyDisplay');
    const recordButton = document.getElementById('recordButton');
    const clearButton = document.getElementById('clearButton');
    const addButton = document.getElementById('addButton');
    const listButton = document.getElementById('listButton');
    const comboTableBody = document.getElementById('comboTableBody');

    let isRecording = false;
    let recordedKeys = [];

    // Function to reset form
    function resetForm() {
        namaInput.value = '';
        titleSelect.value = '';
        recordedKeys = [];
        updateKeyDisplay();
        if (isRecording) {
            stopRecording();
        }
    }

    // Function to update the key display
    function updateKeyDisplay() {
        keyDisplay.innerHTML = recordedKeys.length > 0 
            ? recordedKeys.map(key => `<span class="key-item">${key}</span>`).join('')
            : 'Press button to record combo...';
    }

    // Function to handle key press
    function handleKeyPress(event) {
        if (!isRecording) return;

        // Prevent default behavior for special keys
        if (['Enter', 'Tab', 'Escape'].includes(event.key)) {
            event.preventDefault();
        }

        // If Enter is pressed, stop recording
        if (event.key === 'Enter') {
            stopRecording();
            return;
        }

        // Add the key to recorded keys if it's not already there
        if (!recordedKeys.includes(event.key)) {
            recordedKeys.push(event.key);
            updateKeyDisplay();
        }
    }

    // Function to start recording
    function startRecording() {
        isRecording = true;
        recordButton.textContent = 'Stop Recording';
        recordButton.classList.add('recording');
        keyDisplay.innerHTML = 'Press button to record combo...';
        window.addEventListener('keydown', handleKeyPress);
    }

    // Function to stop recording
    function stopRecording() {
        isRecording = false;
        recordButton.textContent = 'Start Recording';
        recordButton.classList.remove('recording');
        window.removeEventListener('keydown', handleKeyPress);
    }

    // Function to update combo table
    function updateComboTable(combos) {
        console.log('Updating combo table with:', combos); // Debug log
        if (!combos || combos.length === 0) {
            comboTableBody.innerHTML = '<tr><td colspan="3">No combos available</td></tr>';
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
            </tr>
        `).join('');
    }

    // Load existing combos when the page loads
    async function loadExistingCombos() {
        try {
            console.log('Loading existing combos...'); // Debug log
            const result = await window.electronAPI.loadCombos();
            console.log('Load result:', result); // Debug log
            if (result.success) {
                updateComboTable(result.combos);
            } else {
                console.error('Failed to load combos:', result.message);
                comboTableBody.innerHTML = '<tr><td colspan="3">Error loading combos</td></tr>';
            }
        } catch (error) {
            console.error('Error loading combos:', error);
            comboTableBody.innerHTML = '<tr><td colspan="3">Error loading combos</td></tr>';
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

        // Prepare the combo data
        const comboData = {
            name: nama,
            title: title,
            keys: [...recordedKeys]
        };

        try {
            console.log('Saving combo:', comboData); // Debug log
            // Save the combo using the electron API
            const result = await window.electronAPI.saveCombo(comboData);
            console.log('Save result:', result); // Debug log
            
            if (result.success) {
                // Reset the form
                resetForm();
                // Reload the combos to update the table
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

    // List button handler
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