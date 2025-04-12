// Event Detail View Component
const EventDetailView = (function() {
    // Private variables
    let container;
    let events = [];
    let selectedEventId = null;
    let backButton;
    
    // Initialize the event detail view
    function init(containerId, backButtonId, data) {
        events = data.events;
        container = document.getElementById(containerId);
        backButton = document.getElementById(backButtonId);
        
        // Add event listeners
        addEventListeners();
        
        // Initially hide the detail view
        hideDetailView();
        
        return {
            showEvent: showEvent,
            hideDetailView: hideDetailView,
            getSelectedEventId: function() { return selectedEventId; }
        };
    }
    
    // Add event listeners for interaction
    function addEventListeners() {
        // Listen for requests to show event details
        document.addEventListener('showEventDetail', function(event) {
            showEvent(event.detail.eventId);
            showDetailView();
        });
        
        // Listen for back button clicks
        backButton.addEventListener('click', function() {
            hideDetailView();
        });
    }
    
    // Show details for a specific event
    function showEvent(eventId) {
        // Find the event
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        // Set selected event
        selectedEventId = eventId;
        
        // Format the date
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = event.date.toLocaleDateString(undefined, dateOptions);
        
        // Create the detail content
        const detailHTML = `
            <div class="event-detail">
                <h2 class="event-title">${event.title}</h2>
                <div class="event-metadata">
                    <span class="event-date">${formattedDate}</span>
                    <span class="event-importance">${getImportanceStars(event.importance)}</span>
                </div>
                ${event.media ? `<div class="event-media"><img src="${event.media}" alt="${event.title}"></div>` : ''}
                <div class="event-description">
                    <p>${event.description}</p>
                </div>
                <div class="event-actions">
                    <button class="share-btn">Share Event</button>
                    <button class="save-btn">Save Event</button>
                </div>
            </div>
        `;
        
        // Update the container
        container.querySelector('#event-detail-content').innerHTML = detailHTML;
        
        // Add event listeners for action buttons
        addActionButtonListeners();
    }
    
    // Add listeners for action buttons
    function addActionButtonListeners() {
        const shareBtn = container.querySelector('.share-btn');
        const saveBtn = container.querySelector('.save-btn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                alert('Share functionality would be implemented here');
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                alert('Save functionality would be implemented here');
            });
        }
    }
    
    // Show the detail view
    function showDetailView() {
        container.classList.add('visible');
        document.querySelector('.card-summary-container').classList.add('hidden');
    }
    
    // Hide the detail view
    function hideDetailView() {
        container.classList.remove('visible');
        document.querySelector('.card-summary-container').classList.remove('hidden');
    }
    
    // Get stars representation of importance
    function getImportanceStars(importance) {
        return '★'.repeat(importance) + '☆'.repeat(5 - importance);
    }
    
    // Public API
    return {
        init: init
    };
})();
