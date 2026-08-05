using System.Text;
using FamilyService.Consumers;
using FamilyService.Data;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FamilyService.Models;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddCors(o => o.AddPolicy("AllowAll",
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddDbContext<FamilyDbContext>(o =>
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
    x.AddConsumer<DeletionRequestApprovedConsumer>();
    x.AddConsumer<FsmEligibilityUpdatedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        var host = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
        cfg.Host(host, "/", h => { h.Username("guest"); h.Password("guest"); });
        cfg.ConfigureEndpoints(ctx);
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "HAF Family Service", Version = "v1" });
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
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HAF Family Service v1"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FamilyDbContext>();
    db.Database.EnsureCreated();

    var existingParentIds = db.Parents.Select(p => p.Id).ToHashSet();
    var parents = new List<ParentGuardian>
    {
        new ParentGuardian { Id = "p01", FullName = "Sarah Thompson",      Email = "sarah.thompson@haf.gov.uk",      Phone = "07700 900001", UserId = "pu01" },
        new ParentGuardian { Id = "p02", FullName = "James Wilson",        Email = "james.wilson@haf.gov.uk",        Phone = "07700 900002", UserId = "pu02" },
        new ParentGuardian { Id = "p03", FullName = "Emma Davis",          Email = "emma.davis@haf.gov.uk",          Phone = "07700 900003", UserId = "pu03" },
        new ParentGuardian { Id = "p04", FullName = "Michael Brown",       Email = "michael.brown@haf.gov.uk",       Phone = "07700 900004", UserId = "pu04" },
        new ParentGuardian { Id = "p05", FullName = "Lisa Johnson",        Email = "lisa.johnson@haf.gov.uk",        Phone = "07700 900005", UserId = "pu05" },
        new ParentGuardian { Id = "p06", FullName = "David Taylor",        Email = "david.taylor@haf.gov.uk",        Phone = "07700 900006", UserId = "pu06" },
        new ParentGuardian { Id = "p07", FullName = "Sophie Martin",       Email = "sophie.martin@haf.gov.uk",       Phone = "07700 900007", UserId = "pu07" },
        new ParentGuardian { Id = "p08", FullName = "Robert Anderson",     Email = "robert.anderson@haf.gov.uk",     Phone = "07700 900008", UserId = "pu08" },
        new ParentGuardian { Id = "p09", FullName = "Jessica White",       Email = "jessica.white@haf.gov.uk",       Phone = "07700 900009", UserId = "pu09" },
        new ParentGuardian { Id = "p10", FullName = "Christopher Harris",  Email = "christopher.harris@haf.gov.uk",  Phone = "07700 900010", UserId = "pu10" },
        new ParentGuardian { Id = "p11", FullName = "Amanda Clark",        Email = "amanda.clark@haf.gov.uk",        Phone = "07700 900011", UserId = "pu11" },
        new ParentGuardian { Id = "p12", FullName = "Daniel Lewis",        Email = "daniel.lewis@haf.gov.uk",        Phone = "07700 900012", UserId = "pu12" },
        new ParentGuardian { Id = "p13", FullName = "Rachel Walker",       Email = "rachel.walker@haf.gov.uk",       Phone = "07700 900013", UserId = "pu13" },
        new ParentGuardian { Id = "p14", FullName = "Matthew Hall",        Email = "matthew.hall@haf.gov.uk",        Phone = "07700 900014", UserId = "pu14" },
        new ParentGuardian { Id = "p15", FullName = "Laura Young",         Email = "laura.young@haf.gov.uk",         Phone = "07700 900015", UserId = "pu15" },
        new ParentGuardian { Id = "p16", FullName = "Andrew Allen",        Email = "andrew.allen@haf.gov.uk",        Phone = "07700 900016", UserId = "pu16" },
        new ParentGuardian { Id = "p17", FullName = "Samantha King",       Email = "samantha.king@haf.gov.uk",       Phone = "07700 900017", UserId = "pu17" },
        new ParentGuardian { Id = "p18", FullName = "Thomas Wright",       Email = "thomas.wright@haf.gov.uk",       Phone = "07700 900018", UserId = "pu18" },
        new ParentGuardian { Id = "p19", FullName = "Michelle Scott",      Email = "michelle.scott@haf.gov.uk",      Phone = "07700 900019", UserId = "pu19" },
        new ParentGuardian { Id = "p20", FullName = "Steven Green",        Email = "steven.green@haf.gov.uk",        Phone = "07700 900020", UserId = "pu20" },
    }.Where(p => !existingParentIds.Contains(p.Id)).ToList();
    if (parents.Any()) { db.Parents.AddRange(parents); db.SaveChanges(); }

    var existingChildIds = db.Children.Select(c => c.Id).ToHashSet();
    var children = new List<Child>
    {
        new Child { Id = "ch01", FullName = "Oliver Thompson",  DateOfBirth = new DateTimeOffset(2015,  3, 14, 0,0,0,TimeSpan.Zero), UPN = "A100000000001", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p01" },
        new Child { Id = "ch02", FullName = "Ella Thompson",    DateOfBirth = new DateTimeOffset(2017,  9, 22, 0,0,0,TimeSpan.Zero), UPN = "A100000000002", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p01" },
        new Child { Id = "ch03", FullName = "Noah Wilson",      DateOfBirth = new DateTimeOffset(2013,  6,  8, 0,0,0,TimeSpan.Zero), UPN = "A100000000003", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p02" },
        new Child { Id = "ch04", FullName = "Isla Wilson",      DateOfBirth = new DateTimeOffset(2016, 11, 30, 0,0,0,TimeSpan.Zero), UPN = "A100000000004", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p02" },
        new Child { Id = "ch05", FullName = "Liam Davis",       DateOfBirth = new DateTimeOffset(2014,  1, 19, 0,0,0,TimeSpan.Zero), UPN = "A100000000005", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p03" },
        new Child { Id = "ch06", FullName = "Grace Davis",      DateOfBirth = new DateTimeOffset(2018,  5, 11, 0,0,0,TimeSpan.Zero), UPN = "A100000000006", FsmEligible = true,  FsmVerified = false, ParentGuardianId = "p03" },
        new Child { Id = "ch07", FullName = "Harry Brown",      DateOfBirth = new DateTimeOffset(2012,  8, 27, 0,0,0,TimeSpan.Zero), UPN = "A100000000007", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p04" },
        new Child { Id = "ch08", FullName = "Poppy Brown",      DateOfBirth = new DateTimeOffset(2015, 12,  3, 0,0,0,TimeSpan.Zero), UPN = "A100000000008", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p04" },
        new Child { Id = "ch09", FullName = "Jack Johnson",     DateOfBirth = new DateTimeOffset(2016,  4, 15, 0,0,0,TimeSpan.Zero), UPN = "A100000000009", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p05" },
        new Child { Id = "ch10", FullName = "Lily Johnson",     DateOfBirth = new DateTimeOffset(2019,  2, 28, 0,0,0,TimeSpan.Zero), UPN = "A100000000010", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p05" },
        new Child { Id = "ch11", FullName = "George Taylor",    DateOfBirth = new DateTimeOffset(2013, 10,  9, 0,0,0,TimeSpan.Zero), UPN = "A100000000011", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p06" },
        new Child { Id = "ch12", FullName = "Amelia Taylor",    DateOfBirth = new DateTimeOffset(2017,  7, 16, 0,0,0,TimeSpan.Zero), UPN = "A100000000012", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p06" },
        new Child { Id = "ch13", FullName = "Charlie Martin",   DateOfBirth = new DateTimeOffset(2015,  2, 23, 0,0,0,TimeSpan.Zero), UPN = "A100000000013", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p07" },
        new Child { Id = "ch14", FullName = "Freya Martin",     DateOfBirth = new DateTimeOffset(2018,  8,  7, 0,0,0,TimeSpan.Zero), UPN = "A100000000014", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p07" },
        new Child { Id = "ch15", FullName = "Alfie Anderson",   DateOfBirth = new DateTimeOffset(2011,  5, 18, 0,0,0,TimeSpan.Zero), UPN = "A100000000015", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p08" },
        new Child { Id = "ch16", FullName = "Ruby Anderson",    DateOfBirth = new DateTimeOffset(2014, 11, 25, 0,0,0,TimeSpan.Zero), UPN = "A100000000016", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p08" },
        new Child { Id = "ch17", FullName = "Freddie White",    DateOfBirth = new DateTimeOffset(2016,  9,  4, 0,0,0,TimeSpan.Zero), UPN = "A100000000017", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p09" },
        new Child { Id = "ch18", FullName = "Florence White",   DateOfBirth = new DateTimeOffset(2019,  3, 13, 0,0,0,TimeSpan.Zero), UPN = "A100000000018", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p09" },
        new Child { Id = "ch19", FullName = "Theo Harris",      DateOfBirth = new DateTimeOffset(2012, 12, 31, 0,0,0,TimeSpan.Zero), UPN = "A100000000019", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p10" },
        new Child { Id = "ch20", FullName = "Rosie Harris",     DateOfBirth = new DateTimeOffset(2015,  6, 20, 0,0,0,TimeSpan.Zero), UPN = "A100000000020", FsmEligible = true,  FsmVerified = false, ParentGuardianId = "p10" },
        new Child { Id = "ch21", FullName = "Archie Clark",     DateOfBirth = new DateTimeOffset(2013,  4,  7, 0,0,0,TimeSpan.Zero), UPN = "A100000000021", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p11" },
        new Child { Id = "ch22", FullName = "Daisy Clark",      DateOfBirth = new DateTimeOffset(2016, 10, 19, 0,0,0,TimeSpan.Zero), UPN = "A100000000022", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p11" },
        new Child { Id = "ch23", FullName = "Oscar Lewis",      DateOfBirth = new DateTimeOffset(2014,  7, 14, 0,0,0,TimeSpan.Zero), UPN = "A100000000023", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p12" },
        new Child { Id = "ch24", FullName = "Ivy Lewis",        DateOfBirth = new DateTimeOffset(2018,  1, 31, 0,0,0,TimeSpan.Zero), UPN = "A100000000024", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p12" },
        new Child { Id = "ch25", FullName = "Toby Walker",      DateOfBirth = new DateTimeOffset(2011, 11, 22, 0,0,0,TimeSpan.Zero), UPN = "A100000000025", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p13" },
        new Child { Id = "ch26", FullName = "Violet Walker",    DateOfBirth = new DateTimeOffset(2015,  8,  9, 0,0,0,TimeSpan.Zero), UPN = "A100000000026", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p13" },
        new Child { Id = "ch27", FullName = "Sebastian Hall",   DateOfBirth = new DateTimeOffset(2013,  3, 17, 0,0,0,TimeSpan.Zero), UPN = "A100000000027", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p14" },
        new Child { Id = "ch28", FullName = "Phoebe Hall",      DateOfBirth = new DateTimeOffset(2017,  5, 26, 0,0,0,TimeSpan.Zero), UPN = "A100000000028", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p14" },
        new Child { Id = "ch29", FullName = "Reuben Young",     DateOfBirth = new DateTimeOffset(2015, 10,  8, 0,0,0,TimeSpan.Zero), UPN = "A100000000029", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p15" },
        new Child { Id = "ch30", FullName = "Millie Young",     DateOfBirth = new DateTimeOffset(2018, 12, 14, 0,0,0,TimeSpan.Zero), UPN = "A100000000030", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p15" },
        new Child { Id = "ch31", FullName = "Jasper Allen",     DateOfBirth = new DateTimeOffset(2012,  6, 29, 0,0,0,TimeSpan.Zero), UPN = "A100000000031", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p16" },
        new Child { Id = "ch32", FullName = "Imogen Allen",     DateOfBirth = new DateTimeOffset(2016,  2, 11, 0,0,0,TimeSpan.Zero), UPN = "A100000000032", FsmEligible = true,  FsmVerified = false, ParentGuardianId = "p16" },
        new Child { Id = "ch33", FullName = "Felix King",       DateOfBirth = new DateTimeOffset(2014,  9,  3, 0,0,0,TimeSpan.Zero), UPN = "A100000000033", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p17" },
        new Child { Id = "ch34", FullName = "Harriet King",     DateOfBirth = new DateTimeOffset(2018,  4, 20, 0,0,0,TimeSpan.Zero), UPN = "A100000000034", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p17" },
        new Child { Id = "ch35", FullName = "Barnaby Wright",   DateOfBirth = new DateTimeOffset(2011,  1, 15, 0,0,0,TimeSpan.Zero), UPN = "A100000000035", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p18" },
        new Child { Id = "ch36", FullName = "Beatrice Wright",  DateOfBirth = new DateTimeOffset(2014,  8, 28, 0,0,0,TimeSpan.Zero), UPN = "A100000000036", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p18" },
        new Child { Id = "ch37", FullName = "Rupert Scott",     DateOfBirth = new DateTimeOffset(2016,  7,  2, 0,0,0,TimeSpan.Zero), UPN = "A100000000037", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p19" },
        new Child { Id = "ch38", FullName = "Celia Scott",      DateOfBirth = new DateTimeOffset(2019, 11,  9, 0,0,0,TimeSpan.Zero), UPN = "A100000000038", FsmEligible = true,  FsmVerified = false, ParentGuardianId = "p19" },
        new Child { Id = "ch39", FullName = "Montgomery Green", DateOfBirth = new DateTimeOffset(2013,  2, 25, 0,0,0,TimeSpan.Zero), UPN = "A100000000039", FsmEligible = false, FsmVerified = false, ParentGuardianId = "p20" },
        new Child { Id = "ch40", FullName = "Arabella Green",   DateOfBirth = new DateTimeOffset(2017,  4, 13, 0,0,0,TimeSpan.Zero), UPN = "A100000000040", FsmEligible = true,  FsmVerified = true,  ParentGuardianId = "p20" },
    }.Where(c => !existingChildIds.Contains(c.Id)).ToList();
    if (children.Any()) { db.Children.AddRange(children); db.SaveChanges(); }

    var existingCarerIds = db.Carers.Select(c => c.Id).ToHashSet();
    var carers = new List<Carer>
    {
        new Carer { Id = "car01", FullName = "Patricia Thompson",  Email = "p.thompson@email.com",  Phone = "07600 100001", ChildId = "ch01" },
        new Carer { Id = "car02", FullName = "Brian Wilson",       Email = "b.wilson@email.com",    Phone = "07600 100002", ChildId = "ch03" },
        new Carer { Id = "car03", FullName = "Helen Davis",        Email = "h.davis@email.com",     Phone = "07600 100003", ChildId = "ch05" },
        new Carer { Id = "car04", FullName = "Margaret Brown",     Email = "m.brown@email.com",     Phone = "07600 100004", ChildId = "ch07" },
        new Carer { Id = "car05", FullName = "Kenneth Johnson",    Email = "k.johnson@email.com",   Phone = "07600 100005", ChildId = "ch09" },
        new Carer { Id = "car06", FullName = "Dorothy Taylor",     Email = "d.taylor@email.com",    Phone = "07600 100006", ChildId = "ch11" },
        new Carer { Id = "car07", FullName = "Frederick Martin",   Email = "f.martin@email.com",    Phone = "07600 100007", ChildId = "ch13" },
        new Carer { Id = "car08", FullName = "Agnes Anderson",     Email = "a.anderson@email.com",  Phone = "07600 100008", ChildId = "ch15" },
        new Carer { Id = "car09", FullName = "Ernest White",       Email = "e.white@email.com",     Phone = "07600 100009", ChildId = "ch17" },
        new Carer { Id = "car10", FullName = "Violet Harris",      Email = "v.harris@email.com",    Phone = "07600 100010", ChildId = "ch19" },
        new Carer { Id = "car11", FullName = "Albert Clark",       Email = "a.clark@email.com",     Phone = "07600 100011", ChildId = "ch21" },
        new Carer { Id = "car12", FullName = "Beatrice Lewis",     Email = "b.lewis@email.com",     Phone = "07600 100012", ChildId = "ch23" },
        new Carer { Id = "car13", FullName = "Cecil Walker",       Email = "c.walker@email.com",    Phone = "07600 100013", ChildId = "ch25" },
        new Carer { Id = "car14", FullName = "Doris Hall",         Email = "d.hall@email.com",      Phone = "07600 100014", ChildId = "ch27" },
        new Carer { Id = "car15", FullName = "Edgar Young",        Email = "e.young@email.com",     Phone = "07600 100015", ChildId = "ch29" },
        new Carer { Id = "car16", FullName = "Florence Allen",     Email = "f.allen@email.com",     Phone = "07600 100016", ChildId = "ch31" },
        new Carer { Id = "car17", FullName = "George King",        Email = "g.king@email.com",      Phone = "07600 100017", ChildId = "ch33" },
        new Carer { Id = "car18", FullName = "Hilda Wright",       Email = "h.wright@email.com",    Phone = "07600 100018", ChildId = "ch35" },
        new Carer { Id = "car19", FullName = "Ivan Scott",         Email = "i.scott@email.com",     Phone = "07600 100019", ChildId = "ch37" },
        new Carer { Id = "car20", FullName = "Julia Green",        Email = "j.green@email.com",     Phone = "07600 100020", ChildId = "ch39" },
    }.Where(c => !existingCarerIds.Contains(c.Id)).ToList();
    if (carers.Any()) { db.Carers.AddRange(carers); db.SaveChanges(); }
}

app.Run();
