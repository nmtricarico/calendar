document.addEventListener('DOMContentLoaded', function() {

    // Parameters
    const year = 2024;
    const month = 10; // November (0-based index: 0 for January)

    // Get month name and set title
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    document.getElementById('monthYear').innerText = monthNames[month] + ' ' + year;

    // Days of the week starting from Sunday
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];

    // Fetch events from SheetDB
    async function fetchEvents() {
        try {
             const response = await fetch('https://sheetdb.io/api/v1/za0f3itq46jvd');
            const data = await response.json();
            console.log('Fetched events:', data); // For debugging
            return data;
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    }

    // Generate the calendar
    function generateCalendar(year, month, events) {
         console.log('Events received in generateCalendar:', events);
        const calendarTable = document.getElementById('calendarTable');
        calendarTable.innerHTML = '';

            // Create header row
    let headerRow = document.createElement('tr');
    headerRow.classList.add('calendar-header'); // Add a class for styling

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
    for (let day of daysOfWeek) {
        let th = document.createElement('th');
        th.innerText = day;
        headerRow.appendChild(th);
    }
    calendarTable.appendChild(headerRow);

        // Prepare event mapping
        const eventMap = {};

        // Process events
        events.forEach(event => {
            if (event.type === 'PTO') {
                // PTO spans multiple days
                let currentDate = new Date(event.startDate);
                const endDate = new Date(event.endDate);
                while (currentDate <= endDate) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    if (!eventMap[dateStr]) {
                        eventMap[dateStr] = [];
                    }
                    eventMap[dateStr].push(event);
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                // Single day events
                const dateStr = event.date;
                if (!eventMap[dateStr]) {
                    eventMap[dateStr] = [];
                }
                eventMap[dateStr].push(event);
            }
        });

        // Variables to keep track of dates
        let date = 1;
        let nextDate = 1;
        let prevMonth = month - 1;
        let nextMonth = month + 1;
        let prevYear = year;
        let nextYear = year;

        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }

        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }

        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        for (let i = 0; i < 6; i++) { // 6 weeks (rows)
            let row = document.createElement('tr');

            for (let j = 0; j < 7; j++) { // 7 days (columns)
                let cell = document.createElement('td');
                let spanDate = document.createElement('span');
                spanDate.classList.add('date-number');

                let cellDate;
                let dateStr;

                if (i === 0 && j < firstDay) {
                    // Dates from previous month
                    let prevDate = daysInPrevMonth - (firstDay - j - 1);
                    spanDate.innerText = prevDate;
                    cell.classList.add('other-month');
                    cellDate = new Date(prevYear, prevMonth, prevDate);
                } else if (date > daysInMonth) {
                    // Dates from next month
                    spanDate.innerText = nextDate;
                    cell.classList.add('other-month');
                    cellDate = new Date(nextYear, nextMonth, nextDate);
                    nextDate++;
                } else {
                    // Dates in current month
                    spanDate.innerText = date;
                    cellDate = new Date(year, month, date);
                    date++;
                }

                // Format the date string as 'YYYY-MM-DD'
                dateStr = cellDate.toISOString().split('T')[0];

                // Check for events on this date
                if (eventMap[dateStr]) {
                    let eventsOnDate = eventMap[dateStr];
                    let cellClass = '';
                    let eventNote = '';
                    let isConflict = false;

                    // Determine if there is a PTO and another event on the same day
                    let hasPTO = eventsOnDate.some(e => e.type === 'PTO');
                    let hasCASEOrEDUCATION = eventsOnDate.some(e => e.type === 'CASE' || e.type === 'EDUCATION');

                    if (hasPTO && hasCASEOrEDUCATION) {
                        // Conflict
                        cellClass = 'conflict-event';
                        isConflict = true;
                    } else if (hasPTO) {
                        cellClass = 'PTO-event';
                    } else if (eventsOnDate.some(e => e.type === 'EDUCATION')) {
                        cellClass = 'EDUCATION-event';
                    } else if (eventsOnDate.some(e => e.type === 'CASE')) {
                        cellClass = 'CASE-event';
                    }

                    if (cellClass) {
                        cell.classList.add(cellClass);
                    }

                    // Add event notes where appropriate
                    if (isConflict) {
                        let conflictingEvent = eventsOnDate.find(e => e.type === 'CASE' || e.type === 'EDUCATION');
                        if (conflictingEvent.type === 'CASE') {
                            eventNote = conflictingEvent.CASEType;
                        } else if (conflictingEvent.type === 'EDUCATION') {
                            eventNote = conflictingEvent.eventType;
                        }
                    } else if (cellClass === 'CASE-event') {
                        let CASE = eventsOnDate.filter(e => e.type === 'CASE');
                        if (CASE.length === 1) {
                            eventNote = CASE[0].CASEType;
                        } else {
                            // Count each CASE type
                            let CASECounts = {};
                            CASE.forEach(c => {
                                CASECounts[c.CASEType] = (CASECounts[c.CASEType] || 0) + 1;
                            });
                            eventNote = Object.entries(CASECounts).map(([type, count]) => `${type}, ${count}`).join('; ');
                        }
                    } else if (cellClass === 'EDUCATION-event') {
                        let eduEvent = eventsOnDate.find(e => e.type === 'EDUCATION');
                        eventNote = "CTC";
                    } else if (cellClass === 'PTO-event') {
                        eventNote = 'PTO';
                    }

                    if (eventNote) {
                        let spanEventNote = document.createElement('span');
                        spanEventNote.classList.add('event-note');

                        // Assign text color class based on the event type
                        if (cellClass === 'PTO-event') {
                            spanEventNote.classList.add('PTO-note');
                        } else if (isConflict) {
                            spanEventNote.classList.add('conflict-note');
                        } else if (cellClass === 'CASE-event') {
                            spanEventNote.classList.add('CASE-note');
                        } else if (cellClass === 'EDUCATION-event') {
                            spanEventNote.classList.add('EDUCATION-note');
                        }

                        spanEventNote.innerText = eventNote;
                        cell.appendChild(spanEventNote);
                    }

                    // Add hover interaction for CASE or EDUCATION events
                    if (hasCASEOrEDUCATION) {
                        cell.addEventListener('mouseenter', (e) => {
                            showTooltip(e, eventsOnDate);
                        });
                        cell.addEventListener('mousemove', (e) => {
                            moveTooltip(e);
                        });
                        cell.addEventListener('mouseleave', hideTooltip);
                    }
                }

                cell.appendChild(spanDate);
                row.appendChild(cell);
            }
            calendarTable.appendChild(row);
        }
    }

    // Tooltip functions
    const tooltip = document.getElementById('tooltip');

    function showTooltip(e, eventsOnDate) {
        // Filter out PTO events
        let eventsToShow = eventsOnDate.filter(e => e.type === 'CASE' || e.type === 'EDUCATION');
        if (eventsToShow.length === 0) return;

        tooltip.innerHTML = createTooltipContent(eventsToShow);
        tooltip.style.display = 'block';
        moveTooltip(e);
    }

    function moveTooltip(e) {
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        let x = e.pageX + 15;
        let y = e.pageY + 15;

        if (x + tooltipWidth > window.innerWidth) {
            x = e.pageX - tooltipWidth - 15;
        }
        if (y + tooltipHeight > window.innerHeight) {
            y = e.pageY - tooltipHeight - 15;
        }

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
    }

function createTooltipContent(events) {
    let content = '<table>';
    content += '<tr><th>Time</th><th>Type</th><th>Account</th></tr>';

    events.forEach(event => {
        console.log('Event details:', event); // Debugging

        // Convert the time from plain text to military time if it exists
        let time = event.time ? convertToMilitaryTime(event.time) : 'TBD';

        // Handle event type to determine what to display
        let type = event.type === 'CASE' ? event.CASEType : event.eventType;

        // Append data row to content
        content += `<tr><td>${time}</td><td>${type}</td><td>${event.account}</td></tr>`;
    });

    content += '</table>';
    return content;
}

// Helper function to convert plain text time to military (24-hour) format
function convertToMilitaryTime(time) {
    if (!time) {
        return 'TBD';
    }

    // Assuming the time is in the format "hh:mm AM/PM"
    let [timePart, modifier] = time.split(' ');

    // If there's no modifier (AM/PM), assume it’s already in 24-hour format
    if (!modifier) {
        return timePart; 
    }

    let [hours, minutes] = timePart.split(':');

    // Convert hours to number for easier processing
    hours = parseInt(hours, 10);

    // Convert to 24-hour format based on AM/PM
    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }

    // Format the hours with leading zeros if needed
    hours = hours < 10 ? '0' + hours : hours;

    return `${hours}:${minutes}`;
}

    // Fetch events and generate calendar
    fetchEvents().then(events => {
         console.log('Events to be passed to generateCalendar:', events);
        generateCalendar(year, month, events);
    });

});
