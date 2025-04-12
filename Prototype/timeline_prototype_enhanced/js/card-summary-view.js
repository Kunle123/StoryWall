// Card-based Summary View Component
const CardSummaryView = (function() {
    // Private variables
    let container;
    let events = [];
    let selectedEventId = null;
    
    // Initialize the card summary view
    function init(containerId, data) {
        events = data.events;
        container = document.getElementById(containerId);
        
        // Render the event cards
        renderEventCards();
        
        // Add event listeners
        addEventListeners();
        
        return {
            selectEvent: selectEvent,
            getSelectedEventId: function() { return selectedEventId; }
        };
    }
    
    // Render cards for each event
    function renderEventCards() {
        // Clear existing content
        container.innerHTML = '';
        
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => a.date - b.date);
        
        // Create a card for each event
        sortedEvents.forEach(event => {
            const card = createEventCard(event);
            container.appendChild(card);
        });
    }
    
    // Create a card element for an event
    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.setAttribute('data-event-id', event.id);
        
        // Format the date
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = event.date.toLocaleDateString(undefined, dateOptions);
        
        // Create card content
        card.innerHTML = `
            <div class="event-card-header">
                <span class="event-date">${formattedDate}</span>
                <span class="event-importance">${getImportanceStars(event.importance)}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-summary">${truncateText(event.description, 100)}</p>
            <button class="view-details-btn">View Details</button>
        `;
        
        return card;
    }
    
    // Add event listeners for interaction
    function addEventListeners() {
        // Listen for clicks on cards
        container.addEventListener('click', function(event) {
            // Find the closest event card
            const card = event.target.closest('.event-card');
            if (!card) return;
            
            // Get the event ID
            const eventId = parseInt(card.getAttribute('data-event-id'));
            
            // If the view details button was clicked, show the detail view
            if (event.target.classList.contains('view-details-btn')) {
                // Trigger event to show detail view
                const customEvent = new CustomEvent('showEventDetail', { 
                    detail: { eventId: eventId } 
                });
                document.dispatchEvent(customEvent);
            } else {
                // Otherwise just select the event
                selectEvent(eventId);
                
                // Trigger event to update circular timeline
                const customEvent = new CustomEvent('eventSelected', { 
                    detail: { eventId: eventId } 
                });
                document.dispatchEvent(customEvent);
            }
        });
        
        // Listen for event selection from circular timeline
        document.addEventListener('eventSelected', function(event) {
            selectEvent(event.detail.eventId);
            scrollToSelectedCard();
        });
    }
    
    // Select an event by ID
    function selectEvent(eventId) {
        // Reset previously selected event
        if (selectedEventId) {
            const prevCard = container.querySelector(`.event-card[data-event-id="${selectedEventId}"]`);
            if (prevCard) {
                prevCard.classList.remove('selected');
            }
        }
        
        // Set new selected event
        selectedEventId = eventId;
        
        // Highlight selected event
        const selectedCard = container.querySelector(`.event-card[data-event-id="${eventId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }
    
    // Scroll to the selected card
    function scrollToSelectedCard() {
        const selectedCard = container.querySelector(`.event-card[data-event-id="${selectedEventId}"]`);
        if (selectedCard) {
            const scrollContainer = container.parentElement;
            scrollContainer.scrollTop = selectedCard.offsetTop - scrollContainer.offsetTop - 20;
        }
    }
    
    // Get stars representation of importance
    function getImportanceStars(importance) {
        return '★'.repeat(importance) + '☆'.repeat(5 - importance);
    }
    
    // Truncate text to a specific length
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Public API
    return {
        init: init
    };
})();
