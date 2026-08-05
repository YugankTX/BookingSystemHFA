using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ReportingService.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IHttpClientFactory _http;

    public DashboardController(IHttpClientFactory http) => _http = http;

    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        var auth = Request.Headers["Authorization"].ToString();

        async Task<JsonElement?> Fetch(string clientName, string path)
        {
            try
            {
                var client = _http.CreateClient(clientName);
                if (!string.IsNullOrWhiteSpace(auth))
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);
                var resp = await client.GetAsync(path);
                if (!resp.IsSuccessStatusCode) return null;
                return await resp.Content.ReadFromJsonAsync<JsonElement>();
            }
            catch { return null; }
        }

        async Task<int> Count(string clientName, string path)
        {
            var data = await Fetch(clientName, path);
            if (data is null) return 0;
            if (data.Value.ValueKind == JsonValueKind.Array) return data.Value.GetArrayLength();
            return 0;
        }

        var usersTask      = Fetch("IdentityService", "/api/users");
        var cyclesTask     = Fetch("ProgramService", "/api/cycles");
        var clubsTask      = Fetch("ClubActivityService", "/api/clubs");
        var activitiesTask = Fetch("ClubActivityService", "/api/activities");
        var bookingsTask   = Fetch("BookingService", "/api/bookings");
        var childrenTask   = Fetch("FamilyService", "/api/children");
        var deletionsTask  = Fetch("ComplianceService", "/api/deletion-requests");

        await Task.WhenAll(usersTask, cyclesTask, clubsTask, activitiesTask, bookingsTask, childrenTask, deletionsTask);

        var users     = usersTask.Result;
        var cycles    = cyclesTask.Result;
        var clubs     = clubsTask.Result;
        var activities = activitiesTask.Result;
        var bookings  = bookingsTask.Result;
        var children  = childrenTask.Result;
        var deletions = deletionsTask.Result;

        int CountArray(JsonElement? el) =>
            el?.ValueKind == JsonValueKind.Array ? el.Value.GetArrayLength() : 0;

        int CountWhere(JsonElement? el, string prop, string val) =>
            el?.ValueKind == JsonValueKind.Array
                ? el.Value.EnumerateArray().Count(x =>
                    x.TryGetProperty(prop, out var p) && p.GetString() == val)
                : 0;

        int CountBool(JsonElement? el, string prop, bool val) =>
            el?.ValueKind == JsonValueKind.Array
                ? el.Value.EnumerateArray().Count(x =>
                    x.TryGetProperty(prop, out var p) && p.GetBoolean() == val)
                : 0;

        var recentBookings = bookings?.ValueKind == JsonValueKind.Array
            ? bookings.Value.EnumerateArray().Take(10).Select(b => b).ToList()
            : new List<JsonElement>();

        return Ok(new
        {
            totalUsers        = CountArray(users),
            activeUsers       = CountBool(users, "isActive", true),
            totalCycles       = CountArray(cycles),
            activeCycles      = CountBool(cycles, "isActive", true),
            totalClubs        = CountArray(clubs),
            visibleClubs      = CountBool(clubs, "isVisible", true),
            totalActivities   = CountArray(activities),
            totalBookings     = CountArray(bookings),
            confirmedBookings = CountWhere(bookings, "status", "Confirmed"),
            pendingDeletions  = CountWhere(deletions, "status", "Pending"),
            totalChildren     = CountArray(children),
            fsmEligible       = CountBool(children, "fsmEligible", true),
            recentBookings,
        });
    }
}
