/**
 * Utility to prioritize active and pending tasks forward,
 * while moving completed and cancelled tasks to the end.
 */
export const sortBookingsByStatusPriority = (bookings = []) => {
  const getPriority = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 1;
      case 'PENDING':
        return 2;
      case 'ASSIGNED':
        return 3;
      case 'ACCEPTED':
        return 4;
      case 'COMPLETED':
        return 5;
      case 'CANCELLED':
      case 'REJECTED':
        return 6;
      default:
        return 3;
    }
  };

  return [...bookings].sort((a, b) => {
    const pA = getPriority(a.status);
    const pB = getPriority(b.status);

    if (pA !== pB) {
      return pA - pB;
    }

    // Within same priority, sort newest first
    const timeA = new Date(a.createdAt || a.bookingDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.bookingDate || 0).getTime();
    return timeB - timeA;
  });
};
