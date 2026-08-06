using System.Net.Http.Json;
using System.Text.Json;
using BookingService.Data;
using BookingService.Models;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(15);

    private readonly BookingDbContext _db;
    private readonly IPublishEndpoint _publish;
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;

    public BookingsController(BookingDbContext db, IPublishEndpoint publish, IHttpClientFactory http, IConfiguration config)
    {
        _db = db;
        _publish = publish;
        _http = http;
        _config = config;
    }

    // ─── Bookings ────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? activityId, [FromQuery] string? childId) =>
        Ok(await _db.Bookings
            .Where(b => (activityId == null || b.ActivityId == activityId)
                     && (childId    == null || b.ChildId    == childId))
            .OrderByDescending(b => b.BookedAt)
            .ToListAsync());

    /// <summary>
    /// Create a confirmed booking. A valid seat lock token (obtained from POST /lock)
    /// must be supplied; the lock is consumed on success.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ChildId) || string.IsNullOrWhiteSpace(req.ActivityId))
            return BadRequest(new { message = "ChildId and ActivityId are required." });

        if (string.IsNullOrWhiteSpace(req.LockToken))
            return BadRequest(new { message = "A seat lock token is required. Call POST /api/bookings/lock first." });

        // ── Validate lock ──────────────────────────────────────────────────
        var seatLock = await _db.SeatLocks
            .FirstOrDefaultAsync(sl => sl.LockToken == req.LockToken);

        if (seatLock is null)
            return BadRequest(new { message = "Seat lock not found. Please acquire a new lock via POST /api/bookings/lock." });

        if (seatLock.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _db.SeatLocks.Remove(seatLock);
            await _db.SaveChangesAsync();
            return Conflict(new { message = "Seat lock has expired. Please acquire a new lock via POST /api/bookings/lock." });
        }

        if (seatLock.ActivityId != req.ActivityId || seatLock.ChildId != req.ChildId)
            return BadRequest(new { message = "Seat lock does not match the supplied ChildId / ActivityId." });

        // ── Fetch child and activity info ───────────────────────────────────
        var auth = Request.Headers["Authorization"].ToString();

        var familyClient = _http.CreateClient("FamilyService");
        if (!string.IsNullOrWhiteSpace(auth))
            familyClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);

        var childResp = await familyClient.GetAsync($"/api/children/{req.ChildId}");
        if (!childResp.IsSuccessStatusCode)
            return BadRequest(new { message = "Child not found." });

        var childJson = await childResp.Content.ReadFromJsonAsync<JsonElement>();
        var childName = childJson.GetProperty("fullName").GetString() ?? string.Empty;

        var clubClient = _http.CreateClient("ClubActivityService");
        if (!string.IsNullOrWhiteSpace(auth))
            clubClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);

        var actResp = await clubClient.GetAsync($"/api/activities/{req.ActivityId}");
        if (!actResp.IsSuccessStatusCode)
            return NotFound(new { message = "Activity not found." });

        var actJson  = await actResp.Content.ReadFromJsonAsync<JsonElement>();
        var actTitle = actJson.GetProperty("title").GetString() ?? string.Empty;
        var capacity = actJson.GetProperty("capacity").GetInt32();
        var isActive = actJson.GetProperty("isActive").GetBoolean();
        var actStart = actJson.GetProperty("startDateTime").GetDateTimeOffset();
        var actEnd   = actJson.GetProperty("endDateTime").GetDateTimeOffset();

        if (!isActive)
            return BadRequest(new { message = "Activity is not currently active." });

        // ── Capacity safety check (confirmed bookings must be under cap) ────
        // The lock already reserved a slot, so we check confirmed count only.
        var confirmedCount = await _db.Bookings
            .CountAsync(b => b.ActivityId == req.ActivityId && b.Status == "Confirmed");

        if (confirmedCount >= capacity)
            return Conflict(new { message = $"Activity is full. Capacity: {capacity}." });

        // ── Double-booking check ────────────────────────────────────────────
        var childBookings = await _db.Bookings
            .Where(b => b.ChildId == req.ChildId && b.Status != "Cancelled")
            .ToListAsync();

        var conflict = childBookings.FirstOrDefault(b =>
            b.ActivityStartDateTime.Date == actStart.Date ||
            (b.ActivityStartDateTime < actEnd && b.ActivityEndDateTime > actStart));

        if (conflict is not null)
            return Conflict(new
            {
                message    = "Double-booking detected. This child already has a booking that overlaps with the selected activity.",
                conflictId = conflict.ActivityId,
            });

        // ── Create booking and release the lock atomically ──────────────────
        var booking = new Booking
        {
            Id                    = Guid.NewGuid().ToString("N"),
            ChildId               = req.ChildId,
            ChildName             = childName,
            ActivityId            = req.ActivityId,
            ActivityTitle         = actTitle,
            ActivityStartDateTime = actStart,
            ActivityEndDateTime   = actEnd,
            ActivityCapacity      = capacity,
            Status                = "Confirmed",
            BookingReference      = $"HAF-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
            BookedAt              = DateTimeOffset.UtcNow,
            ConfirmedAt           = DateTimeOffset.UtcNow,
            Notes                 = req.Notes,
        };

        _db.Bookings.Add(booking);
        _db.SeatLocks.Remove(seatLock);   // consume the lock
        await _db.SaveChangesAsync();

        await _publish.Publish(new BookingConfirmed(
            booking.Id, booking.ChildId, booking.ActivityId,
            booking.BookingReference, booking.ActivityTitle, booking.ChildName,
            booking.BookedAt));

        return Created($"/api/bookings/{booking.Id}", booking);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest req)
    {
        var allowed = new[] { "Confirmed", "Cancelled", "Pending" };
        if (!allowed.Contains(req.Status))
            return BadRequest(new { message = "Invalid status. Use: Confirmed, Cancelled, Pending." });

        var booking = await _db.Bookings.FindAsync(id);
        if (booking is null) return NotFound();

        booking.Status = req.Status;
        if (req.Status == "Cancelled") booking.CancelledAt = DateTimeOffset.UtcNow;
        if (req.Status == "Confirmed") booking.ConfirmedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        if (req.Status == "Cancelled")
            await _publish.Publish(new BookingCancelled(
                booking.Id, booking.ChildId, booking.ActivityId,
                booking.BookingReference, booking.CancelledAt!.Value));

        return Ok(booking);
    }

    // ─── Seat Locks ──────────────────────────────────────────────────────────

    /// <summary>
    /// Acquire a 15-minute seat lock for a child on an activity.
    /// Returns the existing lock if one is already active for this child/activity pair.
    /// The lock token must be supplied when calling POST /api/bookings.
    /// </summary>
    [HttpPost("lock")]
    public async Task<IActionResult> AcquireLock([FromBody] AcquireLockRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ChildId) || string.IsNullOrWhiteSpace(req.ActivityId))
            return BadRequest(new { message = "ChildId and ActivityId are required." });

        // ── Validate activity ───────────────────────────────────────────────
        var auth = Request.Headers["Authorization"].ToString();

        var clubClient = _http.CreateClient("ClubActivityService");
        if (!string.IsNullOrWhiteSpace(auth))
            clubClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);

        var actResp = await clubClient.GetAsync($"/api/activities/{req.ActivityId}");
        if (!actResp.IsSuccessStatusCode)
            return NotFound(new { message = "Activity not found." });

        var actJson  = await actResp.Content.ReadFromJsonAsync<JsonElement>();
        var actTitle = actJson.GetProperty("title").GetString() ?? string.Empty;
        var capacity = actJson.GetProperty("capacity").GetInt32();
        var isActive = actJson.GetProperty("isActive").GetBoolean();

        if (!isActive)
            return BadRequest(new { message = "Activity is not currently active." });

        // ── Serialise concurrent lock acquisitions for this activity via
        //    a PostgreSQL advisory lock so the capacity check + INSERT are atomic.
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            await _db.Database.ExecuteSqlAsync(
                $"SELECT pg_advisory_xact_lock(hashtext('seatlock:' || {req.ActivityId})::bigint)");

            // Return existing active lock (idempotent)
            var existing = await _db.SeatLocks
                .FirstOrDefaultAsync(sl => sl.ActivityId == req.ActivityId && sl.ChildId == req.ChildId);

            if (existing is not null)
            {
                if (existing.ExpiresAt > DateTimeOffset.UtcNow)
                {
                    await transaction.RollbackAsync();
                    return Ok(BuildLockResponse(existing, actTitle));
                }

                // Expired lock for this pair — remove it and re-acquire below
                _db.SeatLocks.Remove(existing);
                await _db.SaveChangesAsync();
            }

            // ── Capacity check: confirmed bookings + active locks ────────────
            var confirmedCount = await _db.Bookings
                .CountAsync(b => b.ActivityId == req.ActivityId && b.Status != "Cancelled");

            var activeLockCount = await _db.SeatLocks
                .CountAsync(sl => sl.ActivityId == req.ActivityId && sl.ExpiresAt > DateTimeOffset.UtcNow);

            if (confirmedCount + activeLockCount >= capacity)
            {
                await transaction.RollbackAsync();
                return Conflict(new
                {
                    message  = $"Activity is full. All {capacity} seat(s) are confirmed or currently locked.",
                    capacity,
                    confirmed = confirmedCount,
                    locked    = activeLockCount,
                });
            }

            // ── Grant the lock ───────────────────────────────────────────────
            var seatLock = new SeatLock
            {
                Id         = Guid.NewGuid().ToString("N"),
                LockToken  = Guid.NewGuid().ToString("N"),
                ActivityId = req.ActivityId,
                ChildId    = req.ChildId,
                AcquiredAt = DateTimeOffset.UtcNow,
                ExpiresAt  = DateTimeOffset.UtcNow.Add(LockTtl),
            };

            _db.SeatLocks.Add(seatLock);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(BuildLockResponse(seatLock, actTitle));
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();
            return Conflict(new { message = "A concurrent seat lock request was detected. Please try again." });
        }
    }

    /// <summary>
    /// Check the status of an existing seat lock.
    /// </summary>
    [HttpGet("lock/{lockToken}")]
    public async Task<IActionResult> GetLock(string lockToken)
    {
        var seatLock = await _db.SeatLocks
            .FirstOrDefaultAsync(sl => sl.LockToken == lockToken);

        if (seatLock is null)
            return NotFound(new { message = "Seat lock not found." });

        if (seatLock.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _db.SeatLocks.Remove(seatLock);
            await _db.SaveChangesAsync();
            return Gone(new { message = "Seat lock has expired." });
        }

        return Ok(BuildLockResponse(seatLock, activityTitle: null));
    }

    /// <summary>
    /// Release a seat lock early (e.g. user cancels the booking flow).
    /// </summary>
    [HttpDelete("lock/{lockToken}")]
    public async Task<IActionResult> ReleaseLock(string lockToken)
    {
        var seatLock = await _db.SeatLocks
            .FirstOrDefaultAsync(sl => sl.LockToken == lockToken);

        if (seatLock is null)
            return NotFound(new { message = "Seat lock not found." });

        _db.SeatLocks.Remove(seatLock);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static object BuildLockResponse(SeatLock sl, string? activityTitle) => new
    {
        lockToken        = sl.LockToken,
        activityId       = sl.ActivityId,
        childId          = sl.ChildId,
        activityTitle,
        acquiredAt       = sl.AcquiredAt,
        expiresAt        = sl.ExpiresAt,
        expiresInSeconds = Math.Max(0, (int)(sl.ExpiresAt - DateTimeOffset.UtcNow).TotalSeconds),
    };

    // ASP.NET Core has no built-in 410 Gone helper
    private ObjectResult Gone(object value) =>
        new ObjectResult(value) { StatusCode = StatusCodes.Status410Gone };
}

public record CreateBookingRequest(string? ChildId, string? ActivityId, string? LockToken, string? Notes);
public record UpdateStatusRequest(string Status);
public record AcquireLockRequest(string? ChildId, string? ActivityId);
