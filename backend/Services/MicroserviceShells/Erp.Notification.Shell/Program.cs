var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Notification", phase = "shell-host", port = 5047 });
app.MapGet("/api/v1/notification", info);
app.MapGet("/api/v1/notification/{**path}", info);
app.Urls.Add("http://0.0.0.0:5047");
await app.RunAsync();