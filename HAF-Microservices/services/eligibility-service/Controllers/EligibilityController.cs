using System.Net.Http.Json;
using System.Text.Json;
using EligibilityService.Services;
using HAF.Shared.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EligibilityService.Controllers;

[ApiController]
[Route("api/fsm")]
[Authorize]
public class EligibilityController : ControllerBase
{
    private readonly IPublishEndpoint _publish;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly FsmDatasetService _dataset;

    public EligibilityController(IPublishEndpoint publish, IHttpClientFactory httpClientFactory, FsmDatasetService dataset)
    {
        _publish = publish;
        _httpClientFactory = httpClientFactory;
        _dataset = dataset;
    }

    /// <summary>
    /// Load the FSM-eligible UPN list. Posted by admin bulk-upload.
    /// Replaces the entire in-memory dataset.
    /// </summary>
    [HttpPost("dataset")]
    public IActionResult LoadDataset([FromBody] FsmDatasetRequest req)
    {
        if (req.Upns is null || req.Upns.Count == 0)
            return BadRequest(new { message = "At least one UPN is required." });

        _dataset.LoadDataset(req.Upns);
        return Ok(new { loaded = _dataset.Count, message = $"FSM dataset loaded: {_dataset.Count} eligible UPN(s)." });
    }

    [HttpGet("dataset/status")]
    public IActionResult DatasetStatus() =>
        Ok(new { isLoaded = _dataset.IsLoaded, count = _dataset.Count });

    [HttpPost("{childId}/check")]
    public async Task<IActionResult> Check(string childId)
    {
        var auth = Request.Headers["Authorization"].ToString();
        var client = _httpClientFactory.CreateClient("FamilyService");
        if (!string.IsNullOrWhiteSpace(auth))
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);

        // Fetch child's UPN from family-service
        string? upn = null;
        try
        {
            var resp = await client.GetAsync($"/api/children/{childId}");
            if (resp.IsSuccessStatusCode)
            {
                var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
                json.TryGetProperty("upn", out var upnEl);
                upn = upnEl.ValueKind == JsonValueKind.String ? upnEl.GetString() : null;
            }
        }
        catch { /* family-service unreachable — fall through to dataset check */ }

        var eligible = _dataset.IsEligible(upn);

        // Patch FSM status on the child record
        var patchBody = System.Text.Json.JsonSerializer.Serialize(new { fsmEligible = eligible, fsmVerified = true });
        var content   = new StringContent(patchBody, System.Text.Encoding.UTF8, "application/json");
        await client.PatchAsync($"/api/children/{childId}/fsm", content);

        var now = DateTimeOffset.UtcNow;
        await _publish.Publish(new FsmEligibilityUpdated(childId, eligible, true, now));

        return Ok(new { childId, fsmEligible = eligible, fsmVerified = true, checkedAt = now, upn });
    }

    [HttpPatch("{childId}/eligible")]
    public async Task<IActionResult> SetEligible(string childId, [FromBody] SetEligibleRequest req)
    {
        var auth = Request.Headers["Authorization"].ToString();
        var client = _httpClientFactory.CreateClient("FamilyService");
        if (!string.IsNullOrWhiteSpace(auth))
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", auth);

        var patchBody = System.Text.Json.JsonSerializer.Serialize(new { fsmEligible = req.FsmEligible, fsmVerified = true });
        var content   = new StringContent(patchBody, System.Text.Encoding.UTF8, "application/json");
        await client.PatchAsync($"/api/children/{childId}/fsm", content);

        var now = DateTimeOffset.UtcNow;
        await _publish.Publish(new FsmEligibilityUpdated(childId, req.FsmEligible, true, now));

        return Ok(new { childId, fsmEligible = req.FsmEligible, fsmVerified = true });
    }
}

public record SetEligibleRequest(bool FsmEligible);
public record FsmDatasetRequest(List<string>? Upns);
