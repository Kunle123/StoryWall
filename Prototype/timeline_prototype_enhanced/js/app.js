// Updated Main application script with enhanced features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the circular timeline
    const circularTimeline = CircularTimeline.init('circular-timeline', timelineData);
    
    // Initialize the card summary view
    const cardSummaryView = CardSummaryView.init('event-cards', timelineData);
    
    // Initialize the event detail view
    const eventDetailView = EventDetailView.init('event-detail-view', 'back-to-cards', timelineData);
    
    // Initialize the zoomed timeline view
    const zoomedTimelineView = ZoomedTimelineView.init('zoomed-timeline-view', timelineData);
    
    // Initialize view synchronization
    const viewSync = ViewSynchronization.init(circularTimeline, cardSummaryView, eventDetailView, zoomedTimelineView);
    
    // Initialize social sharing
    const socialSharing = SocialSharing.init(timelineData);
    
    // Initialize mobile optimizations
    initMobileOptimizations();
    
    // Select the first event by default
    if (timelineData.events.length > 0) {
        const firstEventId = timelineData.events[0].id;
        circularTimeline.selectEvent(firstEventId);
        cardSummaryView.selectEvent(firstEventId);
        
        // Set initial zoom center based on first event
        const firstEvent = timelineData.events.find(e => e.id === firstEventId);
        if (firstEvent) {
            const eventAngle = getEventAngle(firstEvent);
            zoomedTimelineView.setZoomCenter(eventAngle);
        }
    }
    
    // Check for event ID in URL parameters
    checkUrlParameters();
    
    // Function to initialize mobile optimizations
    function initMobileOptimizations() {
        // Detect if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Add mobile class to body
            document.body.classList.add('mobile-device');
            
            // Enhance touch targets
            enhanceTouchTargets();
            
            // Optimize layout for mobile
            optimizeMobileLayout();
        }
    }
    
    // Function to enhance touch targets for mobile
    function enhanceTouchTargets() {
        // Increase size of interactive elements for touch
        const touchElements = document.querySelectorAll('button, .event-marker, .zoomed-timeline-marker');
        touchElements.forEach(element => {
            element.classList.add('touch-optimized');
        });
    }
    
    // Function to optimize layout for mobile
    function optimizeMobileLayout() {
        // Adjust container padding
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('mobile-container');
        }
        
        // Adjust circular timeline size
        const circularSvg = document.getElementById('circular-timeline');
        if (circularSvg) {
            circularSvg.setAttribute('width', '100%');
            circularSvg.setAttribute('height', '400');
        }
    }
    
    // Function to check URL parameters for direct event access
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event');
        
        if (eventId) {
            const id = parseInt(eventId);
            const event = timelineData.events.find(e => e.id === id);
            
            if (event) {
                // Select the event
                circularTimeline.selectEvent(id);
                cardSummaryView.selectEvent(id);
                
                // Show event details
                const customEvent = new CustomEvent('showEventDetail', { 
                    detail: { eventId: id } 
                });
                document.dispatchEvent(customEvent);
                
                // Set zoom center
                const eventAngle = getEventAngle(event);
                zoomedTimelineView.setZoomCenter(eventAngle);
            }
        }
    }
    
    // Calculate the angle for an event based on its date
    function getEventAngle(event) {
        const startTime = timelineData.startDate.getTime();
        const endTime = timelineData.endDate.getTime();
        const eventTime = event.date.getTime();
        
        // Calculate the percentage of time elapsed
        const percentage = (eventTime - startTime) / (endTime - startTime);
        
        // Map to the angle range (-150 to 150 degrees)
        return -150 + percentage * 300;
    }
    
    // Log that the application is ready
    console.log('Enhanced TimelineAI Prototype initialized successfully');
});
