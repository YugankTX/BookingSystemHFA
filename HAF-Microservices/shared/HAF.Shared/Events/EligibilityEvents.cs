namespace HAF.Shared.Events;

public record FsmEligibilityUpdated(
    string ChildId,
    bool FsmEligible,
    bool FsmVerified,
    DateTimeOffset UpdatedAt);
