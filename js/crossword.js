/**
 * Interactive Crossword Game
 * Handles loading puzzles, user interaction, and game logic
 */

class CrosswordGame {
    constructor() {
        this.currentPuzzle = null;
        this.selectedCell = null;
        this.selectedWord = null;
        this.direction = 'across'; // 'across' or 'down'
        this.userAnswers = {};
        this.completedWords = new Set();
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadAvailablePuzzles();
    }

    initializeElements() {
        // Main elements
        this.puzzleSelect = document.getElementById('puzzle-select');
        this.loadButton = document.getElementById('load-puzzle');
        this.mainContent = document.getElementById('main-content');
        this.grid = document.getElementById('crossword-grid');
        this.acrossClues = document.getElementById('across-clues');
        this.downClues = document.getElementById('down-clues');
        this.currentClueDisplay = document.getElementById('current-clue');
        
        // Info elements
        this.puzzleTitle = document.getElementById('puzzle-title');
        this.puzzleDifficulty = document.getElementById('puzzle-difficulty');
        this.puzzleStats = document.getElementById('puzzle-stats');
        
        // Control buttons
        this.checkLetterBtn = document.getElementById('check-letter');
        this.checkWordBtn = document.getElementById('check-word');
        this.checkAllBtn = document.getElementById('check-all');
        this.revealLetterBtn = document.getElementById('reveal-letter');
        this.revealWordBtn = document.getElementById('reveal-word');
    }

    setupEventListeners() {
        // Puzzle loading
        this.puzzleSelect.addEventListener('change', () => {
            this.loadButton.disabled = !this.puzzleSelect.value;
        });
        
        this.loadButton.addEventListener('click', () => this.loadPuzzle());
        
        // Control buttons
        this.checkLetterBtn.addEventListener('click', () => this.checkLetter());
        this.checkWordBtn.addEventListener('click', () => this.checkWord());
        this.checkAllBtn.addEventListener('click', () => this.checkAll());
        this.revealLetterBtn.addEventListener('click', () => this.revealLetter());
        this.revealWordBtn.addEventListener('click', () => this.revealWord());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeypress(e));
    }

    async loadAvailablePuzzles() {
        try {
            // In a real implementation, this would fetch from a server
            // For GitHub Pages, we'll have a predefined list
            const puzzles = [
            {
                        "file": "crossword_seed0402202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed0502202604_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed0602202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed0702202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed0802202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed0902202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1002202603_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1102202603_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1202202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1302202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1402202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1502202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1602202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1702202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1802202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed1902202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2002202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2102202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2202202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2302202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2402202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2502202601_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2602202602_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            },
            {
                        "file": "crossword_seed2702202604_medium.json",
                        "name": "Crossword Grid - medium (2026-02-08)",
                        "difficulty": "medium",
                        "title": "Crossword Grid"
            }
];
            
            puzzles.forEach(puzzle => {
                const option = document.createElement('option');
                option.value = puzzle.file;
                option.textContent = puzzle.name;
                this.puzzleSelect.appendChild(option);
            });

            // Automatically select and load today's puzzle based on date seed
            this.autoSelectDailyPuzzle(puzzles);
        } catch (error) {
            console.error('Error loading puzzles:', error);
        }
    }

    autoSelectDailyPuzzle(puzzles) {
        if (!puzzles || puzzles.length === 0) return;

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear());

        // Seed naming convention: DDMMYYYY, e.g. 13012026 -> "seed13012026"
        const dateSeed = `${day}${month}${year}`;

        // Try to find a puzzle file whose name includes this seed
        let selectedPuzzle = puzzles.find(p =>
            typeof p.file === 'string' && p.file.includes(dateSeed)
        );

        // Fallback: deterministic rotation based on days since epoch
        if (!selectedPuzzle) {
            const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
            const index = daysSinceEpoch % puzzles.length;
            selectedPuzzle = puzzles[index];
        }

        if (!selectedPuzzle) return;

        // Set the selector value so loadPuzzle uses the correct file
        this.puzzleSelect.value = selectedPuzzle.file;

        // Hide the manual selector so users don't have to choose
        const selectorContainer = document.querySelector('.puzzle-selector');
        if (selectorContainer) {
            selectorContainer.style.display = 'none';
        }

        // Ensure the load button isn't blocked and load the puzzle automatically
        this.loadButton.disabled = false;
        this.loadPuzzle();
    }

    async loadPuzzle() {
        const puzzleFile = this.puzzleSelect.value;
        if (!puzzleFile) return;
        
        try {
            this.loadButton.innerHTML = '<span class="loading"></span> Laster...';
            this.loadButton.disabled = true;
            
            const response = await fetch(`puzzles/${puzzleFile}`);
            if (!response.ok) throw new Error('Failed to load puzzle');
            
            this.currentPuzzle = await response.json();
            this.initializePuzzle();
            this.renderPuzzle();
            this.mainContent.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading puzzle:', error);
            alert('Kunne ikke laste kryssord. Sjekk at filen eksisterer.');
        } finally {
            this.loadButton.innerHTML = 'Last inn';
            this.loadButton.disabled = false;
        }
    }

    initializePuzzle() {
        this.userAnswers = {};
        this.completedWords = new Set();
        this.selectedCell = null;
        this.selectedWord = null;
        this.cachedWordPositions = null; // Clear cached positions

        this.sanitizePuzzleClues();
        
        // Initialize user answers structure
        Object.keys(this.currentPuzzle.answers.across).forEach(num => {
            const word = this.currentPuzzle.answers.across[num];
            this.userAnswers[`${num}-across`] = Array(word.length).fill('');
        });
        
        Object.keys(this.currentPuzzle.answers.down).forEach(num => {
            const word = this.currentPuzzle.answers.down[num];
            this.userAnswers[`${num}-down`] = Array(word.length).fill('');
        });
        
        this.updatePuzzleInfo();
    }

    renderPuzzle() {
        this.renderGrid();
        this.renderClues();
        this.updateControls();
        this.initializeFilledStates();
    }

    initializeFilledStates() {
        // Initialize filled state for all cells based on current input values
        const layout = this.currentPuzzle.layout;
        for (let row = 0; row < layout.length; row++) {
            for (let col = 0; col < layout[row].length; col++) {
                if (layout[row][col] !== 0) {
                    this.updateCellFilledState(row, col);
                }
            }
        }
    }

    renderGrid() {
        const layout = this.currentPuzzle.layout;
        const gridSize = layout.length;

        // One column per letter, each column track uses the shared cell size
        this.grid.style.gridTemplateColumns = `repeat(${layout[0].length}, var(--cell-size))`;
        this.grid.innerHTML = '';
        
        // Create word position maps
        const wordPositions = this.calculateWordPositions();
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < layout[row].length; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (layout[row][col] === '#') {
                    cell.classList.add('block');
                } else {
                    cell.classList.add('empty');
                    
                    // Add cell number if this is the start of a word
                    const cellNumbers = this.getCellNumbers(row, col, wordPositions);
                    if (cellNumbers.length > 0) {
                        const numberSpan = document.createElement('span');
                        numberSpan.className = 'cell-number';
                        numberSpan.textContent = Math.min(...cellNumbers);
                        cell.appendChild(numberSpan);
                    }
                    
                    // Add input for letter
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.maxLength = 1;
                    input.addEventListener('input', (e) => this.handleInput(e, row, col));
                    input.addEventListener('keydown', (e) => this.handleKeydown(e, row, col));
                    input.style.pointerEvents = 'auto'; // Ensure input is interactive
                    cell.appendChild(input);

                    // Handle selection and direction toggling only via the cell click handler
                    cell.addEventListener('click', () => this.handleCellClick(row, col));
                }
                
                this.grid.appendChild(cell);
            }
        }

        // Adjust grid cell size to use ~90% of viewport height
        this.updateGridSize();
    }

    calculateWordPositions() {
        if (this.cachedWordPositions) {
            return this.cachedWordPositions;
        }
        
        const positions = {};
        
        // Use the word positions from the puzzle data if available
        if (this.currentPuzzle.word_positions) {
            Object.entries(this.currentPuzzle.word_positions).forEach(([wordKey, pos]) => {
                positions[wordKey] = {
                    row: pos.row,
                    col: pos.col,
                    length: pos.length,
                    direction: pos.direction
                };
            });
            this.cachedWordPositions = positions;
            return positions;
        }
        
        // If we have solved_layout, use it for accurate positioning
        if (this.currentPuzzle.solved_layout) {
            this.calculateWordPositionsFromSolvedLayout(positions);
        } else {
            // Fallback: Calculate positions by analyzing the layout pattern
            const wordSlots = this.findAllWordSlots(this.currentPuzzle.layout);
            this.assignWordsToSlots(wordSlots, positions);
        }
        
        this.cachedWordPositions = positions;
        return positions;
    }

    calculateWordPositionsFromSolvedLayout(positions) {
        const solvedLayout = this.currentPuzzle.solved_layout;
        const answers = this.currentPuzzle.answers;
        
        // Find horizontal words
        Object.entries(answers.across).forEach(([num, word]) => {
            const pos = this.findWordInSolvedLayout(word, 'across', solvedLayout);
            if (pos) {
                positions[`${num}-across`] = pos;
            }
        });
        
        // Find vertical words  
        Object.entries(answers.down).forEach(([num, word]) => {
            const pos = this.findWordInSolvedLayout(word, 'down', solvedLayout);
            if (pos) {
                positions[`${num}-down`] = pos;
            }
        });
    }

    findWordInSolvedLayout(word, direction, solvedLayout) {
        // Search for the word in the solved layout
        for (let row = 0; row < solvedLayout.length; row++) {
            for (let col = 0; col < solvedLayout[row].length; col++) {
                if (this.wordMatchesAtPosition(word, row, col, direction, solvedLayout)) {
                    return {
                        row: row,
                        col: col,
                        length: word.length,
                        direction: direction
                    };
                }
            }
        }
        return null;
    }

    wordMatchesAtPosition(word, startRow, startCol, direction, solvedLayout) {
        const deltaRow = direction === 'down' ? 1 : 0;
        const deltaCol = direction === 'across' ? 1 : 0;
        
        // Check if word fits and matches at this position
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * deltaRow;
            const col = startCol + i * deltaCol;
            
            // Check bounds
            if (row >= solvedLayout.length || col >= solvedLayout[0].length) {
                return false;
            }
            
            // Check if letter matches
            if (solvedLayout[row][col] !== word[i]) {
                return false;
            }
        }
        
        return true;
    }

    findAllWordSlots(layout) {
        const slots = [];
        
        // Find horizontal word slots
        for (let row = 0; row < layout.length; row++) {
            let col = 0;
            while (col < layout[row].length) {
                if (layout[row][col] !== '#') {
                    // Found start of a potential word
                    const startCol = col;
                    let endCol = col;
                    
                    // Find the end of this word slot
                    while (endCol < layout[row].length && layout[row][endCol] !== '#') {
                        endCol++;
                    }
                    
                    // Only consider slots of length 2 or more
                    const length = endCol - startCol;
                    if (length >= 2) {
                        slots.push({
                            row: row,
                            col: startCol,
                            length: length,
                            direction: 'across'
                        });
                    }
                    
                    col = endCol;
                } else {
                    col++;
                }
            }
        }
        
        // Find vertical word slots
        for (let col = 0; col < layout[0].length; col++) {
            let row = 0;
            while (row < layout.length) {
                if (layout[row][col] !== '#') {
                    // Found start of a potential word
                    const startRow = row;
                    let endRow = row;
                    
                    // Find the end of this word slot
                    while (endRow < layout.length && layout[endRow][col] !== '#') {
                        endRow++;
                    }
                    
                    // Only consider slots of length 2 or more
                    const length = endRow - startRow;
                    if (length >= 2) {
                        slots.push({
                            row: startRow,
                            col: col,
                            length: length,
                            direction: 'down'
                        });
                    }
                    
                    row = endRow;
                } else {
                    row++;
                }
            }
        }
        
        return slots;
    }

    assignWordsToSlots(wordSlots, positions) {
        // Create lists of words by direction
        const acrossWords = Object.entries(this.currentPuzzle.answers.across).map(([num, word]) => ({
            num: parseInt(num),
            word: word,
            direction: 'across',
            key: `${num}-across`
        }));
        
        const downWords = Object.entries(this.currentPuzzle.answers.down).map(([num, word]) => ({
            num: parseInt(num),
            word: word,
            direction: 'down', 
            key: `${num}-down`
        }));
        
        // Assign across words to horizontal slots
        this.assignWordsToSlotsByDirection(acrossWords, wordSlots.filter(s => s.direction === 'across'), positions);
        
        // Assign down words to vertical slots  
        this.assignWordsToSlotsByDirection(downWords, wordSlots.filter(s => s.direction === 'down'), positions);
    }

    assignWordsToSlotsByDirection(words, slots, positions) {
        // Sort words by number (assuming lower numbers come first in crossword order)
        words.sort((a, b) => a.num - b.num);
        
        // Sort slots by position (top-left to bottom-right)
        slots.sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
        });
        
        // Simple assignment: match words to slots that can fit them
        const usedSlots = new Set();
        
        for (const wordObj of words) {
            let bestSlot = null;
            let bestScore = -1;
            
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                
                if (usedSlots.has(i)) continue;
                if (slot.length < wordObj.word.length) continue;
                
                // Score this slot based on word number and position
                let score = 1000 - (wordObj.num * 10); // Prefer lower word numbers
                score += (100 - slot.row * 10 - slot.col); // Prefer top-left positions
                
                // Bonus for exact fit
                if (slot.length === wordObj.word.length) {
                    score += 50;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestSlot = { ...slot, slotIndex: i };
                }
            }
            
            if (bestSlot) {
                positions[wordObj.key] = {
                    row: bestSlot.row,
                    col: bestSlot.col,
                    length: wordObj.word.length,
                    direction: wordObj.direction
                };
                usedSlots.add(bestSlot.slotIndex);
            }
        }
    }

    updateGridSize() {
        if (!this.currentPuzzle || !this.grid) return;

        const rows = this.currentPuzzle.layout.length;
        if (!rows || rows <= 0) return;

        const availableHeight = window.innerHeight * 0.9;
        const rawCellSize = availableHeight / rows;

        // Clamp cell size to reasonable bounds
        const cellSize = Math.max(24, Math.min(60, Math.floor(rawCellSize)));

        this.grid.style.setProperty('--cell-size', `${cellSize}px`);
    }



    getCellNumbers(row, col, wordPositions) {
        const numbers = [];
        
        Object.entries(wordPositions).forEach(([wordKey, pos]) => {
            if (pos.row === row && pos.col === col) {
                const num = parseInt(wordKey.split('-')[0]);
                numbers.push(num);
            }
        });
        
        return numbers;
    }

    renderClues() {
        this.renderCluesList(this.currentPuzzle.clues.across, this.acrossClues, 'across');
        this.renderCluesList(this.currentPuzzle.clues.down, this.downClues, 'down');
    }

    renderCluesList(clues, container, direction) {
        container.innerHTML = '';
        
        Object.entries(clues).forEach(([num, clue]) => {
            const cleanClue = this.sanitizeClueText(clue);
            const clueItem = document.createElement('div');
            clueItem.className = 'clue-item';
            clueItem.dataset.number = num;
            clueItem.dataset.direction = direction;
            
            const clueNumber = document.createElement('span');
            clueNumber.className = 'clue-number';
            clueNumber.textContent = `${num}.`;
            
            const clueText = document.createElement('span');
            clueText.className = 'clue-text';
            clueText.textContent = cleanClue;
            
            clueItem.appendChild(clueNumber);
            clueItem.appendChild(clueText);
            
            clueItem.addEventListener('click', () => this.selectWord(num, direction));
            
            container.appendChild(clueItem);
        });
    }

    handleCellClick(row, col) {
        const cell = this.getCell(row, col);
        if (cell.classList.contains('block')) return;
        
        // If clicking the same cell, toggle direction
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            this.direction = this.direction === 'across' ? 'down' : 'across';
            this.selectCell(row, col, true); // Re-select with new direction, force update
            return;
        }
        
        this.selectCell(row, col);
    }

    selectCell(row, col, forceUpdate = false) {
        // Prevent redundant selections of the same cell unless it's a forced update (direction change)
        if (!forceUpdate && this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            return;
        }
        
        this.selectedCell = { row, col };
        this.findAndSelectWord(row, col);
        this.updateGridHighlighting();
        this.updateCurrentClue();
        this.updateControls();
        
        // Focus the input in the selected cell
        const cell = this.getCell(row, col);
        const input = cell.querySelector('input');
        if (input) {
            input.focus();
        }
    }

    findAndSelectWord(row, col) {
        const wordPositions = this.calculateWordPositions();
        
        // Find words that contain this cell
        const containingWords = [];
        
        Object.entries(wordPositions).forEach(([wordKey, pos]) => {
            if (this.cellInWord(row, col, pos)) {
                containingWords.push(wordKey);
            }
        });
        
        if (containingWords.length === 0) {
            // No words found at this position, create a temporary word for the cell
            this.selectedWord = null;
            return;
        }
        
        // Select word based on current direction preference
        const preferredWord = containingWords.find(w => w.endsWith(this.direction));
        this.selectedWord = preferredWord || containingWords[0];
        
        // Only update direction if no word was found in the current direction
        // This prevents automatic direction switching when user has a preference
        if (!preferredWord && this.selectedWord) {
            this.direction = this.selectedWord.endsWith('across') ? 'across' : 'down';
        }
    }

    cellInWord(row, col, wordPos) {
        const deltaRow = wordPos.direction === 'down' ? 1 : 0;
        const deltaCol = wordPos.direction === 'across' ? 1 : 0;
        
        for (let i = 0; i < wordPos.length; i++) {
            const wordRow = wordPos.row + i * deltaRow;
            const wordCol = wordPos.col + i * deltaCol;
            
            if (wordRow === row && wordCol === col) {
                return true;
            }
        }
        
        return false;
    }

    selectWord(num, direction) {
        this.selectedWord = `${num}-${direction}`;
        this.direction = direction;
        
        // Find first cell of the word
        const wordPositions = this.calculateWordPositions();
        const wordPos = wordPositions[this.selectedWord];
        
        if (wordPos) {
            this.selectCell(wordPos.row, wordPos.col);
        }
    }

    updateGridHighlighting() {
        // Clear all highlighting
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlighted');
        });
        
        // Clear all clue highlighting
        document.querySelectorAll('.clue-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (!this.selectedCell || !this.selectedWord) return;
        
        // Highlight selected cell
        const selectedCell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        selectedCell.classList.add('selected');
        
        // Highlight word
        const wordPositions = this.calculateWordPositions();
        const wordPos = wordPositions[this.selectedWord];
        
        if (wordPos) {
            const deltaRow = wordPos.direction === 'down' ? 1 : 0;
            const deltaCol = wordPos.direction === 'across' ? 1 : 0;
            
            for (let i = 0; i < wordPos.length; i++) {
                const row = wordPos.row + i * deltaRow;
                const col = wordPos.col + i * deltaCol;
                const cell = this.getCell(row, col);
                
                if (row === this.selectedCell.row && col === this.selectedCell.col) {
                    cell.classList.add('selected');
                } else {
                    cell.classList.add('highlighted');
                }
            }
            
            // Highlight corresponding clue
            const [num, direction] = this.selectedWord.split('-');
            const clueItem = document.querySelector(`[data-number="${num}"][data-direction="${direction}"]`);
            if (clueItem) {
                clueItem.classList.add('active');
            }
        }
    }

    updateCurrentClue() {
        if (!this.selectedWord) {
            this.currentClueDisplay.style.display = 'none';
            return;
        }
        
        const [num, direction] = this.selectedWord.split('-');
        const clue = this.sanitizeClueText(this.currentPuzzle.clues[direction][num]);
        
        if (clue) {
            document.getElementById('current-clue-number').textContent = `${num} ${direction === 'across' ? 'Vannrett' : 'Loddrett'}:`;
            document.getElementById('current-clue-text').textContent = clue;
            this.currentClueDisplay.style.display = 'block';
        } else {
            this.currentClueDisplay.style.display = 'none';
        }
    }

    sanitizePuzzleClues() {
        if (!this.currentPuzzle || !this.currentPuzzle.clues) {
            return;
        }

        ['across', 'down'].forEach(direction => {
            const group = this.currentPuzzle.clues[direction];
            if (!group) {
                return;
            }
            Object.entries(group).forEach(([num, clue]) => {
                group[num] = this.sanitizeClueText(clue);
            });
        });
    }

    sanitizeClueText(clue) {
        if (!clue) {
            return '';
        }

        let text = String(clue).trim();
        const quoteSeparator = '" =';
        const separatorIndex = text.indexOf(quoteSeparator);
        if (separatorIndex !== -1) {
            text = text.slice(0, separatorIndex).trim();
        } else {
            const equalsIndex = text.indexOf(' = ');
            if (equalsIndex !== -1) {
                text = text.slice(0, equalsIndex).trim();
            }
        }

        text = text.replace(/^"+|"+$/g, '').trim();
        return text;
    }

    handleInput(event, row, col) {
        let value = event.target.value.toUpperCase();
        
        // Allow only Norwegian letters and clear with empty string
        if (!/^[A-ZÆØÅ]$/.test(value) && value !== '') {
            event.target.value = '';
            return;
        }
        
        // Always allow overwriting - clear the input first, then set new value
        event.target.value = value;
        
        // Clear any previous error marking when the user edits a cell
        const cell = this.getCell(row, col);
        if (cell) {
            cell.classList.remove('incorrect');
        }
        
        // Update cell appearance based on whether it's filled
        this.updateCellFilledState(row, col);
        
        // Update user answers for all words containing this cell
        this.updateUserAnswersForCell(row, col, value);
        
        // Auto-advance to next cell in current direction
        if (value !== '') {
            this.moveToNextCell();
        }
        
        this.updatePuzzleStats();
    }

    updateCellFilledState(row, col) {
        const cell = this.getCell(row, col);
        const input = cell.querySelector('input');
        
        if (input && input.value.trim() !== '') {
            cell.classList.add('filled');
        } else {
            cell.classList.remove('filled');
        }
    }

    updateUserAnswersForCell(row, col, value) {
        const wordPositions = this.calculateWordPositions();
        
        // Update all words that contain this cell
        Object.entries(wordPositions).forEach(([wordKey, wordPos]) => {
            if (this.cellInWord(row, col, wordPos)) {
                const deltaRow = wordPos.direction === 'down' ? 1 : 0;
                const deltaCol = wordPos.direction === 'across' ? 1 : 0;
                
                // Find position in word
                for (let i = 0; i < wordPos.length; i++) {
                    const wordRow = wordPos.row + i * deltaRow;
                    const wordCol = wordPos.col + i * deltaCol;
                    
                    if (wordRow === row && wordCol === col) {
                        // Initialize array if it doesn't exist
                        if (!this.userAnswers[wordKey]) {
                            this.userAnswers[wordKey] = Array(wordPos.length).fill('');
                        }
                        this.userAnswers[wordKey][i] = value;
                        break;
                    }
                }
            }
        });
    }

    moveToNextCell() {
        if (!this.selectedWord) return;
        
        const wordPos = this.calculateWordPositions()[this.selectedWord];
        if (!wordPos) return;
        
        const deltaRow = wordPos.direction === 'down' ? 1 : 0;
        const deltaCol = wordPos.direction === 'across' ? 1 : 0;
        
        // Find current position in word
        let currentIndex = -1;
        for (let i = 0; i < wordPos.length; i++) {
            const wordRow = wordPos.row + i * deltaRow;
            const wordCol = wordPos.col + i * deltaCol;
            
            if (wordRow === this.selectedCell.row && wordCol === this.selectedCell.col) {
                currentIndex = i;
                break;
            }
        }
        
        // Move to next cell if not at end, maintaining current direction
        if (currentIndex >= 0 && currentIndex < wordPos.length - 1) {
            const nextRow = wordPos.row + (currentIndex + 1) * deltaRow;
            const nextCol = wordPos.col + (currentIndex + 1) * deltaCol;
            
            // Save current direction before selecting next cell
            const currentDirection = this.direction;
            this.selectedCell = { row: nextRow, col: nextCol };
            this.direction = currentDirection; // Maintain direction
            
            // Find word in the same direction
            this.findAndSelectWordInDirection(nextRow, nextCol, currentDirection);
            this.updateGridHighlighting();
            this.updateCurrentClue();
            
            // Focus the input
            const nextCell = this.getCell(nextRow, nextCol);
            const input = nextCell.querySelector('input');
            if (input) {
                input.focus();
            }
        }
    }

    findAndSelectWordInDirection(row, col, direction) {
        const wordPositions = this.calculateWordPositions();
        
        // Find words that contain this cell in the specified direction
        const containingWords = [];
        
        Object.entries(wordPositions).forEach(([wordKey, pos]) => {
            if (this.cellInWord(row, col, pos) && wordKey.endsWith(direction)) {
                containingWords.push(wordKey);
            }
        });
        
        // Select the word in the current direction, or fallback to any word
        this.selectedWord = containingWords[0] || null;
        
        // Keep the direction consistent
        if (this.selectedWord) {
            this.direction = direction;
        }
    }

    handleKeydown(event, row, col) {
        // Handle special cases for better input control
        const { key } = event;
        
        // Allow backspace to clear
        if (key === 'Backspace') {
            event.target.value = '';
            this.updateCellFilledState(row, col);
            this.updateUserAnswersForCell(row, col, '');
            this.updatePuzzleStats();
            return;
        }
        
        // Allow letters to overwrite existing content
        if (/^[A-Za-zÆØÅæøå]$/.test(key)) {
            // Clear current value to allow overwrite
            event.target.value = '';
        }
    }

    handleKeypress(event) {
        if (!this.selectedCell) return;
        
        const { key } = event;
        
        // Handle arrow keys for navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            event.preventDefault();
            this.navigateWithArrows(key);
            return;
        }
        
        // Handle backspace
        if (key === 'Backspace') {
            const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
            const input = cell.querySelector('input');
            if (input && input.value === '') {
                this.moveToPreviousCell();
            }
            return;
        }
        
        // Handle space bar to change direction
        if (key === ' ') {
            event.preventDefault();
            this.direction = this.direction === 'across' ? 'down' : 'across';
            this.findAndSelectWord(this.selectedCell.row, this.selectedCell.col);
            this.updateGridHighlighting();
            this.updateCurrentClue();
            return;
        }
    }

    navigateWithArrows(key) {
        // Check if arrow key is perpendicular to current direction - if so, swap direction
        const isPerpendicular = 
            (this.direction === 'across' && (key === 'ArrowUp' || key === 'ArrowDown')) ||
            (this.direction === 'down' && (key === 'ArrowLeft' || key === 'ArrowRight'));
        
        if (isPerpendicular) {
            // Swap direction instead of moving
            this.direction = this.direction === 'across' ? 'down' : 'across';
            this.findAndSelectWord(this.selectedCell.row, this.selectedCell.col);
            this.updateGridHighlighting();
            this.updateCurrentClue();
            return;
        }
        
        // Normal navigation for parallel direction keys
        let newRow = this.selectedCell.row;
        let newCol = this.selectedCell.col;
        
        switch (key) {
            case 'ArrowUp': newRow--; break;
            case 'ArrowDown': newRow++; break;
            case 'ArrowLeft': newCol--; break;
            case 'ArrowRight': newCol++; break;
        }
        
        if (this.isValidCell(newRow, newCol)) {
            this.selectCell(newRow, newCol);
            const cell = this.getCell(newRow, newCol);
            const input = cell.querySelector('input');
            if (input) {
                input.focus();
            }
        }
    }

    moveToPreviousCell() {
        if (!this.selectedWord) return;
        
        const wordPos = this.calculateWordPositions()[this.selectedWord];
        if (!wordPos) return;
        
        const deltaRow = wordPos.direction === 'down' ? 1 : 0;
        const deltaCol = wordPos.direction === 'across' ? 1 : 0;
        
        // Find current position in word
        let currentIndex = -1;
        for (let i = 0; i < wordPos.length; i++) {
            const wordRow = wordPos.row + i * deltaRow;
            const wordCol = wordPos.col + i * deltaCol;
            
            if (wordRow === this.selectedCell.row && wordCol === this.selectedCell.col) {
                currentIndex = i;
                break;
            }
        }
        
        // Move to previous cell if not at start
        if (currentIndex > 0) {
            const prevRow = wordPos.row + (currentIndex - 1) * deltaRow;
            const prevCol = wordPos.col + (currentIndex - 1) * deltaCol;
            this.selectCell(prevRow, prevCol);
            
            const prevCell = this.getCell(prevRow, prevCol);
            const input = prevCell.querySelector('input');
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    isValidCell(row, col) {
        const layout = this.currentPuzzle.layout;
        return row >= 0 && row < layout.length && 
               col >= 0 && col < layout[0].length && 
               layout[row][col] !== '#';
    }

    getCell(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // Checking and revealing functions
    checkLetter() {
        if (!this.selectedCell) return;
        
        const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        const input = cell.querySelector('input');
        const userLetter = input.value.toUpperCase();
        
        if (!userLetter) return;
        
        const correctLetter = this.getCorrectLetter(this.selectedCell.row, this.selectedCell.col);
        
        if (userLetter === correctLetter) {
            // Correct letter: keep default styling, just clear any previous error
            cell.classList.remove('incorrect');
        } else {
            // Incorrect letter: mark in red
            cell.classList.add('incorrect');
        }
    }

    checkWord() {
        if (!this.selectedWord) return;
        
        const [num, direction] = this.selectedWord.split('-');
        const correctWord = this.currentPuzzle.answers[direction][num];
        const userWord = this.userAnswers[this.selectedWord].join('');
        
        const wordPos = this.calculateWordPositions()[this.selectedWord];
        if (!wordPos) return;
        
        const deltaRow = wordPos.direction === 'down' ? 1 : 0;
        const deltaCol = wordPos.direction === 'across' ? 1 : 0;
        
        let allCorrect = true;
        
        // Check each letter individually
        for (let i = 0; i < wordPos.length; i++) {
            const row = wordPos.row + i * deltaRow;
            const col = wordPos.col + i * deltaCol;
            const cell = this.getCell(row, col);
            const input = cell.querySelector('input');
            
            const userLetter = input.value.toUpperCase();
            const correctLetter = correctWord[i].toUpperCase();
            
            if (userLetter === '') {
                // Empty cell - no feedback
                cell.classList.remove('incorrect');
                allCorrect = false;
            } else if (userLetter === correctLetter) {
                // Correct letter - keep default styling, clear any previous error
                cell.classList.remove('incorrect');
            } else {
                // Incorrect letter - show red and mark word as not fully correct
                cell.classList.add('incorrect');
                allCorrect = false;
            }
        }
        
        // Mark word as completed if all letters are correct
        if (allCorrect) {
            this.completedWords.add(this.selectedWord);
        }
        
        this.updateClueStatus();
        this.updatePuzzleStats();
    }

    checkAll() {
        const wordPositions = this.calculateWordPositions();

        Object.keys(this.userAnswers).forEach(wordKey => {
            const [num, direction] = wordKey.split('-');
            const correctWord = this.currentPuzzle.answers[direction][num];
            const wordPos = wordPositions[wordKey];

            if (!wordPos) return;

            const deltaRow = wordPos.direction === 'down' ? 1 : 0;
            const deltaCol = wordPos.direction === 'across' ? 1 : 0;

            let allCorrect = true;

            for (let i = 0; i < wordPos.length; i++) {
                const row = wordPos.row + i * deltaRow;
                const col = wordPos.col + i * deltaCol;
                const cell = this.getCell(row, col);
                const input = cell.querySelector('input');

                const userLetter = input.value.toUpperCase();
                const correctLetter = correctWord[i].toUpperCase();

                if (userLetter === '') {
                    cell.classList.remove('incorrect');
                    allCorrect = false;
                } else if (userLetter === correctLetter) {
                    cell.classList.remove('incorrect');
                } else {
                    cell.classList.add('incorrect');
                    allCorrect = false;
                }
            }

            if (allCorrect) {
                this.completedWords.add(wordKey);
            }
        });
        
        this.updateClueStatus();
        this.updatePuzzleStats();
        
        // Check if puzzle is complete
        const totalWords = Object.keys(this.userAnswers).length;
        if (this.completedWords.size === totalWords) {
            setTimeout(() => {
                alert('Gratulerer! Du har fullført kryssordet! 🎉');
            }, 500);
        }
    }

    revealLetter() {
        if (!this.selectedCell) return;
        
        const correctLetter = this.getCorrectLetter(this.selectedCell.row, this.selectedCell.col);
        const cell = this.getCell(this.selectedCell.row, this.selectedCell.col);
        const input = cell.querySelector('input');
        
        input.value = correctLetter;
        cell.classList.add('revealed');
        cell.classList.remove('incorrect');
        this.updateCellFilledState(this.selectedCell.row, this.selectedCell.col);
        
        // Update user answers
        this.updateUserAnswersFromGrid();
        this.updatePuzzleStats();
    }

    revealWord() {
        if (!this.selectedWord) return;
        
        const [num, direction] = this.selectedWord.split('-');
        const correctWord = this.currentPuzzle.answers[direction][num];
        const wordPos = this.calculateWordPositions()[this.selectedWord];
        
        if (!wordPos) return;
        
        const deltaRow = wordPos.direction === 'down' ? 1 : 0;
        const deltaCol = wordPos.direction === 'across' ? 1 : 0;
        
        for (let i = 0; i < wordPos.length; i++) {
            const row = wordPos.row + i * deltaRow;
            const col = wordPos.col + i * deltaCol;
            const cell = this.getCell(row, col);
            const input = cell.querySelector('input');
            
            input.value = correctWord[i];
            cell.classList.add('revealed');
            cell.classList.remove('incorrect');
            this.updateCellFilledState(row, col);
        }
        
        this.completedWords.add(this.selectedWord);
        this.updateUserAnswersFromGrid();
        this.updateClueStatus();
        this.updatePuzzleStats();
    }

    // Utility functions
    getCorrectLetter(row, col) {
        const wordPositions = this.calculateWordPositions();
        
        for (const [wordKey, wordPos] of Object.entries(wordPositions)) {
            if (this.cellInWord(row, col, wordPos)) {
                const [num, direction] = wordKey.split('-');
                const correctWord = this.currentPuzzle.answers[direction][num];
                
                const deltaRow = wordPos.direction === 'down' ? 1 : 0;
                const deltaCol = wordPos.direction === 'across' ? 1 : 0;
                
                for (let i = 0; i < wordPos.length; i++) {
                    const wordRow = wordPos.row + i * deltaRow;
                    const wordCol = wordPos.col + i * deltaCol;
                    
                    if (wordRow === row && wordCol === col) {
                        return correctWord[i];
                    }
                }
            }
        }
        
        return '';
    }

    updateUserAnswersFromGrid() {
        const wordPositions = this.calculateWordPositions();
        
        Object.entries(wordPositions).forEach(([wordKey, wordPos]) => {
            const deltaRow = wordPos.direction === 'down' ? 1 : 0;
            const deltaCol = wordPos.direction === 'across' ? 1 : 0;
            
            const userWord = [];
            for (let i = 0; i < wordPos.length; i++) {
                const row = wordPos.row + i * deltaRow;
                const col = wordPos.col + i * deltaCol;
                const cell = this.getCell(row, col);
                const input = cell.querySelector('input');
                userWord.push(input.value.toUpperCase());
            }
            
            this.userAnswers[wordKey] = userWord;
        });
    }

    updateControls() {
        const hasSelection = this.selectedCell !== null;
        const hasWordSelection = this.selectedWord !== null;
        
        this.checkLetterBtn.disabled = !hasSelection;
        this.checkWordBtn.disabled = !hasWordSelection;
        this.revealLetterBtn.disabled = !hasSelection;
        this.revealWordBtn.disabled = !hasWordSelection;
    }

    updateClueStatus() {
        document.querySelectorAll('.clue-item').forEach(item => {
            const num = item.dataset.number;
            const direction = item.dataset.direction;
            const wordKey = `${num}-${direction}`;
            
            if (this.completedWords.has(wordKey)) {
                item.classList.add('completed');
            } else {
                item.classList.remove('completed');
            }
        });
    }

    updatePuzzleInfo() {
        if (!this.currentPuzzle) return;
        
        // Alltid vis en konsistent tittel i UI uavhengig av metadata
        this.puzzleTitle.textContent = 'Dagens kryssord';

        // Vanskelighetsgrad vises ikke lenger (elementet er skjult i HTML/CSS),
        // så vi lar være å oppdatere teksten her.
    }

    updatePuzzleStats() {
        const totalWords = Object.keys(this.userAnswers).length;
        const completedCount = this.completedWords.size;
        
        this.puzzleStats.textContent = `${completedCount}/${totalWords} ord ferdig`;
    }

    // Debug method to log word positions for troubleshooting
    debugWordPositions() {
        const positions = this.calculateWordPositions();
        console.log('=== DEBUG: Word Positions ===');
        console.log('Calculated positions:', positions);
        console.log('Puzzle answers across:', this.currentPuzzle.answers.across);
        console.log('Puzzle answers down:', this.currentPuzzle.answers.down);
        console.log('Empty layout:', this.currentPuzzle.layout);
        console.log('Solved layout:', this.currentPuzzle.solved_layout);
        console.log('User answers:', this.userAnswers);
        
        // Show solved layout in a readable format
        if (this.currentPuzzle.solved_layout) {
            console.log('=== SOLVED LAYOUT VISUALIZATION ===');
            this.currentPuzzle.solved_layout.forEach((row, index) => {
                console.log(`Row ${index}: ${row}`);
            });
        }
        
        return positions;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CrosswordGame();
});