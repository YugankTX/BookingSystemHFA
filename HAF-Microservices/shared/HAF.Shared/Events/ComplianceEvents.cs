namespace HAF.Shared.Events;

public record DeletionRequestApproved(
    string DeletionRequestId,
    string SubjectType,
    string SubjectId,
    DateTimeOffset ProcessedAt);

public record DeletionRequestRejected(
    string DeletionRequestId,
    string SubjectType,
    string SubjectId,
    DateTimeOffset ProcessedAt);
