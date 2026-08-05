using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProgramService.Data;
using ProgramService.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<ProgramDbContext>(o =>
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
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Program Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Program Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProgramDbContext>();
    db.Database.EnsureCreated();
    var existingCycleIds = db.Cycles.Select(c => c.Id).ToHashSet();
    var cycles = new List<HafCycle>
    {
        new HafCycle { Id = "c1", Name = "Easter 2025",    Description = "HAF Easter 2025 Programme",    StartDate = new DateTimeOffset(2025,  4,  7, 0, 0, 0, TimeSpan.Zero), EndDate = new DateTimeOffset(2025,  4, 18, 0, 0, 0, TimeSpan.Zero), IsActive = false },
        new HafCycle { Id = "c2", Name = "Summer 2025",    Description = "HAF Summer 2025 Programme",    StartDate = new DateTimeOffset(2025,  7, 28, 0, 0, 0, TimeSpan.Zero), EndDate = new DateTimeOffset(2025,  8, 29, 0, 0, 0, TimeSpan.Zero), IsActive = false },
        new HafCycle { Id = "c3", Name = "Christmas 2025", Description = "HAF Christmas 2025 Programme", StartDate = new DateTimeOffset(2025, 12, 22, 0, 0, 0, TimeSpan.Zero), EndDate = new DateTimeOffset(2026,  1,  2, 0, 0, 0, TimeSpan.Zero), IsActive = false },
        new HafCycle { Id = "c4", Name = "Easter 2026",    Description = "HAF Easter 2026 Programme",    StartDate = new DateTimeOffset(2026,  4,  6, 0, 0, 0, TimeSpan.Zero), EndDate = new DateTimeOffset(2026,  4, 17, 0, 0, 0, TimeSpan.Zero), IsActive = true  },
    }.Where(c => !existingCycleIds.Contains(c.Id)).ToList();
    if (cycles.Any()) { db.Cycles.AddRange(cycles); db.SaveChanges(); }
}

app.Run();
