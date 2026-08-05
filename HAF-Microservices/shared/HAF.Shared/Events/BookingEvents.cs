namespace HAF.Shared.Events;

public record BookingConfirmed(
    string BookingId,
    string ChildId,
    string ActivityId,
    string BookingReference,
    string ActivityTitle,
    string ChildName,
    DateTimeOffset BookedAt);

public record BookingCancelled(
    string BookingId,
    string ChildId,
    string ActivityId,
    string BookingReference,
    DateTimeOffset CancelledAt);
