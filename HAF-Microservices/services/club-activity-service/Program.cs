using System.Text;
using ClubActivityService.Data;
using ClubActivityService.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<ClubDbContext>(o =>
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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Club Activity Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Club Activity Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ClubDbContext>();
    db.Database.EnsureCreated();
    var existingClubIds = db.Clubs.Select(c => c.Id).ToHashSet();
    var clubs = new List<ClubProfile>
    {
        new ClubProfile { Id = "cl1", Name = "Active Sports Club",     Description = "Sports and physical activities for children aged 5–16",     ContactEmail = "info@activesports.co.uk",     Address = "100 Sports Road, Bradford",    IsVisible = true, ManagedByUserId = "u3"   },
        new ClubProfile { Id = "cl2", Name = "Creative Arts Studio",   Description = "Art, craft and creative workshops for all ages",             ContactEmail = "info@creativearts.co.uk",     Address = "10 Arts Lane, Bradford",       IsVisible = true, ManagedByUserId = "cu01" },
        new ClubProfile { Id = "cl3", Name = "Science & Tech Academy", Description = "Coding, robotics and STEM activities for young learners",    ContactEmail = "info@sciencetech.co.uk",      Address = "15 Innovation Way, Bradford",  IsVisible = true, ManagedByUserId = "cu02" },
        new ClubProfile { Id = "cl4", Name = "Music & Drama Centre",   Description = "Musical theatre, drama, choir and performance arts",         ContactEmail = "info@musicdrama.co.uk",       Address = "5 Harmony Street, Bradford",   IsVisible = true, ManagedByUserId = "cu03" },
        new ClubProfile { Id = "cl5", Name = "Outdoor Adventure Club", Description = "Hiking, climbing, survival skills and outdoor education",    ContactEmail = "info@outdooradventure.co.uk", Address = "20 Greenway Park, Bradford",   IsVisible = true, ManagedByUserId = "cu04" },
    }.Where(c => !existingClubIds.Contains(c.Id)).ToList();
    if (clubs.Any()) { db.Clubs.AddRange(clubs); db.SaveChanges(); }

    var existingActivityIds = db.Activities.Select(a => a.Id).ToHashSet();
    var activities = new List<Activity>
    {
        // Easter 2025 (c1)
        new Activity { Id = "a1",  Title = "Multi-Sports Camp",      Description = "Football, tennis, basketball and more",           ClubProfileId = "cl1", CycleId = "c1", StartDateTime = new DateTimeOffset(2025,  4,  7,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  4, 11, 15, 0, 0, TimeSpan.Zero), Capacity = 30, IsActive = false },
        new Activity { Id = "a2",  Title = "Swimming Lessons",       Description = "Beginner and intermediate swimming",              ClubProfileId = "cl1", CycleId = "c1", StartDateTime = new DateTimeOffset(2025,  4, 14, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  4, 18, 12, 0, 0, TimeSpan.Zero), Capacity = 15, IsActive = false },
        new Activity { Id = "a3",  Title = "Art & Craft Workshop",   Description = "Painting, sculpting and mixed-media projects",    ClubProfileId = "cl2", CycleId = "c1", StartDateTime = new DateTimeOffset(2025,  4,  7, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  4, 11, 14, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = false },
        new Activity { Id = "a4",  Title = "Coding for Kids",        Description = "Scratch, Python basics and game development",     ClubProfileId = "cl3", CycleId = "c1", StartDateTime = new DateTimeOffset(2025,  4,  7,  9, 30, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  4, 11, 15, 0, 0, TimeSpan.Zero), Capacity = 25, IsActive = false },
        new Activity { Id = "a5",  Title = "Drama Club",             Description = "Improvisation, script reading and performance",   ClubProfileId = "cl4", CycleId = "c1", StartDateTime = new DateTimeOffset(2025,  4, 14,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  4, 18, 15, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = false },
        // Summer 2025 (c2)
        new Activity { Id = "a6",  Title = "Football Tournament",    Description = "5-a-side football league for ages 8–14",          ClubProfileId = "cl1", CycleId = "c2", StartDateTime = new DateTimeOffset(2025,  7, 28,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  8,  1, 15, 0, 0, TimeSpan.Zero), Capacity = 30, IsActive = false },
        new Activity { Id = "a7",  Title = "Painting & Drawing",     Description = "Watercolour, charcoal and digital art",           ClubProfileId = "cl2", CycleId = "c2", StartDateTime = new DateTimeOffset(2025,  7, 28, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  8,  1, 14, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = false },
        new Activity { Id = "a8",  Title = "Robotics Workshop",      Description = "Build and program LEGO robots",                   ClubProfileId = "cl3", CycleId = "c2", StartDateTime = new DateTimeOffset(2025,  7, 28,  9, 30, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  8,  1, 16, 0, 0, TimeSpan.Zero), Capacity = 15, IsActive = false },
        new Activity { Id = "a9",  Title = "Musical Theatre",        Description = "Singing, dancing and stage performance",          ClubProfileId = "cl4", CycleId = "c2", StartDateTime = new DateTimeOffset(2025,  8,  4,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  8,  8, 15, 0, 0, TimeSpan.Zero), Capacity = 25, IsActive = false },
        new Activity { Id = "a10", Title = "Hiking & Nature",        Description = "Trail walking, wildlife spotting and orienteering",ClubProfileId = "cl5", CycleId = "c2", StartDateTime = new DateTimeOffset(2025,  8,  4,  8,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025,  8,  8, 16, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = false },
        // Christmas 2025 (c3)
        new Activity { Id = "a11", Title = "Winter Sports Camp",     Description = "Ice skating, sledging and winter games",          ClubProfileId = "cl1", CycleId = "c3", StartDateTime = new DateTimeOffset(2025, 12, 22,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025, 12, 26, 15, 0, 0, TimeSpan.Zero), Capacity = 25, IsActive = false },
        new Activity { Id = "a12", Title = "Christmas Crafts",       Description = "Festive decorations, cards and gift making",      ClubProfileId = "cl2", CycleId = "c3", StartDateTime = new DateTimeOffset(2025, 12, 22, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025, 12, 24, 14, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = false },
        new Activity { Id = "a13", Title = "Science Experiments",    Description = "Fun chemistry and physics experiments",           ClubProfileId = "cl3", CycleId = "c3", StartDateTime = new DateTimeOffset(2025, 12, 22,  9, 30, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025, 12, 26, 15, 0, 0, TimeSpan.Zero), Capacity = 18, IsActive = false },
        new Activity { Id = "a14", Title = "Carol & Choir",          Description = "Christmas carol singing and choral performance",  ClubProfileId = "cl4", CycleId = "c3", StartDateTime = new DateTimeOffset(2025, 12, 22, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025, 12, 24, 15, 0, 0, TimeSpan.Zero), Capacity = 30, IsActive = false },
        new Activity { Id = "a15", Title = "Outdoor Survival",       Description = "Fire-making, shelter building and navigation",    ClubProfileId = "cl5", CycleId = "c3", StartDateTime = new DateTimeOffset(2025, 12, 22,  8,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2025, 12, 26, 16, 0, 0, TimeSpan.Zero), Capacity = 15, IsActive = false },
        // Easter 2026 (c4)
        new Activity { Id = "a16", Title = "Basketball Camp",        Description = "Drills, techniques and 3v3 tournament",           ClubProfileId = "cl1", CycleId = "c4", StartDateTime = new DateTimeOffset(2026,  4,  6,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2026,  4, 10, 15, 0, 0, TimeSpan.Zero), Capacity = 25, IsActive = true  },
        new Activity { Id = "a17", Title = "Photography Workshop",   Description = "Composition, lighting and editing techniques",    ClubProfileId = "cl2", CycleId = "c4", StartDateTime = new DateTimeOffset(2026,  4,  6, 10,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2026,  4, 10, 14, 0, 0, TimeSpan.Zero), Capacity = 15, IsActive = true  },
        new Activity { Id = "a18", Title = "App Development",        Description = "Build a mobile app using MIT App Inventor",       ClubProfileId = "cl3", CycleId = "c4", StartDateTime = new DateTimeOffset(2026,  4,  6,  9, 30, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2026,  4, 10, 16, 0, 0, TimeSpan.Zero), Capacity = 20, IsActive = true  },
        new Activity { Id = "a19", Title = "Stage Performance",      Description = "Acting, stagecraft and live performance show",    ClubProfileId = "cl4", CycleId = "c4", StartDateTime = new DateTimeOffset(2026,  4,  6,  9,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2026,  4, 10, 15, 0, 0, TimeSpan.Zero), Capacity = 25, IsActive = true  },
        new Activity { Id = "a20", Title = "Rock Climbing",          Description = "Indoor climbing wall with qualified instructors",  ClubProfileId = "cl5", CycleId = "c4", StartDateTime = new DateTimeOffset(2026,  4,  6,  8,  0, 0, TimeSpan.Zero), EndDateTime = new DateTimeOffset(2026,  4, 10, 17, 0, 0, TimeSpan.Zero), Capacity = 12, IsActive = true  },
    }.Where(a => !existingActivityIds.Contains(a.Id)).ToList();
    if (activities.Any()) { db.Activities.AddRange(activities); db.SaveChanges(); }
}

app.Run();
