FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Gateway.Api/Gateway.Api.csproj Gateway.Api/
RUN dotnet restore Gateway.Api/Gateway.Api.csproj
COPY Gateway.Api/ Gateway.Api/
WORKDIR /src/Gateway.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Gateway.Api.dll"]
