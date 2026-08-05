using ClubActivityService.Models;
using Microsoft.EntityFrameworkCore;

namespace ClubActivityService.Data;

public class ClubDbContext : DbContext
{
    public ClubDbContext(DbContextOptions<ClubDbContext> options) : base(options) { }

    public DbSet<ClubProfile> Clubs => Set<ClubProfile>();
    public DbSet<Activity> Activities => Set<Activity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Activity>()
            .HasOne(a => a.ClubProfile)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.ClubProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
