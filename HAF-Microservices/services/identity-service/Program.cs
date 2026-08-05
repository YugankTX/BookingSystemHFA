using System.Text;
using IdentityService.Data;
using IdentityService.Models;
using IdentityService.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
    

builder.Services.AddDbContext<IdentityDbContext>(o =>
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

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Identity Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Identity Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    db.Database.EnsureCreated();
    SeedUsers(db);
}

app.Run();

static void SeedUsers(IdentityDbContext db)
{
    var now = DateTimeOffset.UtcNow.ToString("o");
    var all = new List<AuthUser>
    {
        new AuthUser { Id = "u1",   Email = "admin@haf.gov.uk",                FullName = "System Administrator",  Role = "admin",   Phone = "01274 000001", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "u2",   Email = "council@haf.gov.uk",              FullName = "Council Manager",        Role = "council", Phone = "01274 000002", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "u3",   Email = "club@haf.gov.uk",                 FullName = "Club Operator",          Role = "club",    Phone = "01274 000003", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "u4",   Email = "parent@haf.gov.uk",               FullName = "Parent Guardian",        Role = "parent",  Phone = "01274 000004", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "u5",   Email = "yugank@haf.gov.uk",               FullName = "Yugank",                 Role = "admin",   Phone = "",             IsActive = true, PasswordHash = "demo@123", CreatedAt = now },
        new AuthUser { Id = "cu01", Email = "club2@haf.gov.uk",                FullName = "Arts Club Manager",      Role = "club",    Phone = "07700 800001", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "cu02", Email = "club3@haf.gov.uk",                FullName = "Science Club Manager",   Role = "club",    Phone = "07700 800002", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "cu03", Email = "club4@haf.gov.uk",                FullName = "Music Club Manager",     Role = "club",    Phone = "07700 800003", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "cu04", Email = "club5@haf.gov.uk",                FullName = "Outdoor Club Manager",   Role = "club",    Phone = "07700 800004", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu01", Email = "sarah.thompson@haf.gov.uk",       FullName = "Sarah Thompson",         Role = "parent",  Phone = "07700 900001", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu02", Email = "james.wilson@haf.gov.uk",         FullName = "James Wilson",           Role = "parent",  Phone = "07700 900002", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu03", Email = "emma.davis@haf.gov.uk",           FullName = "Emma Davis",             Role = "parent",  Phone = "07700 900003", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu04", Email = "michael.brown@haf.gov.uk",        FullName = "Michael Brown",          Role = "parent",  Phone = "07700 900004", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu05", Email = "lisa.johnson@haf.gov.uk",         FullName = "Lisa Johnson",           Role = "parent",  Phone = "07700 900005", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu06", Email = "david.taylor@haf.gov.uk",         FullName = "David Taylor",           Role = "parent",  Phone = "07700 900006", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu07", Email = "sophie.martin@haf.gov.uk",        FullName = "Sophie Martin",          Role = "parent",  Phone = "07700 900007", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu08", Email = "robert.anderson@haf.gov.uk",      FullName = "Robert Anderson",        Role = "parent",  Phone = "07700 900008", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu09", Email = "jessica.white@haf.gov.uk",        FullName = "Jessica White",          Role = "parent",  Phone = "07700 900009", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu10", Email = "christopher.harris@haf.gov.uk",   FullName = "Christopher Harris",     Role = "parent",  Phone = "07700 900010", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu11", Email = "amanda.clark@haf.gov.uk",         FullName = "Amanda Clark",           Role = "parent",  Phone = "07700 900011", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu12", Email = "daniel.lewis@haf.gov.uk",         FullName = "Daniel Lewis",           Role = "parent",  Phone = "07700 900012", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu13", Email = "rachel.walker@haf.gov.uk",        FullName = "Rachel Walker",          Role = "parent",  Phone = "07700 900013", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu14", Email = "matthew.hall@haf.gov.uk",         FullName = "Matthew Hall",           Role = "parent",  Phone = "07700 900014", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu15", Email = "laura.young@haf.gov.uk",          FullName = "Laura Young",            Role = "parent",  Phone = "07700 900015", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu16", Email = "andrew.allen@haf.gov.uk",         FullName = "Andrew Allen",           Role = "parent",  Phone = "07700 900016", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu17", Email = "samantha.king@haf.gov.uk",        FullName = "Samantha King",          Role = "parent",  Phone = "07700 900017", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu18", Email = "thomas.wright@haf.gov.uk",        FullName = "Thomas Wright",          Role = "parent",  Phone = "07700 900018", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu19", Email = "michelle.scott@haf.gov.uk",       FullName = "Michelle Scott",         Role = "parent",  Phone = "07700 900019", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
        new AuthUser { Id = "pu20", Email = "steven.green@haf.gov.uk",         FullName = "Steven Green",           Role = "parent",  Phone = "07700 900020", IsActive = true, PasswordHash = "demo123",   CreatedAt = now },
    };

    var existing = db.Users.Select(u => u.Id).ToHashSet();
    var toAdd = all.Where(u => !existing.Contains(u.Id)).ToList();
    if (toAdd.Any()) { db.Users.AddRange(toAdd); db.SaveChanges(); }
}
