/**
 * Utility to format backend LocalTime (e.g. "09:00:00" or "14:30") to readable AM/PM format (e.g. "09:00 AM", "02:30 PM")
 */
export const formatLocalTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Hour '0' becomes '12'

  const formattedHours = hours < 10 ? `0${hours}` : hours;
  return `${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Checks whether a booking date and start time are scheduled in the future compared to current time.
 * @param {string} bookingDate - "YYYY-MM-DD"
 * @param {string} startTime - "HH:mm" or "HH:mm:ss"
 * @returns {boolean} true if current time is strictly before the scheduled start time
 */
export const isBookingInFuture = (bookingDate, startTime) => {
  if (!bookingDate || !startTime) return false;
  try {
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) {
      return false;
    }
    // month - 1 because JS Date months are 0-indexed (0=Jan..11=Dec)
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return Date.now() < scheduledDateTime.getTime();
  } catch {
    return false;
  }
};

/**
 * Formats human-readable time remaining until booking starts, e.g. "Starts in 2h 15m" or "Starts tomorrow"
 */
export const getTimeUntilBooking = (bookingDate, startTime) => {
  if (!bookingDate || !startTime) return '';
  try {
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) return '';
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const diffMs = scheduledDateTime.getTime() - Date.now();
    if (diffMs <= 0) return '';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Starts in ${diffDays}d`;
    }
    if (diffHours > 0) {
      const remMinutes = diffMinutes % 60;
      return remMinutes > 0 ? `Starts in ${diffHours}h ${remMinutes}m` : `Starts in ${diffHours}h`;
    }
    if (diffMinutes > 0) {
      return `Starts in ${diffMinutes}m`;
    }
    return 'Starts soon';
  } catch {
    return '';
  }
};

/**
 * Generates array of formatted time options from 08:00 AM to 09:00 PM (15-min intervals)
 * for use in custom styled select elements across the app.
 * Automatically OMITS past times when date is today, showing ONLY bookable future slots.
 */
export const generateTimeOptions = (selectedDate, todayStr, currentMins, startHour = 8, endHour = 21, stepMins = 15) => {
  const options = [];
  const isToday = selectedDate && todayStr && selectedDate === todayStr;

  for (let mins = startHour * 60; mins <= endHour * 60; mins += stepMins) {
    const isPast = isToday && currentMins !== undefined && currentMins !== null && mins <= (currentMins + 15);
    // Skip any slots that have already passed for today
    if (isPast) {
      continue;
    }

    const hour = Math.floor(mins / 60);
    const min = mins % 60;
    const value = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const label = `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;

    options.push({
      value,
      label,
      disabled: false
    });
  }

  if (options.length === 0) {
    options.push({
      value: '',
      label: 'No slots available today — Please select tomorrow',
      disabled: true
    });
  }

  return options;
};



