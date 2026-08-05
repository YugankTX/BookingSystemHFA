namespace FamilyService.Models;

public class Child
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string FullName { get; set; } = string.Empty;
    public DateTimeOffset DateOfBirth { get; set; }
    public string? UPN { get; set; }
    public bool FsmEligible { get; set; }
    public bool FsmVerified { get; set; }
    public string ParentGuardianId { get; set; } = string.Empty;
    public ParentGuardian ParentGuardian { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
    public ICollection<Carer> Carers { get; set; } = new List<Carer>();
}
