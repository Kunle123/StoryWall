// Navigation Module
const Navigation = (function() {
    // Private variables
    let circularTimeline;
    let cardSummaryView;
    let eventDetailView;
    
    // Initialize the navigation
    function init(circular, cards, detail) {
        circularTimeline = circular;
        cardSummaryView = cards;
        eventDetailView = detail;
        
        // Set up navigation controls
        setupNavigationControls();
        
        return {
            navigateToEvent: navigateToEvent,
            showCardView: showCardView,
            showDetailView: showDetailView
        };
    }
    
    // Set up navigation controls and event listeners
    function setupNavigationControls() {
        // Add navigation buttons to the circular timeline container
        addCircularTimelineControls();
        
        // Add swipe detection for mobile
        setupSwipeNavigation();
        
        // Add keyboard navigation
        setupKeyboardNavigation();
    }
    
    // Add navigation controls to the circular timeline
    function addCircularTimelineControls() {
        const container = document.querySelector('.circular-timeline-container');
        
        // Create navigation controls
        const navControls = document.createElement('div');
        navControls.className = 'timeline-navigation-controls';
        navControls.innerHTML = `
            <button id="prev-event-btn" class="nav-btn" title="Previous Event">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button id="next-event-btn" class="nav-btn" title="Next Event">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        // Append to container
        container.appendChild(navControls);
        
        // Add event listeners
        document.getElementById('prev-event-btn').addEventListener('click', navigateToPreviousEvent);
        document.getElementById('next-event-btn').addEventListener('click', navigateToNextEvent);
    }
    
    // Set up swipe navigation for mobile devices
    function setupSwipeNavigation() {
        const container = document.querySelector('.timeline-container');
        let touchStartX = 0;
        let touchEndX = 0;
        
        container.addEventListener('touchstart', function(event) {
            touchStartX = event.changedTouches[0].screenX;
        }, false);
        
        container.addEventListener('touchend', function(event) {
            touchEndX = event.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            const swipeThreshold = 50;
            
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe left - next event
                navigateToNextEvent();
            }
            
            if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe right - previous event
                navigateToPreviousEvent();
            }
        }
    }
    
    // Set up keyboard navigation
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', function(event) {
            // Only handle navigation keys if not in an input field
            if (event.target.tagName.toLowerCase() !== 'input' && 
                event.target.tagName.toLowerCase() !== 'textarea') {
                
                switch (event.key) {
                    case 'ArrowLeft':
                        navigateToPreviousEvent();
                        break;
                    case 'ArrowRight':
                        navigateToNextEvent();
                        break;
                    case 'Escape':
                        // If in detail view, go back to card view
                        if (document.querySelector('.event-detail-container').classList.contains('visible')) {
                            eventDetailView.hideDetailView();
                        }
                        break;
                }
            }
        });
    }
    
    // Navigate to a specific event by ID
    function navigateToEvent(eventId) {
        // Trigger event selection
        const customEvent = new CustomEvent('eventSelected', { 
            detail: { eventId: eventId } 
        });
        document.dispatchEvent(customEvent);
    }
    
    // Navigate to the previous event
    function navigateToPreviousEvent() {
        const events = timelineData.events.sort((a, b) => a.date - b.date);
        const currentEventId = getCurrentEventId();
        
        if (currentEventId) {
            const currentIndex = events.findIndex(e => e.id === currentEventId);
            if (currentIndex > 0) {
                navigateToEvent(events[currentIndex - 1].id);
            }
        }
    }
    
    // Navigate to the next event
    function navigateToNextEvent() {
        const events = timelineData.events.sort((a, b) => a.date - b.date);
        const currentEventId = getCurrentEventId();
        
        if (currentEventId) {
            const currentIndex = events.findIndex(e => e.id === currentEventId);
            if (currentIndex < events.length - 1) {
                navigateToEvent(events[currentIndex + 1].id);
            }
        }
    }
    
    // Get the currently selected event ID
    function getCurrentEventId() {
        // Try to get from circular timeline first
        let eventId = circularTimeline.getSelectedEventId();
        
        // If not found, try card view
        if (!eventId) {
            eventId = cardSummaryView.getSelectedEventId();
        }
        
        // If still not found, try detail view
        if (!eventId) {
            eventId = eventDetailView.getSelectedEventId();
        }
        
        return eventId;
    }
    
    // Show the card summary view
    function showCardView() {
        eventDetailView.hideDetailView();
    }
    
    // Show the detail view for the current event
    function showDetailView() {
        const eventId = getCurrentEventId();
        if (eventId) {
            const customEvent = new CustomEvent('showEventDetail', { 
                detail: { eventId: eventId } 
            });
            document.dispatchEvent(customEvent);
        }
    }
    
    // Public API
    return {
        init: init
    };
})();
