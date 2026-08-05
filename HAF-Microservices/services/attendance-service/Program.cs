using System.Text;
using AttendanceService.Consumers;
using AttendanceService.Data;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AttendanceService.Models;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<AttendanceDbContext>(o =>
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

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<BookingConfirmedConsumer>();
    x.AddConsumer<DeletionRequestApprovedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        var host = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
        cfg.Host(host, "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(ctx);
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Attendance Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Attendance Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AttendanceDbContext>();
    db.Database.EnsureCreated();

    var existingAttIds = db.AttendanceRecords.Select(a => a.Id).ToHashSet();

    var apr7  = new DateTimeOffset(2025,  4,  7, 9, 0, 0, TimeSpan.Zero);
    var apr14 = new DateTimeOffset(2025,  4, 14, 9, 0, 0, TimeSpan.Zero);
    var jul28 = new DateTimeOffset(2025,  7, 28, 9, 0, 0, TimeSpan.Zero);

    // Attendance for b01–b15 (Multi-Sports Camp a1) — 12 attended, 3 absent
    // Attendance for b16–b25 (Swimming Lessons a2 confirmed) — 8 attended, 2 absent
    // Attendance for b31–b50 (Football / Painting confirmed) — 18 attended, 2 absent
    // Attendance for b56–b60 (Art & Craft confirmed) — 5 attended
    // Total: 50 records (skipping b26–b30 cancelled and b51–b55 pending)
    var records = new List<AttendanceRecord>
    {
        // b01–b15 → a1 Multi-Sports Camp
        new AttendanceRecord { Id="att01", BookingId="b01", BookingReference="HAF-2025-00001", ChildId="ch01", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att02", BookingId="b02", BookingReference="HAF-2025-00002", ChildId="ch02", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att03", BookingId="b03", BookingReference="HAF-2025-00003", ChildId="ch03", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att04", BookingId="b04", BookingReference="HAF-2025-00004", ChildId="ch04", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att05", BookingId="b05", BookingReference="HAF-2025-00005", ChildId="ch05", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att06", BookingId="b06", BookingReference="HAF-2025-00006", ChildId="ch06", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att07", BookingId="b07", BookingReference="HAF-2025-00007", ChildId="ch07", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att08", BookingId="b08", BookingReference="HAF-2025-00008", ChildId="ch08", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att09", BookingId="b09", BookingReference="HAF-2025-00009", ChildId="ch09", ActivityId="a1", Attended=false, RecordedAt=apr7, Notes="Child unwell" },
        new AttendanceRecord { Id="att10", BookingId="b10", BookingReference="HAF-2025-00010", ChildId="ch10", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att11", BookingId="b11", BookingReference="HAF-2025-00011", ChildId="ch11", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att12", BookingId="b12", BookingReference="HAF-2025-00012", ChildId="ch12", ActivityId="a1", Attended=false, RecordedAt=apr7, Notes="No show" },
        new AttendanceRecord { Id="att13", BookingId="b13", BookingReference="HAF-2025-00013", ChildId="ch13", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att14", BookingId="b14", BookingReference="HAF-2025-00014", ChildId="ch14", ActivityId="a1", Attended=false, RecordedAt=apr7, Notes="Family emergency" },
        new AttendanceRecord { Id="att15", BookingId="b15", BookingReference="HAF-2025-00015", ChildId="ch15", ActivityId="a1", Attended=true,  RecordedAt=apr7 },
        // b16–b25 → a2 Swimming Lessons (confirmed only)
        new AttendanceRecord { Id="att16", BookingId="b16", BookingReference="HAF-2025-00016", ChildId="ch16", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att17", BookingId="b17", BookingReference="HAF-2025-00017", ChildId="ch17", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att18", BookingId="b18", BookingReference="HAF-2025-00018", ChildId="ch18", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att19", BookingId="b19", BookingReference="HAF-2025-00019", ChildId="ch19", ActivityId="a2", Attended=false, RecordedAt=apr14, Notes="Child unwell" },
        new AttendanceRecord { Id="att20", BookingId="b20", BookingReference="HAF-2025-00020", ChildId="ch20", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att21", BookingId="b21", BookingReference="HAF-2025-00021", ChildId="ch21", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att22", BookingId="b22", BookingReference="HAF-2025-00022", ChildId="ch22", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att23", BookingId="b23", BookingReference="HAF-2025-00023", ChildId="ch23", ActivityId="a2", Attended=false, RecordedAt=apr14, Notes="No show" },
        new AttendanceRecord { Id="att24", BookingId="b24", BookingReference="HAF-2025-00024", ChildId="ch24", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        new AttendanceRecord { Id="att25", BookingId="b25", BookingReference="HAF-2025-00025", ChildId="ch25", ActivityId="a2", Attended=true,  RecordedAt=apr14 },
        // b31–b40 → a6 Football Tournament
        new AttendanceRecord { Id="att31", BookingId="b31", BookingReference="HAF-2025-00031", ChildId="ch01", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att32", BookingId="b32", BookingReference="HAF-2025-00032", ChildId="ch02", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att33", BookingId="b33", BookingReference="HAF-2025-00033", ChildId="ch03", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att34", BookingId="b34", BookingReference="HAF-2025-00034", ChildId="ch04", ActivityId="a6", Attended=false, RecordedAt=jul28, Notes="No show" },
        new AttendanceRecord { Id="att35", BookingId="b35", BookingReference="HAF-2025-00035", ChildId="ch05", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att36", BookingId="b36", BookingReference="HAF-2025-00036", ChildId="ch06", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att37", BookingId="b37", BookingReference="HAF-2025-00037", ChildId="ch07", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att38", BookingId="b38", BookingReference="HAF-2025-00038", ChildId="ch08", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att39", BookingId="b39", BookingReference="HAF-2025-00039", ChildId="ch09", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att40", BookingId="b40", BookingReference="HAF-2025-00040", ChildId="ch10", ActivityId="a6", Attended=true,  RecordedAt=jul28 },
        // b41–b50 → a7 Painting & Drawing
        new AttendanceRecord { Id="att41", BookingId="b41", BookingReference="HAF-2025-00041", ChildId="ch11", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att42", BookingId="b42", BookingReference="HAF-2025-00042", ChildId="ch12", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att43", BookingId="b43", BookingReference="HAF-2025-00043", ChildId="ch13", ActivityId="a7", Attended=false, RecordedAt=jul28, Notes="Child unwell" },
        new AttendanceRecord { Id="att44", BookingId="b44", BookingReference="HAF-2025-00044", ChildId="ch14", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att45", BookingId="b45", BookingReference="HAF-2025-00045", ChildId="ch15", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att46", BookingId="b46", BookingReference="HAF-2025-00046", ChildId="ch16", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att47", BookingId="b47", BookingReference="HAF-2025-00047", ChildId="ch17", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att48", BookingId="b48", BookingReference="HAF-2025-00048", ChildId="ch18", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        new AttendanceRecord { Id="att49", BookingId="b49", BookingReference="HAF-2025-00049", ChildId="ch19", ActivityId="a7", Attended=false, RecordedAt=jul28, Notes="No show" },
        new AttendanceRecord { Id="att50", BookingId="b50", BookingReference="HAF-2025-00050", ChildId="ch20", ActivityId="a7", Attended=true,  RecordedAt=jul28 },
        // b56–b60 → a3 Art & Craft Workshop
        new AttendanceRecord { Id="att56", BookingId="b56", BookingReference="HAF-2025-00056", ChildId="ch26", ActivityId="a3", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att57", BookingId="b57", BookingReference="HAF-2025-00057", ChildId="ch27", ActivityId="a3", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att58", BookingId="b58", BookingReference="HAF-2025-00058", ChildId="ch28", ActivityId="a3", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att59", BookingId="b59", BookingReference="HAF-2025-00059", ChildId="ch29", ActivityId="a3", Attended=true,  RecordedAt=apr7 },
        new AttendanceRecord { Id="att60", BookingId="b60", BookingReference="HAF-2025-00060", ChildId="ch30", ActivityId="a3", Attended=false, RecordedAt=apr7, Notes="Left early" },
    }.Where(r => !existingAttIds.Contains(r.Id)).ToList();
    if (records.Any()) { db.AttendanceRecords.AddRange(records); db.SaveChanges(); }
}

app.Run();
