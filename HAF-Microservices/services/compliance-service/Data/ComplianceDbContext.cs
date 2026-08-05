using ComplianceService.Models;
using Microsoft.EntityFrameworkCore;

namespace ComplianceService.Data;

public class ComplianceDbContext : DbContext
{
    public ComplianceDbContext(DbContextOptions<ComplianceDbContext> options) : base(options) { }

    public DbSet<DeletionRequest> DeletionRequests => Set<DeletionRequest>();
}
