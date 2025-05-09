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

const mangaSpinner = document.getElementById('manga-spinner');
const mangaShimmer = document.getElementById('manga-shimmer');
const mangaRetry = document.getElementById('manga-retry');
const summarySpinner = document.getElementById('summary-spinner');
const summaryShimmer = document.getElementById('summary-shimmer');
const summaryRetry = document.getElementById('summary-retry');

// Helper function to load images with spinner, shimmer, and retry logic
function loadImage({
    imgElement,
    spinnerElement,
    shimmerElement,
    retryElement,
    imageUrl,
    altText,
    onLoadCallback,
    onErrorCallback,
    initialOpacity = '0.2',
    successOpacity = '1',
    transition = 'opacity 0.7s cubic-bezier(.4,0,.2,1)',
    retryButtonText = 'Retry',
    retryButtonClass = 'image-retry-button' // A new class for styling if needed
}) {
    if (!imgElement) {
        console.warn("loadImage: Missing image element", { imageUrl });
        if (spinnerElement) spinnerElement.style.display = 'none';
        if (shimmerElement) shimmerElement.style.display = 'none';
        // Potentially call onErrorCallback if provided
        if (onErrorCallback) onErrorCallback({ error: "Missing image element" });
        return;
    }
    if (!imageUrl) {
        console.warn("loadImage: Missing image URL for element:", imgElement.id);
        imgElement.style.opacity = initialOpacity; // Show it as "empty" or placeholder
        if (spinnerElement) spinnerElement.style.display = 'none';
        if (shimmerElement) shimmerElement.style.display = 'none';
        if (retryElement) {
            retryElement.style.display = 'block';
            // Clear previous content if retryElement is also a message container
            const existingButton = retryElement.querySelector('.' + retryButtonClass);
            if (existingButton) existingButton.remove();

            const btn = document.createElement('button');
            btn.textContent = 'No Image URL Provided. Cannot Retry.';
            btn.className = retryButtonClass;
            btn.disabled = true;
            retryElement.appendChild(btn);
        }
        if (onErrorCallback) onErrorCallback({ error: "Missing image URL" });
        return;
    }


    imgElement.style.opacity = initialOpacity;
    if (altText) imgElement.alt = altText;
    if (spinnerElement) spinnerElement.style.display = 'block';
    if (shimmerElement) shimmerElement.style.display = 'block';
    if (retryElement) {
        retryElement.style.display = 'none';
        // Clear previous message/button from retryElement if it's a container
        const existingButton = retryElement.querySelector('.' + retryButtonClass);
        if (existingButton) existingButton.remove();
        // Also clear any direct text content if it was used for messages
        if (retryElement.firstChild && retryElement.firstChild.nodeType === Node.TEXT_NODE) {
            // Only remove if it's likely a message we set, not other structural text
            if (retryElement.textContent.includes("Failed to load") || retryElement.textContent.includes("Crafting your")) {
                retryElement.textContent = '';
            }
        }
    }

    const tempImage = new Image();
    tempImage.onload = () => {
        imgElement.src = imageUrl;
        imgElement.style.transition = transition;
        imgElement.style.opacity = successOpacity;
        if (spinnerElement) spinnerElement.style.display = 'none';
        if (shimmerElement) shimmerElement.style.display = 'none';
        if (retryElement) retryElement.style.display = 'none';
        if (onLoadCallback) onLoadCallback();
    };
    tempImage.onerror = (err) => {
        console.error("Failed to load image:", imageUrl, err);
        if (spinnerElement) spinnerElement.style.display = 'none';
        if (shimmerElement) shimmerElement.style.display = 'none';
        if (retryElement) {
            retryElement.style.display = 'block'; // Show the container
            // Clear previous content before adding new button/message
            const existingButton = retryElement.querySelector('.' + retryButtonClass);
            if (existingButton) existingButton.remove();
            if (retryElement.firstChild && retryElement.firstChild.nodeType === Node.TEXT_NODE) {
                if (retryElement.textContent.includes("Failed to load") || retryElement.textContent.includes("Crafting your")) {
                    retryElement.textContent = '';
                }
            }

            const btn = document.createElement('button');
            btn.textContent = retryButtonText;
            btn.className = retryButtonClass; // Use a class for styling
            btn.style.marginTop = '10px'; // Example style
            btn.onclick = () => {
                // Reset UI and try loading again
                imgElement.style.opacity = initialOpacity; // Reset opacity for visual feedback
                if (spinnerElement) spinnerElement.style.display = 'block';
                if (shimmerElement) shimmerElement.style.display = 'block';
                if (retryElement) {
                    retryElement.style.display = 'none'; // Hide container while retrying
                    const existingBtn = retryElement.querySelector('.' + retryButtonClass);
                    if (existingBtn) existingBtn.remove();
                    if (retryElement.firstChild && retryElement.firstChild.nodeType === Node.TEXT_NODE) {
                        if (retryElement.textContent.includes("Failed to load") || retryElement.textContent.includes("Crafting your")) {
                            retryElement.textContent = '';
                        }
                    }
                }
                tempImage.src = imageUrl; // Re-trigger load
            };
            retryElement.appendChild(btn);
        }
        imgElement.style.opacity = initialOpacity; // Keep it dim or show placeholder
        if (onErrorCallback) onErrorCallback({ error: "Image load failed", originalEvent: err });
    };

    tempImage.src = imageUrl;
}

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
            credentials: 'include',
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

// Add intersection observer for lazy loading
const lazyLoadImages = () => {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
};

// Optimize image loading in renderState
function renderState(data) {
    console.log("Rendering state:", data);
    console.log("API Response details:", JSON.stringify(data));

    // Update score - check both current_score and score properties
    const score = data.current_score !== undefined ? data.current_score :
        (data.score !== undefined ? data.score : 0);
    scoreElement.textContent = `Score: ${score}`;

    loadImage({
        imgElement: imageElement,
        spinnerElement: document.getElementById('image-spinner'),
        shimmerElement: document.getElementById('image-shimmer'),
        retryElement: document.getElementById('image-retry'),
        imageUrl: data.image_url,
        altText: data.image_prompt || 'Story scene'
    });
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
            credentials: 'include',
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

// Optimize end screen image loading
function displayEndScreen(data) {
    const endingCategory = data.ending_category || 'Adventure Complete';
    const situationText = data.situation || 'A mysterious outcome.';
    let mangaImageUrl = data.manga_image_url;
    let summaryImageUrl = data.summary_image_url;

    if (!mangaImageUrl) {
        const mangaPrompt = encodeURIComponent(
            `manga comic, 4 panels, depicting: ${endingCategory.toLowerCase()}, story highlight: ${situationText.substring(0, 70)}, fantasy forest adventure, clear English speech bubbles, vibrant colors, detailed art`
        );
        mangaImageUrl = `https://image.pollinations.ai/prompt/${mangaPrompt}`;
    }
    if (!summaryImageUrl) {
        const summaryPrompt = encodeURIComponent(
            `cinematic digital painting, summary of: ${endingCategory.toLowerCase()}, visualising the key moment: ${situationText.substring(0, 80)}, epic fantasy forest, atmospheric lighting, high detail, professional artwork`
        );
        summaryImageUrl = `https://image.pollinations.ai/prompt/${summaryPrompt}`;
    }

    // Hide the main choices
    choicesElement.style.display = 'none';

    // Calculate a star rating based on score (1-5 stars)
    const score = data.current_score !== undefined ? data.current_score :
        (data.score !== undefined ? data.score : 0);
    const maxScore = 10; // Assuming maximum possible score is around 10
    const starRating = Math.max(1, Math.min(5, Math.ceil(score / 2)));

    // Show the end screen container with a fade in
    endScreenElement.style.display = 'block';
    endScreenElement.style.opacity = '0';

    // Prepare the end text content with score and rating
    const stars = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);

    let endTextContent = `
        <h2>${endingCategory}</h2>
        <div class="score-display">
            <span class="score-label">Final Score:</span> 
            <span class="score-value">${score}</span>
            <div class="star-rating">${stars}</div>
        </div>
        <p>${situationText}</p>
    `;

    // Add a personalized message based on score
    if (score >= 8) {
        endTextContent += `<p class="end-message">Remarkable! You've mastered this adventure with exceptional choices.</p>`;
    } else if (score >= 5) {
        endTextContent += `<p class="end-message">Well done! Your journey through the forest was quite successful.</p>`;
    } else if (score >= 2) {
        endTextContent += `<p class="end-message">You've completed your journey with some wisdom gained along the way.</p>`;
    } else {
        endTextContent += `<p class="end-message">The forest has taught you some difficult lessons. Perhaps another path would lead to a different fate.</p>`;
    }

    endTextElement.innerHTML = endTextContent;

    loadImage({
        imgElement: mangaImageElement,
        spinnerElement: mangaSpinner,
        shimmerElement: mangaShimmer,
        retryElement: mangaRetry,
        imageUrl: mangaImageUrl,
        altText: 'Story manga'
    });

    loadImage({
        imgElement: summaryImageElement,
        spinnerElement: summarySpinner,
        shimmerElement: summaryShimmer,
        retryElement: summaryRetry,
        imageUrl: summaryImageUrl,
        altText: 'Story summary'
    });

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
    shareModalElement.style.display = 'block';
    shareMangaImageElement.style.display = 'none';
    shareMangaImageElement.src = '';
    shareLoadingElement.style.display = 'block';
    // Updated loading text for clarity
    shareLoadingElement.innerHTML = '🖌️ Crafting your unique comic strip... <br>This can take up to a minute, please wait.';

    // Remove any previous retry button from shareLoadingElement
    const existingRetryButton = shareLoadingElement.querySelector('.image-retry-button');
    if (existingRetryButton) {
        existingRetryButton.remove();
    }

    let shareImageUrl;
    try {
        const response = await fetch('/api/share-image');
        if (!response.ok) {
            console.error(`API error for share image: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        shareImageUrl = data.share_image_url;
        if (!shareImageUrl) {
            console.warn('API provided no share_image_url, falling back to Pollinations.ai');
            throw new Error('Missing share_image_url from API');
        }
    } catch (apiError) {
        console.log('Falling back to Pollinations.ai for share image due to:', apiError.message);
        const prompt = encodeURIComponent(
            "manga comic, fantasy forest adventure, expressive characters, clear English speech bubbles, 4 panels, high quality, dramatic, adventure, professional comic layout"
        );
        shareImageUrl = `https://image.pollinations.ai/prompt/${prompt}`;
    }

    loadImage({
        imgElement: shareMangaImageElement,
        spinnerElement: null, // No separate spinner, shareLoadingElement handles this
        shimmerElement: null, // No shimmer for share modal image
        retryElement: shareLoadingElement, // shareLoadingElement will host the retry button/message
        imageUrl: shareImageUrl,
        altText: 'Shareable manga story',
        retryButtonText: 'Try Again?',
        retryButtonClass: 'action-button', // Use existing styling for share modal buttons
        onLoadCallback: () => {
            shareLoadingElement.style.display = 'none'; // Hide loading message
            shareMangaImageElement.style.display = 'block'; // Show loaded image
            setupShareButtons(shareImageUrl, score, endingCategory);
        },
        onErrorCallback: (errorDetails) => {
            // The loadImage helper already appends a retry button to retryElement (shareLoadingElement)
            // We just need to make sure the message is appropriate.
            // The helper's default error handling might be okay, or we can customize message here.
            shareLoadingElement.innerHTML = `😢 Failed to load your awesome comic. (${errorDetails.error || 'Unknown error'}) `;
            // Re-add button manually if helper's default isn't what we want for this specific UI
            const btn = document.createElement('button');
            btn.textContent = 'Try Again?';
            btn.className = 'action-button';
            btn.style.marginTop = '10px';
            btn.onclick = () => {
                shareLoadingElement.innerHTML = '🖌️ Crafting your unique comic strip... <br>This can take up to a minute, please wait.';
                openShareModal(score, endingCategory);
            };
            shareLoadingElement.appendChild(btn);
            shareMangaImageElement.style.display = 'none';
        }
    });
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

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);