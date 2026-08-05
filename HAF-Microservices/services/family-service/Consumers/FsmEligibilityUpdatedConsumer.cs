using FamilyService.Data;
using HAF.Shared.Events;
using MassTransit;

namespace FamilyService.Consumers;

public class FsmEligibilityUpdatedConsumer : IConsumer<FsmEligibilityUpdated>
{
    private readonly FamilyDbContext _db;
    private readonly ILogger<FsmEligibilityUpdatedConsumer> _logger;

    public FsmEligibilityUpdatedConsumer(FamilyDbContext db, ILogger<FsmEligibilityUpdatedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FsmEligibilityUpdated> context)
    {
        var msg = context.Message;
        var child = await _db.Children.FindAsync(msg.ChildId);
        if (child is null)
        {
            _logger.LogWarning("FsmEligibilityUpdated: child {ChildId} not found", msg.ChildId);
            return;
        }

        child.FsmEligible = msg.FsmEligible;
        child.FsmVerified = msg.FsmVerified;
        child.UpdatedAt   = msg.UpdatedAt;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Updated FSM for child {ChildId}: eligible={FsmEligible}", msg.ChildId, msg.FsmEligible);
    }
}
