using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace LeaveService.Infrastructure.Caching;

public sealed class DistributedLeaveCache(IDistributedCache cache, ILogger<DistributedLeaveCache> logger) : ILeaveCache
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<T?> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var existing = await cache.GetStringAsync(key, cancellationToken);
            if (!string.IsNullOrEmpty(existing))
            {
                return JsonSerializer.Deserialize<T>(existing, JsonOptions);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Leave cache read failed for {CacheKey}; loading from database.", key);
        }

        var created = await factory(cancellationToken);
        if (created is null)
        {
            return null;
        }

        try
        {
            await cache.SetStringAsync(
                key,
                JsonSerializer.Serialize(created, JsonOptions),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Leave cache write failed for {CacheKey}; continuing without cache.", key);
        }

        return created;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default) =>
        // IDistributedCache has no prefix delete; no-op in default implementation (invalidate via versioned keys in production).
        Task.CompletedTask;
}
