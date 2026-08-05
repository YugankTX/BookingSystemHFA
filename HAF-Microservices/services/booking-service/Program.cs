using System.Text;
using BookingService.Consumers;
using BookingService.Data;
using BookingService.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BookingService.Models;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<BookingDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer           = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidateAudience         = true,
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        ValidateLifetime         = true,
        ClockSkew                = TimeSpan.Zero,
    });

builder.Services.AddAuthorization();
builder.Services.AddHostedService<SeatLockCleanupService>();

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<DeletionRequestApprovedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        var host = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
        cfg.Host(host, "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(ctx);
    });
});

builder.Services.AddHttpClient("FamilyService", c =>
    c.BaseAddress = new Uri(builder.Configuration["Services:FamilyService"] ?? "http://localhost:5004"));

builder.Services.AddHttpClient("ClubActivityService", c =>
    c.BaseAddress = new Uri(builder.Configuration["Services:ClubActivityService"] ?? "http://localhost:5003"));

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Booking Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Enter: Bearer {token}",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.ApiKey,
        Scheme      = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Booking Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    db.Database.EnsureCreated();

    // Create SeatLocks table if it doesn't exist (EnsureCreated won't add new tables to an existing DB)
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "SeatLocks" (
            "Id"         text NOT NULL PRIMARY KEY,
            "LockToken"  text NOT NULL,
            "ActivityId" text NOT NULL,
            "ChildId"    text NOT NULL,
            "AcquiredAt" timestamptz NOT NULL,
            "ExpiresAt"  timestamptz NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_SeatLocks_LockToken"             ON "SeatLocks" ("LockToken");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_SeatLocks_ActivityId_ChildId"    ON "SeatLocks" ("ActivityId", "ChildId");
        """);

    var existingBookingIds = db.Bookings.Select(b => b.Id).ToHashSet();

    // Activity snapshot data (denormalised — mirrors club-activity-service seeds)
    var a1Start = new DateTimeOffset(2025,  4,  7,  9,  0, 0, TimeSpan.Zero);
    var a1End   = new DateTimeOffset(2025,  4, 11, 15,  0, 0, TimeSpan.Zero);
    var a2Start = new DateTimeOffset(2025,  4, 14, 10,  0, 0, TimeSpan.Zero);
    var a2End   = new DateTimeOffset(2025,  4, 18, 12,  0, 0, TimeSpan.Zero);
    var a3Start = new DateTimeOffset(2025,  4,  7, 10,  0, 0, TimeSpan.Zero);
    var a3End   = new DateTimeOffset(2025,  4, 11, 14,  0, 0, TimeSpan.Zero);
    var a6Start = new DateTimeOffset(2025,  7, 28,  9,  0, 0, TimeSpan.Zero);
    var a6End   = new DateTimeOffset(2025,  8,  1, 15,  0, 0, TimeSpan.Zero);
    var a7Start = new DateTimeOffset(2025,  7, 28, 10,  0, 0, TimeSpan.Zero);
    var a7End   = new DateTimeOffset(2025,  8,  1, 14,  0, 0, TimeSpan.Zero);
    var a8Start = new DateTimeOffset(2025,  7, 28,  9, 30, 0, TimeSpan.Zero);
    var a8End   = new DateTimeOffset(2025,  8,  1, 16,  0, 0, TimeSpan.Zero);

    var mar10 = new DateTimeOffset(2025, 3, 10, 0, 0, 0, TimeSpan.Zero);
    var jun15 = new DateTimeOffset(2025, 6, 15, 0, 0, 0, TimeSpan.Zero);

    var bookings = new List<Booking>
    {
        // ch01–ch15 → Multi-Sports Camp (a1) [b01–b15 Confirmed]
        new Booking { Id="b01", ChildId="ch01", ChildName="Oliver Thompson",  ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00001", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b02", ChildId="ch02", ChildName="Ella Thompson",    ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00002", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b03", ChildId="ch03", ChildName="Noah Wilson",      ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00003", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b04", ChildId="ch04", ChildName="Isla Wilson",      ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00004", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b05", ChildId="ch05", ChildName="Liam Davis",       ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00005", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b06", ChildId="ch06", ChildName="Grace Davis",      ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00006", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b07", ChildId="ch07", ChildName="Harry Brown",      ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00007", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b08", ChildId="ch08", ChildName="Poppy Brown",      ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00008", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b09", ChildId="ch09", ChildName="Jack Johnson",     ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00009", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b10", ChildId="ch10", ChildName="Lily Johnson",     ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00010", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b11", ChildId="ch11", ChildName="George Taylor",    ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00011", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b12", ChildId="ch12", ChildName="Amelia Taylor",    ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00012", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b13", ChildId="ch13", ChildName="Charlie Martin",   ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00013", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b14", ChildId="ch14", ChildName="Freya Martin",     ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00014", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b15", ChildId="ch15", ChildName="Alfie Anderson",   ActivityId="a1", ActivityTitle="Multi-Sports Camp", ActivityStartDateTime=a1Start, ActivityEndDateTime=a1End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00015", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        // ch16–ch30 → Swimming Lessons (a2) [b16–b25 Confirmed, b26–b30 Cancelled]
        new Booking { Id="b16", ChildId="ch16", ChildName="Ruby Anderson",    ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00016", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b17", ChildId="ch17", ChildName="Freddie White",    ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00017", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b18", ChildId="ch18", ChildName="Florence White",   ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00018", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b19", ChildId="ch19", ChildName="Theo Harris",      ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00019", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b20", ChildId="ch20", ChildName="Rosie Harris",     ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00020", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b21", ChildId="ch21", ChildName="Archie Clark",     ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00021", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b22", ChildId="ch22", ChildName="Daisy Clark",      ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00022", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b23", ChildId="ch23", ChildName="Oscar Lewis",      ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00023", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b24", ChildId="ch24", ChildName="Ivy Lewis",        ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00024", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b25", ChildId="ch25", ChildName="Toby Walker",      ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Confirmed",  BookingReference="HAF-2025-00025", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b26", ChildId="ch26", ChildName="Violet Walker",    ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Cancelled",  BookingReference="HAF-2025-00026", BookedAt=mar10, CancelledAt=mar10.AddDays(5) },
        new Booking { Id="b27", ChildId="ch27", ChildName="Sebastian Hall",   ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Cancelled",  BookingReference="HAF-2025-00027", BookedAt=mar10, CancelledAt=mar10.AddDays(5) },
        new Booking { Id="b28", ChildId="ch28", ChildName="Phoebe Hall",      ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Cancelled",  BookingReference="HAF-2025-00028", BookedAt=mar10, CancelledAt=mar10.AddDays(5) },
        new Booking { Id="b29", ChildId="ch29", ChildName="Reuben Young",     ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Cancelled",  BookingReference="HAF-2025-00029", BookedAt=mar10, CancelledAt=mar10.AddDays(5) },
        new Booking { Id="b30", ChildId="ch30", ChildName="Millie Young",     ActivityId="a2", ActivityTitle="Swimming Lessons",  ActivityStartDateTime=a2Start, ActivityEndDateTime=a2End, ActivityCapacity=15, Status="Cancelled",  BookingReference="HAF-2025-00030", BookedAt=mar10, CancelledAt=mar10.AddDays(5) },
        // ch01–ch10 → Football Tournament (a6) [b31–b40 Confirmed]
        new Booking { Id="b31", ChildId="ch01", ChildName="Oliver Thompson",  ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00031", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b32", ChildId="ch02", ChildName="Ella Thompson",    ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00032", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b33", ChildId="ch03", ChildName="Noah Wilson",      ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00033", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b34", ChildId="ch04", ChildName="Isla Wilson",      ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00034", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b35", ChildId="ch05", ChildName="Liam Davis",       ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00035", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b36", ChildId="ch06", ChildName="Grace Davis",      ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00036", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b37", ChildId="ch07", ChildName="Harry Brown",      ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00037", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b38", ChildId="ch08", ChildName="Poppy Brown",      ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00038", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b39", ChildId="ch09", ChildName="Jack Johnson",     ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00039", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b40", ChildId="ch10", ChildName="Lily Johnson",     ActivityId="a6", ActivityTitle="Football Tournament", ActivityStartDateTime=a6Start, ActivityEndDateTime=a6End, ActivityCapacity=30, Status="Confirmed", BookingReference="HAF-2025-00040", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        // ch11–ch20 → Painting & Drawing (a7) [b41–b50 Confirmed]
        new Booking { Id="b41", ChildId="ch11", ChildName="George Taylor",    ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00041", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b42", ChildId="ch12", ChildName="Amelia Taylor",    ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00042", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b43", ChildId="ch13", ChildName="Charlie Martin",   ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00043", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b44", ChildId="ch14", ChildName="Freya Martin",     ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00044", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b45", ChildId="ch15", ChildName="Alfie Anderson",   ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00045", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b46", ChildId="ch16", ChildName="Ruby Anderson",    ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00046", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b47", ChildId="ch17", ChildName="Freddie White",    ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00047", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b48", ChildId="ch18", ChildName="Florence White",   ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00048", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b49", ChildId="ch19", ChildName="Theo Harris",      ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00049", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        new Booking { Id="b50", ChildId="ch20", ChildName="Rosie Harris",     ActivityId="a7", ActivityTitle="Painting & Drawing", ActivityStartDateTime=a7Start, ActivityEndDateTime=a7End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00050", BookedAt=jun15, ConfirmedAt=jun15.AddDays(1) },
        // ch21–ch25 → Robotics Workshop (a8) [b51–b55 Pending]
        new Booking { Id="b51", ChildId="ch21", ChildName="Archie Clark",     ActivityId="a8", ActivityTitle="Robotics Workshop",  ActivityStartDateTime=a8Start, ActivityEndDateTime=a8End, ActivityCapacity=15, Status="Pending",   BookingReference="HAF-2025-00051", BookedAt=jun15 },
        new Booking { Id="b52", ChildId="ch22", ChildName="Daisy Clark",      ActivityId="a8", ActivityTitle="Robotics Workshop",  ActivityStartDateTime=a8Start, ActivityEndDateTime=a8End, ActivityCapacity=15, Status="Pending",   BookingReference="HAF-2025-00052", BookedAt=jun15 },
        new Booking { Id="b53", ChildId="ch23", ChildName="Oscar Lewis",      ActivityId="a8", ActivityTitle="Robotics Workshop",  ActivityStartDateTime=a8Start, ActivityEndDateTime=a8End, ActivityCapacity=15, Status="Pending",   BookingReference="HAF-2025-00053", BookedAt=jun15 },
        new Booking { Id="b54", ChildId="ch24", ChildName="Ivy Lewis",        ActivityId="a8", ActivityTitle="Robotics Workshop",  ActivityStartDateTime=a8Start, ActivityEndDateTime=a8End, ActivityCapacity=15, Status="Pending",   BookingReference="HAF-2025-00054", BookedAt=jun15 },
        new Booking { Id="b55", ChildId="ch25", ChildName="Toby Walker",      ActivityId="a8", ActivityTitle="Robotics Workshop",  ActivityStartDateTime=a8Start, ActivityEndDateTime=a8End, ActivityCapacity=15, Status="Pending",   BookingReference="HAF-2025-00055", BookedAt=jun15 },
        // ch26–ch30 → Art & Craft Workshop (a3) [b56–b60 Confirmed]
        new Booking { Id="b56", ChildId="ch26", ChildName="Violet Walker",    ActivityId="a3", ActivityTitle="Art & Craft Workshop", ActivityStartDateTime=a3Start, ActivityEndDateTime=a3End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00056", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b57", ChildId="ch27", ChildName="Sebastian Hall",   ActivityId="a3", ActivityTitle="Art & Craft Workshop", ActivityStartDateTime=a3Start, ActivityEndDateTime=a3End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00057", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b58", ChildId="ch28", ChildName="Phoebe Hall",      ActivityId="a3", ActivityTitle="Art & Craft Workshop", ActivityStartDateTime=a3Start, ActivityEndDateTime=a3End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00058", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b59", ChildId="ch29", ChildName="Reuben Young",     ActivityId="a3", ActivityTitle="Art & Craft Workshop", ActivityStartDateTime=a3Start, ActivityEndDateTime=a3End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00059", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
        new Booking { Id="b60", ChildId="ch30", ChildName="Millie Young",     ActivityId="a3", ActivityTitle="Art & Craft Workshop", ActivityStartDateTime=a3Start, ActivityEndDateTime=a3End, ActivityCapacity=20, Status="Confirmed", BookingReference="HAF-2025-00060", BookedAt=mar10, ConfirmedAt=mar10.AddDays(1) },
    }.Where(b => !existingBookingIds.Contains(b.Id)).ToList();
    if (bookings.Any()) { db.Bookings.AddRange(bookings); db.SaveChanges(); }
}

app.Run();
