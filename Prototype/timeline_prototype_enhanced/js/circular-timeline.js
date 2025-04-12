// Enhanced Circular Timeline Component with Zoom Indicator
const CircularTimeline = (function() {
    // Private variables
    let svg;
    let width;
    let height;
    let radius;
    let centerX;
    let centerY;
    let arcGenerator;
    let events = [];
    let selectedEventId = null;
    let timelineArc;
    let eventMarkers;
    let zoomIndicator;
    let startAngle = -150; // -150 degrees
    let endAngle = 150;    // 150 degrees
    let timelineData;
    let currentZoomRange = {
        centerAngle: 0,
        startAngle: -15,
        endAngle: 15
    };
    
    // Initialize the circular timeline
    function init(containerId, data) {
        timelineData = data;
        events = data.events;
        
        // Get the SVG element
        svg = d3.select(`#${containerId}`);
        
        // Get dimensions
        width = +svg.attr('width');
        height = +svg.attr('height');
        radius = Math.min(width, height) / 2 * 0.8;
        centerX = width / 2;
        centerY = height / 2;
        
        // Create arc generator for the timeline
        arcGenerator = d3.arc()
            .innerRadius(radius - 20)
            .outerRadius(radius)
            .startAngle(degreesToRadians(startAngle))
            .endAngle(degreesToRadians(endAngle));
        
        // Draw the timeline arc
        drawTimelineArc();
        
        // Add title to the center
        addCenterTitle(data.title);
        
        // Add date labels
        addDateLabels(data.startDate, data.endDate);
        
        // Draw event markers
        drawEventMarkers();
        
        // Add zoom indicator
        addZoomIndicator();
        
        // Add event listeners
        addEventListeners();
        
        return {
            selectEvent: selectEvent,
            getSelectedEventId: function() { return selectedEventId; },
            updateZoomIndicator: updateZoomIndicator
        };
    }
    
    // Draw the main timeline arc
    function drawTimelineArc() {
        timelineArc = svg.append('path')
            .attr('d', arcGenerator)
            .attr('transform', `translate(${centerX}, ${centerY})`)
            .attr('class', 'timeline-arc')
            .attr('fill', '#cccccc');
    }
    
    // Add the title to the center of the timeline
    function addCenterTitle(title) {
        svg.append('text')
            .attr('x', centerX)
            .attr('y', centerY)
            .attr('text-anchor', 'middle')
            .attr('class', 'timeline-title')
            .text(title);
    }
    
    // Add date labels at the start and end of the timeline
    function addDateLabels(startDate, endDate) {
        // Format dates as years
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        
        // Calculate positions for date labels
        const startLabelPos = getPointOnArc(startAngle, radius + 10);
        const endLabelPos = getPointOnArc(endAngle, radius + 10);
        
        // Add start date label
        svg.append('text')
            .attr('x', centerX + startLabelPos.x)
            .attr('y', centerY + startLabelPos.y)
            .attr('text-anchor', 'middle')
            .attr('class', 'date-label')
            .text(startYear);
        
        // Add end date label
        svg.append('text')
            .attr('x', centerX + endLabelPos.x)
            .attr('y', centerY + endLabelPos.y)
            .attr('text-anchor', 'middle')
            .attr('class', 'date-label')
            .text(endYear);
    }
    
    // Draw markers for each event on the timeline
    function drawEventMarkers() {
        eventMarkers = svg.selectAll('.event-marker')
            .data(events)
            .enter()
            .append('circle')
            .attr('class', 'event-marker')
            .attr('cx', d => centerX + getPointOnArc(getEventAngle(d), radius - 10).x)
            .attr('cy', d => centerY + getPointOnArc(getEventAngle(d), radius - 10).y)
            .attr('r', d => getMarkerRadius(d))
            .attr('fill', d => getMarkerColor(d))
            .attr('data-event-id', d => d.id)
            .attr('cursor', 'pointer');
    }
    
    // Add zoom indicator to show which portion is being viewed in detail
    function addZoomIndicator() {
        // Create arc generator for the zoom indicator
        const zoomArcGenerator = d3.arc()
            .innerRadius(radius - 25)
            .outerRadius(radius + 5);
        
        // Add the zoom indicator arc
        zoomIndicator = svg.append('path')
            .attr('class', 'zoom-range-indicator')
            .attr('transform', `translate(${centerX}, ${centerY})`)
            .style('opacity', 0.7);
        
        // Set initial position
        updateZoomIndicator(currentZoomRange);
    }
    
    // Update the zoom indicator position
    function updateZoomIndicator(zoomRange) {
        currentZoomRange = zoomRange;
        
        // Create arc generator for the zoom indicator
        const zoomArcGenerator = d3.arc()
            .innerRadius(radius - 25)
            .outerRadius(radius + 5)
            .startAngle(degreesToRadians(zoomRange.startAngle))
            .endAngle(degreesToRadians(zoomRange.endAngle));
        
        // Update the zoom indicator
        zoomIndicator
            .transition()
            .duration(300)
            .attr('d', zoomArcGenerator);
    }
    
    // Add event listeners for interaction
    function addEventListeners() {
        eventMarkers.on('click', function(event, d) {
            selectEvent(d.id);
            // Trigger event to update card view
            const customEvent = new CustomEvent('eventSelected', { detail: { eventId: d.id } });
            document.dispatchEvent(customEvent);
        });
        
        eventMarkers.on('mouseover', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', d => getMarkerRadius(d) * 1.5);
        });
        
        eventMarkers.on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', d => getMarkerRadius(d));
        });
        
        // Listen for zoom range changes
        document.addEventListener('zoomRangeChanged', function(event) {
            updateZoomIndicator(event.detail);
        });
        
        // Add click listener to the timeline arc for direct zooming
        timelineArc.on('click', function(event) {
            // Get mouse position relative to the center
            const [x, y] = d3.pointer(event, svg.node());
            const dx = x - centerX;
            const dy = y - centerY;
            
            // Calculate angle in degrees
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Adjust angle to match our coordinate system
            // In our system, 0 degrees is at the right, -90 at the top
            
            // Check if the angle is within our timeline range
            if (angle >= startAngle && angle <= endAngle) {
                // Trigger zoom change event
                const customEvent = new CustomEvent('zoomCenterChanged', { 
                    detail: { centerAngle: angle } 
                });
                document.dispatchEvent(customEvent);
            }
        });
    }
    
    // Select an event by ID
    function selectEvent(eventId) {
        // Reset previously selected event
        if (selectedEventId) {
            d3.select(`circle[data-event-id="${selectedEventId}"]`)
                .attr('fill', d => getMarkerColor(d))
                .attr('r', d => getMarkerRadius(d));
        }
        
        // Set new selected event
        selectedEventId = eventId;
        
        // Highlight selected event
        d3.select(`circle[data-event-id="${eventId}"]`)
            .attr('fill', '#f44336')
            .attr('r', d => getMarkerRadius(d) * 1.5);
    }
    
    // Calculate the angle for an event based on its date
    function getEventAngle(event) {
        const startTime = timelineData.startDate.getTime();
        const endTime = timelineData.endDate.getTime();
        const eventTime = event.date.getTime();
        
        // Calculate the percentage of time elapsed
        const percentage = (eventTime - startTime) / (endTime - startTime);
        
        // Map to the angle range (startAngle to endAngle)
        return startAngle + percentage * (endAngle - startAngle);
    }
    
    // Get the radius for an event marker based on importance
    function getMarkerRadius(event) {
        const baseRadius = 6;
        const importanceFactor = event.importance / 5; // Normalize to 0-1
        return baseRadius * (0.5 + importanceFactor);
    }
    
    // Get the color for an event marker based on importance
    function getMarkerColor(event) {
        // Color scale from light to dark red based on importance
        const colors = [
            '#ffcdd2', // Importance 1
            '#ef9a9a', // Importance 2
            '#e57373', // Importance 3
            '#ef5350', // Importance 4
            '#e53935'  // Importance 5
        ];
        
        return colors[event.importance - 1] || '#e57373';
    }
    
    // Get a point on the arc at a specific angle and radius
    function getPointOnArc(angle, radius) {
        const radians = degreesToRadians(angle);
        return {
            x: Math.cos(radians) * radius,
            y: Math.sin(radians) * radius
        };
    }
    
    // Convert degrees to radians
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // Public API
    return {
        init: init
    };
})();
