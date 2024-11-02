 <script>
        // Parameters
        const year = 2024;
        const month = 10; // November (0-based index: 0 for January, so 10 for November)

        // Get month name and set title
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        document.getElementById('monthYear').innerText = monthNames[month] + ' ' + year;

        // Days of the week starting from Sunday
        const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];

        // Events Data
        const events = [
            { date: '2024-11-06', type: 'case', caseType: 'VA', time: '09:00', account: 'Account A' },
            { date: '2024-11-07', type: 'case', caseType: 'STAR', time: '11:00', account: 'Account B' },
            { date: '2024-11-10', type: 'education', eventType: 'CTC', time: '10:00', account: 'Account C' },
            { startDate: '2024-11-17', endDate: '2024-11-20', type: 'PTO' },
            { date: '2024-11-19', type: 'case', caseType: 'VA', time: '14:00', account: 'Account D' }
        ];

        // Generate the calendar
        function generateCalendar(year, month) {
            const calendarTable = document.getElementById('calendarTable');

            // Create header row
            let headerRow = document.createElement('tr');
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
            let currentDate = 1;
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

            // Get number of days in previous, current, and next months
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Get the day of the week of the first day of the month
            const firstDay = new Date(year, month, 1).getDay();

            let date = 1;
            let nextDate = 1;

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
                        let hasCaseOrEducation = eventsOnDate.some(e => e.type === 'case' || e.type === 'education');

                        if (hasPTO && hasCaseOrEducation) {
                            // Conflict
                            cellClass = 'conflict-event';
                            isConflict = true;
                        } else if (hasPTO) {
                            cellClass = 'pto-event';
                        } else if (eventsOnDate.some(e => e.type === 'education')) {
                            cellClass = 'education-event';
                        } else if (eventsOnDate.some(e => e.type === 'case')) {
                            cellClass = 'case-event';
                        }

                        cell.classList.add(cellClass);

                        // Add event notes where appropriate
                        if (isConflict) {
                            let conflictingEvent = eventsOnDate.find(e => e.type === 'case' || e.type === 'education');
                            if (conflictingEvent.type === 'case') {
                                eventNote = conflictingEvent.caseType;
                            } else if (conflictingEvent.type === 'education') {
                                eventNote = conflictingEvent.eventType;
                            }
                        } else if (cellClass === 'case-event') {
                            let cases = eventsOnDate.filter(e => e.type === 'case');
                            if (cases.length === 1) {
                                eventNote = cases[0].caseType;
                            } else {
                                // Count each case type
                                let caseCounts = {};
                                cases.forEach(c => {
                                    caseCounts[c.caseType] = (caseCounts[c.caseType] || 0) + 1;
                                });
                                eventNote = Object.entries(caseCounts).map(([type, count]) => `${type}, ${count}`).join('; ');
                            }
                        } else if (cellClass === 'education-event') {
                            let eduEvent = eventsOnDate.find(e => e.type === 'education');
                            eventNote = eduEvent.eventType;
                        } else if (cellClass === 'pto-event') {
                            eventNote = 'PTO';
                        }

                        if (eventNote) {
                            let spanEventNote = document.createElement('span');
                            spanEventNote.classList.add('event-note');

                            // Assign text color class based on the event type
                            if (cellClass === 'pto-event') {
                                spanEventNote.classList.add('pto-note');
                            } else if (isConflict) {
                                spanEventNote.classList.add('conflict-note');
                            } else if (cellClass === 'case-event') {
                                spanEventNote.classList.add('case-note');
                            } else if (cellClass === 'education-event') {
                                spanEventNote.classList.add('education-note');
                            }

                            spanEventNote.innerText = eventNote;
                            cell.appendChild(spanEventNote);
                        }

                        // Add hover interaction for case or education events
                        if (hasCaseOrEducation) {
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
            let eventsToShow = eventsOnDate.filter(e => e.type === 'case' || e.type === 'education');
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
                let type = event.type === 'case' ? event.caseType : event.eventType;
                content += `<tr><td>${event.time}</td><td>${type}</td><td>${event.account}</td></tr>`;
            });

            content += '</table>';
            return content;
        }

        generateCalendar(year, month);
    </script>