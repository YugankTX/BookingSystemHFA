namespace EligibilityService.Services;

public class FsmDatasetService
{
    private readonly HashSet<string> _eligibleUpns = new(StringComparer.OrdinalIgnoreCase);
    private bool _loaded;

    public void LoadDataset(IEnumerable<string> upns)
    {
        _eligibleUpns.Clear();
        foreach (var upn in upns)
            if (!string.IsNullOrWhiteSpace(upn))
                _eligibleUpns.Add(upn.Trim());
        _loaded = true;
    }

    public bool IsEligible(string? upn) =>
        !_loaded || (!string.IsNullOrWhiteSpace(upn) && _eligibleUpns.Contains(upn.Trim()));

    public int Count => _eligibleUpns.Count;
    public bool IsLoaded => _loaded;
}
