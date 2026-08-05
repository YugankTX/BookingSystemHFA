using BookingService.Data;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Services;

public class SeatLockCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SeatLockCleanupService> _logger;

    public SeatLockCleanupService(IServiceScopeFactory scopeFactory, ILogger<SeatLockCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

            var expired = await db.SeatLocks
                .Where(sl => sl.ExpiresAt <= DateTimeOffset.UtcNow)
                .ToListAsync(stoppingToken);

            if (expired.Count > 0)
            {
                db.SeatLocks.RemoveRange(expired);
                await db.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Removed {Count} expired seat lock(s)", expired.Count);
            }
        }
    }
}
