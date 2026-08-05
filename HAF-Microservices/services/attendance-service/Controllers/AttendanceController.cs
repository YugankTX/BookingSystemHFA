using AttendanceService.Data;
using AttendanceService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AttendanceDbContext _db;

    public AttendanceController(AttendanceDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? activityId, [FromQuery] string? childId) =>
        Ok(await _db.AttendanceRecords
            .Where(a => (activityId == null || a.ActivityId == activityId)
                     && (childId    == null || a.ChildId    == childId))
            .OrderByDescending(a => a.RecordedAt)
            .ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var record = await _db.AttendanceRecords.FindAsync(id);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordAttendanceRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.BookingId))
            return BadRequest(new { message = "BookingId is required." });

        if (await _db.AttendanceRecords.AnyAsync(a => a.BookingId == req.BookingId))
            return Conflict(new { message = "Attendance for this booking has already been recorded." });

        var record = new AttendanceRecord
        {
            Id               = Guid.NewGuid().ToString("N"),
            BookingId        = req.BookingId,
            BookingReference = req.BookingReference ?? string.Empty,
            ChildId          = req.ChildId ?? string.Empty,
            ActivityId       = req.ActivityId ?? string.Empty,
            Attended         = req.Attended,
            Notes            = req.Notes,
            RecordedAt       = DateTimeOffset.UtcNow,
        };

        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync();
        return Created($"/api/attendance/{record.Id}", record);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] RecordAttendanceRequest req)
    {
        var record = await _db.AttendanceRecords.FindAsync(id);
        if (record is null) return NotFound();
        record.Attended   = req.Attended;
        record.Notes      = req.Notes;
        record.RecordedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(record);
    }
}

public record RecordAttendanceRequest(string? BookingId, string? BookingReference, string? ChildId, string? ActivityId, bool Attended, string? Notes);
