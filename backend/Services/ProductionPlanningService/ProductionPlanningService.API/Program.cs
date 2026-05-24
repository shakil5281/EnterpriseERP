using ProductionPlanningService.API;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<LinePlanningStore>();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

var app = builder.Build();
app.MapHealthChecks("/health");
app.MapControllers();
app.Urls.Add("http://0.0.0.0:5042");
await app.RunAsync();

public partial class Program;
