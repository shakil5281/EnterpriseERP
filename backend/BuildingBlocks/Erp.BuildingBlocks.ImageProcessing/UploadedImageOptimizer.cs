using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Erp.BuildingBlocks.ImageProcessing;

public static class UploadedImageOptimizer
{
	private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
	{
		"image/jpeg",
		"image/png",
		"image/webp",
	};

	public static async Task<OptimizedImageResult> OptimizeAsync(
		Stream input,
		string contentType,
		ImageUploadProfile profile,
		CancellationToken cancellationToken = default)
	{
		if (!AllowedContentTypes.Contains(contentType))
		{
			throw new InvalidOperationException("Only JPG, PNG, or WebP images are allowed.");
		}

		if (input.CanSeek)
		{
			input.Position = 0;
		}

		using var image = await Image.LoadAsync(input, cancellationToken);
		image.Mutate(ctx => ctx.AutoOrient());

		if (image.Width > profile.MaxWidth || image.Height > profile.MaxHeight)
		{
			image.Mutate(ctx => ctx.Resize(new ResizeOptions
			{
				Mode = ResizeMode.Max,
				Size = new Size(profile.MaxWidth, profile.MaxHeight),
				Sampler = KnownResamplers.Lanczos3,
			}));
		}

		var output = new MemoryStream();
		var encoder = new WebpEncoder
		{
			Quality = profile.Quality,
			Method = WebpEncodingMethod.Level4,
		};

		await image.SaveAsWebpAsync(output, encoder, cancellationToken);
		output.Position = 0;

		return new OptimizedImageResult(
			output,
			"image/webp",
			".webp",
			image.Width,
			image.Height);
	}
}
