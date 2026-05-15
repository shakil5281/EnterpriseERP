using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace LeaveService.Infrastructure.Caching;

public sealed class DistributedLeaveCache(IDistributedCache cache) : ILeaveCache
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<T?> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken = default) where T : class
    {
        var existing = await cache.GetStringAsync(key, cancellationToken);
        if (!string.IsNullOrEmpty(existing))
        {
            return JsonSerializer.Deserialize<T>(existing, JsonOptions);
        }

        var created = await factory(cancellationToken);
        await cache.SetStringAsync(key, JsonSerializer.Serialize(created, JsonOptions), new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl }, cancellationToken);
        return created;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default) =>
        // IDistributedCache has no prefix delete; no-op in default implementation (invalidate via versioned keys in production).
        Task.CompletedTask;
}
