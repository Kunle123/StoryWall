// Social Sharing Component
const SocialSharing = (function() {
    // Private variables
    let container;
    let events = [];
    let selectedEventId = null;
    let timelineData;
    
    // Initialize the social sharing component
    function init(data) {
        timelineData = data;
        events = data.events;
        
        // Add event listeners
        addEventListeners();
        
        return {
            shareEvent: shareEvent,
            shareTimeline: shareTimeline
        };
    }
    
    // Add event listeners for sharing functionality
    function addEventListeners() {
        // Listen for share button clicks in event detail view
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('share-btn')) {
                // Get the current selected event ID
                const eventId = document.querySelector('.event-detail-container').getAttribute('data-current-event-id');
                if (eventId) {
                    shareEvent(parseInt(eventId));
                } else {
                    shareTimeline();
                }
            }
        });
    }
    
    // Share a specific event
    function shareEvent(eventId) {
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        // Create share data
        const shareData = {
            title: `${event.title} | ${timelineData.title}`,
            text: `Check out this event from ${timelineData.title}: ${event.title}`,
            url: generateShareUrl(eventId)
        };
        
        // Show share dialog
        showShareDialog(shareData);
    }
    
    // Share the entire timeline
    function shareTimeline() {
        // Create share data
        const shareData = {
            title: timelineData.title,
            text: `Check out this interactive timeline: ${timelineData.title}`,
            url: generateShareUrl()
        };
        
        // Show share dialog
        showShareDialog(shareData);
    }
    
    // Generate a shareable URL
    function generateShareUrl(eventId = null) {
        // Base URL (would be replaced with actual domain in production)
        const baseUrl = window.location.href.split('?')[0];
        
        // Add event ID as parameter if provided
        if (eventId) {
            return `${baseUrl}?event=${eventId}`;
        }
        
        return baseUrl;
    }
    
    // Show the share dialog
    function showShareDialog(shareData) {
        // Check if the Web Share API is supported
        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Shared successfully'))
                .catch((error) => showFallbackShareDialog(shareData));
        } else {
            showFallbackShareDialog(shareData);
        }
    }
    
    // Show a fallback share dialog for browsers that don't support the Web Share API
    function showFallbackShareDialog(shareData) {
        // Create modal container if it doesn't exist
        let modal = document.getElementById('share-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'share-modal';
            modal.className = 'share-modal';
            document.body.appendChild(modal);
        }
        
        // Create share options
        const shareOptions = [
            { name: 'Facebook', icon: 'facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}` },
            { name: 'Twitter', icon: 'twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}` },
            { name: 'LinkedIn', icon: 'linkedin', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}` },
            { name: 'Email', icon: 'email', url: `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}` }
        ];
        
        // Create modal content
        modal.innerHTML = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Share</h3>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-modal-body">
                    <p>${shareData.text}</p>
                    <div class="share-url-container">
                        <input type="text" class="share-url-input" value="${shareData.url}" readonly>
                        <button class="copy-url-btn">Copy</button>
                    </div>
                    <div class="share-options">
                        ${shareOptions.map(option => `
                            <a href="${option.url}" target="_blank" rel="noopener noreferrer" class="share-option">
                                <div class="share-icon ${option.icon}"></div>
                                <span>${option.name}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Show the modal
        modal.style.display = 'flex';
        
        // Add event listeners
        const closeBtn = modal.querySelector('.share-modal-close');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Close when clicking outside the modal
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Copy URL functionality
        const copyBtn = modal.querySelector('.copy-url-btn');
        const urlInput = modal.querySelector('.share-url-input');
        
        copyBtn.addEventListener('click', function() {
            urlInput.select();
            document.execCommand('copy');
            
            // Show copied feedback
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        });
    }
    
    // Public API
    return {
        init: init
    };
})();
