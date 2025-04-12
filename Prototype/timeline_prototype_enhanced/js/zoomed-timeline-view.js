// Zoomed Timeline View Component
const ZoomedTimelineView = (function() {
    // Private variables
    let container;
    let events = [];
    let timelineData;
    let selectedEventId = null;
    let zoomCenterAngle = 0; // Center angle of the zoomed view in degrees
    let zoomAngleRange = 30; // The angle range to display (30 degrees)
    let zoomStartAngle = -15; // Start angle relative to center (half of range)
    let zoomEndAngle = 15;    // End angle relative to center (half of range)
    let circularStartAngle = -150; // From circular timeline
    let circularEndAngle = 150;    // From circular timeline
    let circularTotalRange = 300;  // Total angle range of circular timeline
    
    // Initialize the zoomed timeline view
    function init(containerId, data) {
        timelineData = data;
        events = data.events;
        container = document.getElementById(containerId);
        
        // Create the zoomed timeline container if it doesn't exist
        if (!container) {
            console.error(`Container with ID ${containerId} not found`);
            return null;
        }
        
        // Initial render
        renderZoomedTimeline();
        
        // Add event listeners
        addEventListeners();
        
        return {
            selectEvent: selectEvent,
            getSelectedEventId: function() { return selectedEventId; },
            setZoomCenter: setZoomCenter
        };
    }
    
    // Set the center angle for the zoomed view
    function setZoomCenter(angle) {
        zoomCenterAngle = angle;
        zoomStartAngle = angle - (zoomAngleRange / 2);
        zoomEndAngle = angle + (zoomAngleRange / 2);
        renderZoomedTimeline();
        
        // Dispatch event to update the zoom indicator on circular timeline
        const customEvent = new CustomEvent('zoomRangeChanged', { 
            detail: { 
                centerAngle: zoomCenterAngle,
                startAngle: zoomStartAngle,
                endAngle: zoomEndAngle
            } 
        });
        document.dispatchEvent(customEvent);
    }
    
    // Render the zoomed timeline view
    function renderZoomedTimeline() {
        // Clear existing content
        container.innerHTML = '';
        
        // Create header with zoom information
        const header = document.createElement('div');
        header.className = 'zoomed-timeline-header';
        
        // Calculate date range for the zoomed view
        const startDate = getDateFromAngle(zoomStartAngle);
        const endDate = getDateFromAngle(zoomEndAngle);
        
        // Format dates
        const dateOptions = { year: 'numeric', month: 'short' };
        const formattedStartDate = startDate.toLocaleDateString(undefined, dateOptions);
        const formattedEndDate = endDate.toLocaleDateString(undefined, dateOptions);
        
        header.innerHTML = `
            <h3>Zoomed Timeline View</h3>
            <div class="zoom-range">
                <span class="zoom-start-date">${formattedStartDate}</span>
                <span class="zoom-separator">to</span>
                <span class="zoom-end-date">${formattedEndDate}</span>
            </div>
        `;
        container.appendChild(header);
        
        // Create timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'zoomed-timeline-container';
        
        // Create timeline track
        const timelineTrack = document.createElement('div');
        timelineTrack.className = 'zoomed-timeline-track';
        
        // Add timeline track to container
        timelineContainer.appendChild(timelineTrack);
        
        // Filter events that fall within the zoomed range
        const visibleEvents = events.filter(event => {
            const eventAngle = getEventAngle(event);
            return eventAngle >= zoomStartAngle && eventAngle <= zoomEndAngle;
        });
        
        // Sort events by date
        const sortedEvents = [...visibleEvents].sort((a, b) => a.date - b.date);
        
        // Create event markers on the timeline
        sortedEvents.forEach(event => {
            const eventAngle = getEventAngle(event);
            
            // Calculate position on the zoomed timeline (0-100%)
            const position = ((eventAngle - zoomStartAngle) / zoomAngleRange) * 100;
            
            // Create marker
            const marker = document.createElement('div');
            marker.className = 'zoomed-timeline-marker';
            marker.setAttribute('data-event-id', event.id);
            marker.style.left = `${position}%`;
            
            // Add importance indicator
            marker.style.height = `${getMarkerHeight(event.importance)}px`;
            marker.style.width = `${getMarkerWidth(event.importance)}px`;
            
            // Add selected state if needed
            if (event.id === selectedEventId) {
                marker.classList.add('selected');
            }
            
            // Add tooltip with event title
            marker.setAttribute('title', event.title);
            
            // Add marker to track
            timelineTrack.appendChild(marker);
            
            // Add date label for significant events or evenly spaced
            if (event.importance >= 4 || sortedEvents.length <= 5) {
                const label = document.createElement('div');
                label.className = 'zoomed-timeline-label';
                label.style.left = `${position}%`;
                
                // Format date
                const labelDate = event.date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                label.textContent = labelDate;
                timelineTrack.appendChild(label);
            }
        });
        
        // Add navigation controls
        const navControls = document.createElement('div');
        navControls.className = 'zoomed-timeline-controls';
        navControls.innerHTML = `
            <button class="zoom-nav-btn zoom-out-btn" title="Zoom Out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3L9 12L15 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="zoom-nav-btn pan-left-btn" title="Pan Left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="zoom-nav-btn pan-right-btn" title="Pan Right">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 5L19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="zoom-nav-btn zoom-in-btn" title="Zoom In">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L15 12L9 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        // Add timeline container to main container
        container.appendChild(timelineContainer);
        
        // Add navigation controls to container
        container.appendChild(navControls);
        
        // Add event listeners to navigation controls
        addNavigationListeners(navControls);
    }
    
    // Add event listeners for the zoomed timeline
    function addEventListeners() {
        // Listen for event selection from circular timeline or card view
        document.addEventListener('eventSelected', function(event) {
            const eventId = event.detail.eventId;
            selectEvent(eventId);
            
            // Center the zoomed view on the selected event
            const selectedEvent = events.find(e => e.id === eventId);
            if (selectedEvent) {
                const eventAngle = getEventAngle(selectedEvent);
                setZoomCenter(eventAngle);
            }
        });
    }
    
    // Add event listeners for navigation controls
    function addNavigationListeners(navControls) {
        // Pan left (move zoomed window left)
        navControls.querySelector('.pan-left-btn').addEventListener('click', function() {
            const panAmount = zoomAngleRange / 4; // Pan by 1/4 of the visible range
            setZoomCenter(zoomCenterAngle - panAmount);
        });
        
        // Pan right (move zoomed window right)
        navControls.querySelector('.pan-right-btn').addEventListener('click', function() {
            const panAmount = zoomAngleRange / 4; // Pan by 1/4 of the visible range
            setZoomCenter(zoomCenterAngle + panAmount);
        });
        
        // Zoom in (decrease angle range)
        navControls.querySelector('.zoom-in-btn').addEventListener('click', function() {
            if (zoomAngleRange > 10) { // Minimum zoom range
                zoomAngleRange = zoomAngleRange / 1.5;
                setZoomCenter(zoomCenterAngle);
            }
        });
        
        // Zoom out (increase angle range)
        navControls.querySelector('.zoom-out-btn').addEventListener('click', function() {
            if (zoomAngleRange < 120) { // Maximum zoom range
                zoomAngleRange = zoomAngleRange * 1.5;
                setZoomCenter(zoomCenterAngle);
            }
        });
        
        // Add click listeners to markers
        const markers = container.querySelectorAll('.zoomed-timeline-marker');
        markers.forEach(marker => {
            marker.addEventListener('click', function() {
                const eventId = parseInt(marker.getAttribute('data-event-id'));
                selectEvent(eventId);
                
                // Trigger event to update other views
                const customEvent = new CustomEvent('eventSelected', { 
                    detail: { eventId: eventId } 
                });
                document.dispatchEvent(customEvent);
            });
        });
    }
    
    // Select an event by ID
    function selectEvent(eventId) {
        // Reset previously selected event
        if (selectedEventId) {
            const prevMarker = container.querySelector(`.zoomed-timeline-marker[data-event-id="${selectedEventId}"]`);
            if (prevMarker) {
                prevMarker.classList.remove('selected');
            }
        }
        
        // Set new selected event
        selectedEventId = eventId;
        
        // Highlight selected event
        const selectedMarker = container.querySelector(`.zoomed-timeline-marker[data-event-id="${eventId}"]`);
        if (selectedMarker) {
            selectedMarker.classList.add('selected');
        }
    }
    
    // Calculate the angle for an event based on its date
    function getEventAngle(event) {
        const startTime = timelineData.startDate.getTime();
        const endTime = timelineData.endDate.getTime();
        const eventTime = event.date.getTime();
        
        // Calculate the percentage of time elapsed
        const percentage = (eventTime - startTime) / (endTime - startTime);
        
        // Map to the angle range (circularStartAngle to circularEndAngle)
        return circularStartAngle + percentage * circularTotalRange;
    }
    
    // Calculate the date for a given angle
    function getDateFromAngle(angle) {
        // Normalize angle to be within the circular timeline range
        let normalizedAngle = angle;
        if (normalizedAngle < circularStartAngle) normalizedAngle = circularStartAngle;
        if (normalizedAngle > circularEndAngle) normalizedAngle = circularEndAngle;
        
        // Calculate percentage along the timeline
        const percentage = (normalizedAngle - circularStartAngle) / circularTotalRange;
        
        // Calculate the date
        const startTime = timelineData.startDate.getTime();
        const endTime = timelineData.endDate.getTime();
        const dateTime = startTime + percentage * (endTime - startTime);
        
        return new Date(dateTime);
    }
    
    // Get the height for a marker based on importance
    function getMarkerHeight(importance) {
        const baseHeight = 12;
        const importanceFactor = importance / 5; // Normalize to 0-1
        return baseHeight + (importanceFactor * 12);
    }
    
    // Get the width for a marker based on importance
    function getMarkerWidth(importance) {
        const baseWidth = 8;
        const importanceFactor = importance / 5; // Normalize to 0-1
        return baseWidth + (importanceFactor * 8);
    }
    
    // Public API
    return {
        init: init
    };
})();
