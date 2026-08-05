using FamilyService.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyService.Data;

public class FamilyDbContext : DbContext
{
    public FamilyDbContext(DbContextOptions<FamilyDbContext> options) : base(options) { }

    public DbSet<ParentGuardian> Parents => Set<ParentGuardian>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<Carer> Carers => Set<Carer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Child>()
            .HasOne(c => c.ParentGuardian)
            .WithMany(p => p.Children)
            .HasForeignKey(c => c.ParentGuardianId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Carer>()
            .HasOne(c => c.Child)
            .WithMany(ch => ch.Carers)
            .HasForeignKey(c => c.ChildId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
