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
    private readonly IConfiguration _config;

    public EligibilityController(IPublishEndpoint publish, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _publish = publish;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpPost("{childId}/check")]
    public async Task<IActionResult> Check(string childId)
    {
        var client = _httpClientFactory.CreateClient("FamilyService");
        var authHeader = Request.Headers["Authorization"].ToString();
        if (!string.IsNullOrWhiteSpace(authHeader))
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", authHeader);

        var patchBody = System.Text.Json.JsonSerializer.Serialize(new { fsmEligible = true, fsmVerified = true });
        var content   = new StringContent(patchBody, System.Text.Encoding.UTF8, "application/json");
        await client.PatchAsync($"/api/children/{childId}/fsm", content);

        var now = DateTimeOffset.UtcNow;
        await _publish.Publish(new FsmEligibilityUpdated(childId, true, true, now));

        return Ok(new { childId, fsmEligible = true, fsmVerified = true, checkedAt = now });
    }

    [HttpPatch("{childId}/eligible")]
    public async Task<IActionResult> SetEligible(string childId, [FromBody] SetEligibleRequest req)
    {
        var client = _httpClientFactory.CreateClient("FamilyService");
        var authHeader = Request.Headers["Authorization"].ToString();
        if (!string.IsNullOrWhiteSpace(authHeader))
            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", authHeader);

        var patchBody = System.Text.Json.JsonSerializer.Serialize(new { fsmEligible = req.FsmEligible, fsmVerified = true });
        var content   = new StringContent(patchBody, System.Text.Encoding.UTF8, "application/json");
        await client.PatchAsync($"/api/children/{childId}/fsm", content);

        var now = DateTimeOffset.UtcNow;
        await _publish.Publish(new FsmEligibilityUpdated(childId, req.FsmEligible, true, now));

        return Ok(new { childId, fsmEligible = req.FsmEligible, fsmVerified = true });
    }
}

public record SetEligibleRequest(bool FsmEligible);
