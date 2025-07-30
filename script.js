document.addEventListener('DOMContentLoaded', () => {
    const proofTextContainer = document.getElementById('proof-text');
    const fontSearchInput = document.getElementById('font-search');
    const applyArialButton = document.getElementById('apply-arial');
    const applyHelveticaButton = document.getElementById('apply-helvetica');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'suggestions-container';
    fontSearchInput.parentNode.insertBefore(suggestionsContainer, fontSearchInput.nextSibling);
    const toggleSwitch = document.getElementById('toggle-switch');
    
    const toggleSlider = document.querySelector('.toggle-slider');
    const fontNameHeading = document.getElementById('font-name-heading');
    const apiErrorMessage = document.getElementById('api-error-message');

    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const increaseSizeBtn = document.getElementById('increase-size-btn');
    const decreaseSizeBtn = document.getElementById('decrease-size-btn');

    let availableFonts = ['Helvetica', 'Arial']; // Default fonts
    let proofTexts = { lowercase: '', uppercase: '' };
    let currentProof = 'lowercase';
    let selectedSuggestionIndex = -1;
    let currentFontSize = 20;

    // Function to set default fonts and show error message
    const setDefaultFonts = () => {
        availableFonts = ['Helvetica', 'Arial'];
        apiErrorMessage.style.display = 'block';
    };

    // Fetch Google Fonts list
    fetch('https://prooftext.gvenkata1994.workers.dev')
        .then(response => response.text())
        .then(apiKey => {
            fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch Google Fonts list.');
                    return response.json();
                })
                .then(data => {
                    if (data.items) {
                        availableFonts = data.items.map(font => font.family);
                        apiErrorMessage.style.display = 'none';
                    } else {
                        setDefaultFonts();
                    }
                })
                .catch(error => {
                    console.error('Error fetching Google Fonts:', error);
                    setDefaultFonts();
                });
        })
        .catch(error => {
            console.error('Error fetching API key:', error);
            setDefaultFonts();
        });

    // Fetch and display the proof text
    const loadProofTexts = async () => {
        try {
            const [lower, upper] = await Promise.all([
                fetch('lowercase.txt').then(res => res.text()),
                fetch('uppercase.txt').then(res => res.text())
            ]);
            proofTexts = { lowercase: lower, uppercase: upper };
            updateProofText();
            applyFont('Helvetica'); // Apply default font on load
        } catch (error) {
            console.error('Error loading proof text:', error);
            proofTextContainer.textContent = 'Error: Could not load proof text files.';
        }
    };

    const updateProofText = () => {
        proofTextContainer.innerText = proofTexts[currentProof];
        proofTextContainer.style.fontVariant = 'normal';
    };

    loadProofTexts();

    // Handle font application
    const applyFont = (fontName) => {
        if (fontName) {
            if (availableFonts.includes(fontName) && !['Helvetica', 'Arial'].includes(fontName)) {
                const fontUrl = `https://fonts.googleapis.com/css?family=${fontName.replace(/ /g, '+')}`;
                let link = document.querySelector(`link[href="${fontUrl}"]`);
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = fontUrl;
                    document.head.appendChild(link);
                }
            }
            proofTextContainer.style.fontFamily = `'${fontName}', sans-serif`;
            fontNameHeading.style.fontFamily = `'${fontName}', sans-serif`;
            fontNameHeading.textContent = fontName;
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    };

    const updateSuggestionSelection = () => {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion');
        suggestions.forEach((suggestion, index) => {
            if (index === selectedSuggestionIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    };

    applyArialButton.addEventListener('click', () => applyFont("Arial"));
    applyHelveticaButton.addEventListener('click', () => applyFont("Helvetica"));
    
    fontSearchInput.addEventListener('keydown', (e) => {
        const suggestions = Array.from(suggestionsContainer.querySelectorAll('.suggestion'));
        if (suggestionsContainer.style.display === 'none' || suggestions.length === 0) {
            if (e.key === 'Enter') {
                applyFont(fontSearchInput.value.trim());
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex++;
            if (selectedSuggestionIndex >= suggestions.length) {
                selectedSuggestionIndex = 0;
            }
            updateSuggestionSelection();
            fontSearchInput.value = suggestions[selectedSuggestionIndex].textContent;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex--;
            if (selectedSuggestionIndex < 0) {
                selectedSuggestionIndex = suggestions.length - 1;
            }
            updateSuggestionSelection();
            fontSearchInput.value = suggestions[selectedSuggestionIndex].textContent;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex > -1) {
                applyFont(suggestions[selectedSuggestionIndex].textContent);
            } else {
                applyFont(fontSearchInput.value.trim());
            }
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        } else if (e.key === 'Escape') {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
    });

    // Autocomplete functionality
    fontSearchInput.addEventListener('input', () => {
        const inputText = fontSearchInput.value.trim().toLowerCase();
        selectedSuggestionIndex = -1;
        if (inputText.length === 0) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
            return;
        }

        const suggestions = availableFonts.filter(font => font.toLowerCase().includes(inputText));
        suggestionsContainer.innerHTML = '';
        if (suggestions.length > 0) {
            suggestions.slice(0, 5).forEach((suggestion, index) => {
                const suggestionElement = document.createElement('div');
                suggestionElement.textContent = suggestion;
                suggestionElement.classList.add('suggestion');
                suggestionElement.addEventListener('click', () => {
                    fontSearchInput.value = suggestion;
                    applyFont(suggestion);
                });
                suggestionElement.addEventListener('mouseover', () => {
                    selectedSuggestionIndex = index;
                    updateSuggestionSelection();
                });
                suggestionsContainer.appendChild(suggestionElement);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== fontSearchInput) {
            suggestionsContainer.style.display = 'none';
        }
    });

    // Toggle switch functionality
    toggleSwitch.addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-option')) {
            currentProof = e.target.dataset.proof;
            document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            updateProofText();

            const options = Array.from(e.currentTarget.querySelectorAll('.toggle-option'));
            const index = options.findIndex(opt => opt === e.target);
            if (index !== -1) {
                toggleSlider.style.transform = `translateX(${index * 100}%)`;
            }
        }
    });

    // Control button functionality
    boldBtn.addEventListener('click', () => {
        proofTextContainer.style.fontWeight = proofTextContainer.style.fontWeight === 'bold' ? 'normal' : 'bold';
        boldBtn.classList.toggle('active');
    });

    italicBtn.addEventListener('click', () => {
        proofTextContainer.style.fontStyle = proofTextContainer.style.fontStyle === 'italic' ? 'normal' : 'italic';
        italicBtn.classList.toggle('active');
    });

    increaseSizeBtn.addEventListener('click', () => {
        currentFontSize+=2;
        proofTextContainer.style.fontSize = `${currentFontSize}px`;
    });

    decreaseSizeBtn.addEventListener('click', () => {
        currentFontSize-=2;
        proofTextContainer.style.fontSize = `${currentFontSize}px`;
    });
});