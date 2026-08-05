using AttendanceService.Data;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Consumers;

public class DeletionRequestApprovedConsumer : IConsumer<DeletionRequestApproved>
{
    private readonly AttendanceDbContext _db;
    private readonly ILogger<DeletionRequestApprovedConsumer> _logger;

    public DeletionRequestApprovedConsumer(AttendanceDbContext db, ILogger<DeletionRequestApprovedConsumer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DeletionRequestApproved> context)
    {
        var msg = context.Message;
        if (msg.SubjectType.ToLowerInvariant() != "child") return;

        var records = await _db.AttendanceRecords
            .Where(a => a.ChildId == msg.SubjectId)
            .ToListAsync();

        if (records.Count > 0)
        {
            _db.AttendanceRecords.RemoveRange(records);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Removed {Count} attendance records for deleted child {ChildId}", records.Count, msg.SubjectId);
        }
    }
}
