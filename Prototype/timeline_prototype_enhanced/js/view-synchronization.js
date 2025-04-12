// View Synchronization Module with Zoomed Timeline Support
const ViewSynchronization = (function() {
    // Private variables
    let circularTimeline;
    let cardSummaryView;
    let eventDetailView;
    let zoomedTimelineView;
    
    // Initialize the synchronization
    function init(circular, cards, detail, zoomed) {
        circularTimeline = circular;
        cardSummaryView = cards;
        eventDetailView = detail;
        zoomedTimelineView = zoomed;
        
        // Set up event listeners for synchronization
        setupEventListeners();
        
        return {
            syncViews: syncViews
        };
    }
    
    // Set up event listeners for view synchronization
    function setupEventListeners() {
        // Listen for event selection from circular timeline
        document.addEventListener('eventSelected', function(event) {
            const eventId = event.detail.eventId;
            syncViews(eventId, 'circular');
        });
        
        // Listen for event selection from card view
        document.addEventListener('cardSelected', function(event) {
            const eventId = event.detail.eventId;
            syncViews(eventId, 'card');
        });
        
        // Listen for detail view requests
        document.addEventListener('showEventDetail', function(event) {
            const eventId = event.detail.eventId;
            syncViews(eventId, 'detail');
        });
        
        // Listen for back button clicks
        document.getElementById('back-to-cards').addEventListener('click', function() {
            // When returning to cards, ensure the selected card is highlighted
            const currentEventId = eventDetailView.getSelectedEventId();
            if (currentEventId) {
                syncViews(currentEventId, 'back');
            }
        });
        
        // Listen for zoom center changes
        document.addEventListener('zoomCenterChanged', function(event) {
            if (zoomedTimelineView) {
                zoomedTimelineView.setZoomCenter(event.detail.centerAngle);
            }
        });
    }
    
    // Synchronize all views based on the selected event
    function syncViews(eventId, source) {
        console.log(`Syncing views from ${source} with event ID: ${eventId}`);
        
        // Update circular timeline if not the source
        if (source !== 'circular') {
            circularTimeline.selectEvent(eventId);
        }
        
        // Update card view if not the source
        if (source !== 'card') {
            cardSummaryView.selectEvent(eventId);
        }
        
        // Update zoomed timeline view if available
        if (zoomedTimelineView && source !== 'zoomed') {
            zoomedTimelineView.selectEvent(eventId);
        }
        
        // If coming from detail view or back button, don't change the view state
        if (source !== 'detail' && source !== 'back') {
            // Hide detail view if it's visible
            if (document.querySelector('.event-detail-container').classList.contains('visible')) {
                eventDetailView.hideDetailView();
            }
        }
        
        // If source is detail, show the detail view
        if (source === 'detail') {
            eventDetailView.showEvent(eventId);
        }
    }
    
    // Public API
    return {
        init: init
    };
})();
