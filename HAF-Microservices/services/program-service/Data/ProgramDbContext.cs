using Microsoft.EntityFrameworkCore;
using ProgramService.Models;

namespace ProgramService.Data;

public class ProgramDbContext : DbContext
{
    public ProgramDbContext(DbContextOptions<ProgramDbContext> options) : base(options) { }

    public DbSet<HafCycle> Cycles => Set<HafCycle>();
}
