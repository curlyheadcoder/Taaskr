/**
 * Utility to sort bookings in reverse chronological order
 * (most recent bookings appear on top).
 */
export const sortBookingsByStatusPriority = (bookings = []) => {
  return [...bookings].sort((a, b) => {
    // 1. Primary sort: creation timestamp (newest first)
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
      return timeB - timeA;
    }

    // 2. Secondary sort: booking ID descending (higher ID = newer)
    const idA = Number(a.id) || 0;
    const idB = Number(b.id) || 0;
    if (idA !== idB) {
      return idB - idA;
    }

    // 3. Fallback: scheduled bookingDate + startTime
    const schedA = new Date(`${a.bookingDate || '1970-01-01'}T${a.startTime || '00:00:00'}`).getTime();
    const schedB = new Date(`${b.bookingDate || '1970-01-01'}T${b.startTime || '00:00:00'}`).getTime();
    return schedB - schedA;
  });
};

export const sortBookingsByRecent = sortBookingsByStatusPriority;
