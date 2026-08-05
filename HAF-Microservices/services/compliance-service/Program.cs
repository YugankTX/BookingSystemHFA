using System.Text;
using ComplianceService.Data;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ComplianceService.Models;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<ComplianceDbContext>(o =>
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
    x.UsingRabbitMq((ctx, cfg) =>
    {
        var host = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
        cfg.Host(host, "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(ctx);
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Compliance Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Compliance Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ComplianceDbContext>();
    db.Database.EnsureCreated();

    var existingDrIds = db.DeletionRequests.Select(d => d.Id).ToHashSet();
    var requests = new List<DeletionRequest>
    {
        new DeletionRequest { Id="dr01", SubjectType="child",  SubjectId="ch15", RequestedByUserId="u1",  Reason="Parent requested GDPR data erasure",          Status="Pending",  RequestedAt=new DateTimeOffset(2025,10, 5,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr02", SubjectType="parent", SubjectId="p09",  RequestedByUserId="u1",  Reason="Account closure request by user",              Status="Pending",  RequestedAt=new DateTimeOffset(2025,10,12,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr03", SubjectType="child",  SubjectId="ch22", RequestedByUserId="u5",  Reason="Child moved out of borough",                   Status="Pending",  RequestedAt=new DateTimeOffset(2025,11, 3,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr04", SubjectType="parent", SubjectId="p14",  RequestedByUserId="u5",  Reason="Parent opted out of all HAF data retention",   Status="Pending",  RequestedAt=new DateTimeOffset(2025,11,18,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr05", SubjectType="child",  SubjectId="ch03", RequestedByUserId="u1",  Reason="GDPR erasure request verified and approved",    Status="Approved", RequestedAt=new DateTimeOffset(2025, 8,14,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025, 8,20,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr06", SubjectType="parent", SubjectId="p07",  RequestedByUserId="u1",  Reason="Duplicate account — primary account retained",  Status="Approved", RequestedAt=new DateTimeOffset(2025, 9, 2,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025, 9, 9,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr07", SubjectType="child",  SubjectId="ch30", RequestedByUserId="u5",  Reason="Data purge following end of programme cycle",   Status="Approved", RequestedAt=new DateTimeOffset(2025, 9,25,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025,10, 1,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr08", SubjectType="child",  SubjectId="ch08", RequestedByUserId="u1",  Reason="Submitted in error — child still enrolled",    Status="Rejected", RequestedAt=new DateTimeOffset(2025, 7,10,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025, 7,12,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr09", SubjectType="parent", SubjectId="p02",  RequestedByUserId="u5",  Reason="Request lacks valid legal basis for erasure",   Status="Rejected", RequestedAt=new DateTimeOffset(2025, 8, 5,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025, 8, 8,0,0,0,TimeSpan.Zero) },
        new DeletionRequest { Id="dr10", SubjectType="child",  SubjectId="ch17", RequestedByUserId="u1",  Reason="Active bookings exist — cannot delete now",     Status="Rejected", RequestedAt=new DateTimeOffset(2025, 9,15,0,0,0,TimeSpan.Zero), ProcessedAt=new DateTimeOffset(2025, 9,17,0,0,0,TimeSpan.Zero) },
    }.Where(d => !existingDrIds.Contains(d.Id)).ToList();
    if (requests.Any()) { db.DeletionRequests.AddRange(requests); db.SaveChanges(); }
}

app.Run();
