const imageElement = document.getElementById('story-image');
const situationElement = document.getElementById('situation-text');
const choicesElement = document.getElementById('choices');
const loadingElement = document.getElementById('loading-indicator'); // Add a loading spinner/text element
const scoreElement = document.getElementById('score-display'); // Add element to show score
const endScreenElement = document.getElementById('end-screen'); // Add a container for the end screen
const mangaImageElement = document.getElementById('manga-image');
const summaryImageElement = document.getElementById('summary-image');
const endTextElement = document.getElementById('end-text');

// Add these new elements for the share modal
const shareModalElement = document.getElementById('share-modal');
const shareMangaImageElement = document.getElementById('share-manga-image');
const shareLoadingElement = document.getElementById('share-loading');
const closeModalButton = document.querySelector('.close-modal');
const downloadImageButton = document.getElementById('download-image');
const copyImageButton = document.getElementById('copy-image');
const shareTwitterButton = document.getElementById('share-twitter');
const shareFacebookButton = document.getElementById('share-facebook');

function showLoading(isLoading) {
    if (isLoading) {
        // Set up the loading indicator with animation
        loadingElement.textContent = 'Loading your adventure';
        loadingElement.style.opacity = '0';
        loadingElement.style.display = 'block';

        setTimeout(() => {
            loadingElement.style.transition = 'opacity 0.3s ease';
            loadingElement.style.opacity = '1';
        }, 50);

        // Hide choices with fade-out
        if (choicesElement.style.display !== 'none') {
            choicesElement.style.transition = 'opacity 0.3s ease';
            choicesElement.style.opacity = '0';

            setTimeout(() => {
                choicesElement.style.display = 'none';
            }, 300);
        } else {
            choicesElement.style.display = 'none';
        }
    } else {
        // Hide loading with fade-out
        loadingElement.style.transition = 'opacity 0.3s ease';
        loadingElement.style.opacity = '0';

        setTimeout(() => {
            loadingElement.style.display = 'none';

            // Show choices with fade-in if they were hidden
            if (choicesElement.style.display === 'none') {
                choicesElement.style.opacity = '0';
                choicesElement.style.display = 'block';

                setTimeout(() => {
                    choicesElement.style.transition = 'opacity 0.5s ease';
                    choicesElement.style.opacity = '1';
                }, 50);
            }
        }, 300);
    }
}

async function updateGameState(retryCount = 0) {
    showLoading(true);
    console.log("Starting updateGameState, retryCount:", retryCount);

    // Clear previous state
    endScreenElement.style.display = 'none';
    endTextElement.innerHTML = '';
    situationElement.textContent = '';
    imageElement.src = '';
    mangaImageElement.src = '';
    summaryImageElement.src = '';
    choicesElement.innerHTML = '';

    // Remove any reset containers from the end screen
    const existingEndScreenResetContainers = endScreenElement.querySelectorAll('.reset-container');
    existingEndScreenResetContainers.forEach(container => container.remove());

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        console.log("Fetching state from API...");
        const response = await fetch('/api/state', {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        clearTimeout(timeoutId);
        console.log("API response status:", response.status);

        if (!response.ok) {
            // If we get a 500 error from Vercel, it's likely a serverless function startup issue
            if (response.status === 500 && retryCount < 3) {
                console.log(`Server returned 500 error. Retry attempt ${retryCount + 1}/3...`);
                situationElement.textContent = `Server is starting up... Retrying (${retryCount + 1}/3)`;

                // Wait longer between each retry (exponential backoff)
                const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000);

                setTimeout(() => {
                    updateGameState(retryCount + 1);
                }, retryDelay);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response data:", data);

        // Validate the data received
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            throw new Error("Received empty response from server");
        }

        if (!data.image_url) {
            console.warn("Response missing image_url, may cause display issues");
        }

        renderState(data);
    } catch (error) {
        console.error("Error fetching game state:", error);

        // Check if we should retry
        if (retryCount < 3) {
            situationElement.textContent = `Error loading game state. Retrying in ${retryCount + 1} seconds...`;

            // Exponential backoff for retries
            setTimeout(() => {
                situationElement.textContent = "Attempting to reconnect...";
                updateGameState(retryCount + 1);
            }, (retryCount + 1) * 1000);
        } else {
            situationElement.textContent = `Error loading game state: ${error.message}. Please try reset or refresh.`;

            // Always show the reset button when there's an error
            choicesElement.innerHTML = '';
            const resetContainer = document.createElement('div');
            resetContainer.className = 'reset-container';

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset Game';
            resetButton.className = 'reset-button';
            resetButton.addEventListener('click', resetGame);
            resetContainer.appendChild(resetButton);

            const refreshBtn = document.createElement('button');
            refreshBtn.textContent = 'Refresh Page';
            refreshBtn.className = 'reset-button';
            refreshBtn.style.marginLeft = '10px';
            refreshBtn.addEventListener('click', () => window.location.reload());
            resetContainer.appendChild(refreshBtn);

            choicesElement.appendChild(resetContainer);
        }
    } finally {
        showLoading(false);
    }
}

function renderState(data) {
    console.log("Rendering state:", data);
    console.log("API Response details:", JSON.stringify(data));

    // Update score - check both current_score and score properties
    const score = data.current_score !== undefined ? data.current_score :
        (data.score !== undefined ? data.score : 0);
    scoreElement.textContent = `Score: ${score}`;

    // Update image with fade-in effect
    imageElement.style.opacity = '0';
    imageElement.src = data.image_url || '';
    imageElement.alt = data.image_prompt || 'Story scene';
    imageElement.onload = () => {
        imageElement.style.transition = 'opacity 0.5s ease';
        imageElement.style.opacity = '1';
    };
    imageElement.style.display = 'block';

    // Animate situation text
    situationElement.style.opacity = '0';
    setTimeout(() => {
        // Check multiple possible locations for situation text
        const situationText = data.situation ||
            (data.current_node && data.current_node.situation) ||
            'Loading...';
        situationElement.textContent = situationText;
        situationElement.style.transition = 'opacity 0.8s ease';
        situationElement.style.opacity = '1';
    }, 300);

    // Clear all content in choices
    choicesElement.innerHTML = '';

    // Add a single reset button at the top
    const resetContainer = document.createElement('div');
    resetContainer.className = 'reset-container';

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Game';
    resetButton.className = 'reset-button';
    resetButton.addEventListener('click', resetGame);
    resetContainer.appendChild(resetButton);

    choicesElement.appendChild(resetContainer);

    // Get choices from multiple possible locations in the response
    const choices = data.choices ||
        (data.current_node && data.current_node.choices) ||
        [];

    console.log("Choices found:", choices);

    if (data.is_end) {
        // Handle End Screen
        displayEndScreen(data);
    } else if (choices && choices.length > 0) {
        // Create choice buttons with staggered animation
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text || `Choice ${index + 1}`;
            button.dataset.index = index;
            button.addEventListener('click', handleChoiceClick);
            button.style.opacity = '0';
            button.style.transform = 'translateY(20px)';
            choicesElement.appendChild(button);

            // Staggered animation for buttons
            setTimeout(() => {
                button.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, 500 + (index * 100)); // Stagger by 100ms per button
        });
    } else {
        // No choices, maybe an intermediate state or error
        console.error("No choices found in response data");
        situationElement.textContent += "\n (No choices available)";
    }
}

async function handleChoiceClick(event, retryCount = 0) {
    showLoading(true);

    const choiceIndex = event.target.dataset.index;
    console.log(`Selected choice ${choiceIndex}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/choice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({ choice_index: choiceIndex }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // If we get a 500 error from Vercel, it's likely a serverless function startup issue
            if (response.status === 500 && retryCount < 3) {
                console.log(`Server returned 500 error on choice. Retry attempt ${retryCount + 1}/3...`);
                situationElement.textContent = `Server is processing... Retrying choice (${retryCount + 1}/3)`;

                // Wait longer between each retry (exponential backoff)
                const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000);

                setTimeout(() => {
                    handleChoiceClick(event, retryCount + 1);
                }, retryDelay);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderState(data);
    } catch (error) {
        console.error("Error making choice:", error);

        // Check if we should retry
        if (retryCount < 3) {
            situationElement.textContent = `Error making choice. Retrying in ${retryCount + 1} seconds...`;

            // Exponential backoff for retries
            setTimeout(() => {
                situationElement.textContent = "Attempting to submit choice again...";
                handleChoiceClick(event, retryCount + 1);
            }, (retryCount + 1) * 1000);
        } else {
            situationElement.textContent = `Error making choice: ${error.message}. Please try again or reset.`;

            // Add buttons to help user recover
            choicesElement.innerHTML = '';

            // Re-add the original button
            const originalButton = document.createElement('button');
            originalButton.textContent = event.target.textContent;
            originalButton.dataset.index = choiceIndex;
            originalButton.addEventListener('click', handleChoiceClick);
            choicesElement.appendChild(originalButton);

            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset Game';
            resetButton.className = 'reset-button';
            resetButton.addEventListener('click', resetGame);
            choicesElement.appendChild(resetButton);

            // Add refresh button
            const refreshBtn = document.createElement('button');
            refreshBtn.textContent = 'Refresh Page';
            refreshBtn.className = 'reset-button';
            refreshBtn.addEventListener('click', () => window.location.reload());
            choicesElement.appendChild(refreshBtn);
        }
    } finally {
        showLoading(false);
    }
}

function displayEndScreen(data) {
    // Hide the main choices
    choicesElement.style.display = 'none';
    imageElement.style.display = 'none';

    // Show end screen
    endScreenElement.style.display = 'block';
    endScreenElement.style.opacity = '0';

    // Create end text content
    const score = data.score || 0;
    const endingCategory = data.current_node.ending_category || 'Adventure Complete';

    let endContent = `
        <h2>${endingCategory}</h2>
        <div class="score-display">
            <span class="score-label">Final Score</span>
            <span class="score-value">${score}</span>
            <div class="star-rating">${'★'.repeat(Math.min(5, Math.max(1, Math.ceil(score / 2))))}</div>
        </div>
        <div class="end-message">${data.current_node.situation || ''}</div>
    `;

    endTextElement.innerHTML = endContent;

    // Load the manga-style image with fade-in effect
    if (data.manga_image_url) {
        mangaImageElement.style.opacity = '0';
        mangaImageElement.style.display = 'block';
        mangaImageElement.src = data.manga_image_url;
        mangaImageElement.onload = () => {
            mangaImageElement.style.transition = 'opacity 0.8s ease';
            mangaImageElement.style.opacity = '1';
        };
        mangaImageElement.onerror = () => {
            console.error('Failed to load manga image');
            mangaImageElement.style.display = 'none';
        };
    } else {
        mangaImageElement.style.display = 'none';
    }

    // Load the summary image with fade-in effect
    if (data.summary_image_url) {
        summaryImageElement.style.opacity = '0';
        summaryImageElement.style.display = 'block';
        summaryImageElement.src = data.summary_image_url;
        summaryImageElement.onload = () => {
            summaryImageElement.style.transition = 'opacity 0.8s ease';
            summaryImageElement.style.opacity = '1';
        };
        summaryImageElement.onerror = () => {
            console.error('Failed to load summary image');
            summaryImageElement.style.display = 'none';
        };
    } else {
        summaryImageElement.style.display = 'none';
    }

    // Add a reset container with custom styling for the end screen
    const resetContainer = document.createElement('div');
    resetContainer.className = 'reset-container end-reset';

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Play Again';
    resetButton.className = 'reset-button end-reset-button';
    resetButton.addEventListener('click', resetGame);

    const shareButton = document.createElement('button');
    shareButton.textContent = 'Share Your Story';
    shareButton.className = 'reset-button share-button';

    // Update share button click handler to open the modal
    shareButton.addEventListener('click', () => {
        openShareModal(score, endingCategory);
    });

    resetContainer.appendChild(resetButton);
    resetContainer.appendChild(shareButton);
    endScreenElement.appendChild(resetContainer);

    // Fade in the end screen
    setTimeout(() => {
        endScreenElement.style.transition = 'opacity 1s ease';
        endScreenElement.style.opacity = '1';
    }, 500);
}

// New function to open the share modal and generate shareable image
async function openShareModal(score, endingCategory) {
    // Show the modal
    shareModalElement.style.display = 'block';

    // Clear any previous image
    shareMangaImageElement.style.display = 'none';
    shareMangaImageElement.src = '';

    // Show loading indicator
    shareLoadingElement.style.display = 'block';

    try {
        // Fetch the shareable image from our API
        const response = await fetch('/api/share-image');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Hide loading and show the image
        shareLoadingElement.style.display = 'none';
        shareMangaImageElement.style.display = 'block';
        shareMangaImageElement.src = data.share_image_url;

        // Setup share buttons with the appropriate data
        setupShareButtons(data.share_image_url, score, endingCategory);

    } catch (error) {
        console.error("Error generating share image:", error);
        shareLoadingElement.textContent = `Error generating image: ${error.message}. Please try again.`;

        // Add a retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.className = 'action-button';
        retryButton.style.marginTop = '15px';
        retryButton.addEventListener('click', () => {
            openShareModal(score, endingCategory);
        });

        shareLoadingElement.appendChild(retryButton);
    }
}

// Setup the share buttons with the correct URLs and functionality
function setupShareButtons(imageUrl, score, endingCategory) {
    // Setup download button
    downloadImageButton.onclick = () => {
        downloadImage(imageUrl, 'mystic-forest-adventure.jpg');
    };

    // Setup copy button
    copyImageButton.onclick = () => {
        copyImageToClipboard(imageUrl);
    };

    // Setup social share buttons
    const shareText = `I completed Mystic Forest Adventure with a score of ${score} and discovered the "${endingCategory}" ending! Can you do better?`;
    const shareUrl = window.location.href;

    // Twitter share
    shareTwitterButton.onclick = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    // Facebook share
    shareFacebookButton.onclick = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank');
    };
}

// Function to download the image
function downloadImage(url, filename) {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // Add to body, click it to trigger download, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Function to copy image to clipboard using Fetch API to get the blob
async function copyImageToClipboard(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        // Check if the Clipboard API is available and can handle images
        if (navigator.clipboard && navigator.clipboard.write) {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            alert('Image copied to clipboard!');
        } else {
            // Fallback for browsers that don't support copying images
            alert('Your browser doesn\'t support copying images. Please use the Download button instead.');
        }
    } catch (error) {
        console.error('Error copying image to clipboard:', error);
        alert('Failed to copy image. Please try downloading it instead.');
    }
}

// Close the modal when clicking the X
closeModalButton.addEventListener('click', () => {
    shareModalElement.style.display = 'none';
});

// Close the modal when clicking outside the content
window.addEventListener('click', (event) => {
    if (event.target === shareModalElement) {
        shareModalElement.style.display = 'none';
    }
});

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    // Try to use the modern clipboard API first
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Story copied to clipboard! You can now share it with friends.');
            })
            .catch(err => {
                console.error('Clipboard write failed:', err);
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    // Create a temporary input element
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);

    // Select and copy
    input.select();
    document.execCommand('copy');

    // Clean up
    document.body.removeChild(input);

    // Notify user
    alert('Story copied to clipboard! You can now share it with friends.');
}

async function resetGame(retryCount = 0) {
    showLoading(true);

    // Hide end screen
    endScreenElement.style.display = 'none';

    // Clear end screen content to prevent duplicates on subsequent resets
    endTextElement.innerHTML = '';
    mangaImageElement.src = '';
    summaryImageElement.src = '';

    // Remove any existing reset containers from the end screen
    const existingEndScreenResetContainers = endScreenElement.querySelectorAll('.reset-container');
    existingEndScreenResetContainers.forEach(container => container.remove());

    // Show normal image
    imageElement.style.display = 'block';
    situationElement.textContent = 'Resetting game...';

    // Clear the choices area
    choicesElement.innerHTML = '';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/reset', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // If we get a 500 error from Vercel, it's likely a serverless function startup issue
            if (response.status === 500 && retryCount < 3) {
                console.log(`Server returned 500 error on reset. Retry attempt ${retryCount + 1}/3...`);
                situationElement.textContent = `Server is starting up... Retrying reset (${retryCount + 1}/3)`;

                // Wait longer between each retry (exponential backoff)
                const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000);

                setTimeout(() => {
                    resetGame(retryCount + 1);
                }, retryDelay);
                return;
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if we got a valid game state
        if (!data || (!data.situation && !data.current_score && !data.choices)) {
            console.error("Invalid state received after reset:", data);
            // If we didn't get a valid state, fetch it explicitly
            await updateGameState();
        } else {
            // Render the state we received
            renderState(data);
        }
    } catch (error) {
        console.error("Error resetting game:", error);

        // Check if we should retry
        if (retryCount < 3) {
            situationElement.textContent = `Error resetting game. Retrying in ${retryCount + 1} seconds...`;

            // Exponential backoff for retries
            setTimeout(() => {
                situationElement.textContent = "Attempting to reset game again...";
                resetGame(retryCount + 1);
            }, (retryCount + 1) * 1000);
        } else {
            situationElement.textContent = `Error resetting game: ${error.message}. Please refresh the page.`;

            // Always show a refresh button
            choicesElement.innerHTML = '';
            const refreshBtn = document.createElement('button');
            refreshBtn.textContent = 'Refresh Page';
            refreshBtn.addEventListener('click', () => window.location.reload());
            choicesElement.appendChild(refreshBtn);
        }
    } finally {
        showLoading(false);
    }
}

// Initial load when the page loads
document.addEventListener('DOMContentLoaded', updateGameState);