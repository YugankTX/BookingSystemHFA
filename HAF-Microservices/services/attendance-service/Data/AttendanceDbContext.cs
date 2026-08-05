using AttendanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Data;

public class AttendanceDbContext : DbContext
{
    public AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : base(options) { }

    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AttendanceRecord>()
            .HasIndex(a => a.BookingId)
            .IsUnique();
    }
}
