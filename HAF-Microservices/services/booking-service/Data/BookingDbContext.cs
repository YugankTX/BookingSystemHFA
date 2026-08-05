using BookingService.Models;
using Microsoft.EntityFrameworkCore;

namespace BookingService.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options) : base(options) { }

    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<SeatLock> SeatLocks => Set<SeatLock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingReference)
            .IsUnique();

        modelBuilder.Entity<SeatLock>()
            .HasIndex(sl => sl.LockToken)
            .IsUnique();

        // One active lock per child per activity
        modelBuilder.Entity<SeatLock>()
            .HasIndex(sl => new { sl.ActivityId, sl.ChildId })
            .IsUnique();
    }
}
