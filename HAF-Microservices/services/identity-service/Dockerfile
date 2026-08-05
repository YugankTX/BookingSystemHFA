FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/identity-service/IdentityService.csproj services/identity-service/
RUN dotnet restore "services/identity-service/IdentityService.csproj"
COPY shared/ shared/
COPY services/identity-service/ services/identity-service/
WORKDIR "/src/services/identity-service"
RUN dotnet build "IdentityService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/identity-service"
RUN dotnet publish "IdentityService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IdentityService.dll"]
