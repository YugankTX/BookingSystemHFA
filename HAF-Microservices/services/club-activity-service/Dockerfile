FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/club-activity-service/ClubActivityService.csproj services/club-activity-service/
RUN dotnet restore "services/club-activity-service/ClubActivityService.csproj"
COPY shared/ shared/
COPY services/club-activity-service/ services/club-activity-service/
WORKDIR "/src/services/club-activity-service"
RUN dotnet build "ClubActivityService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/club-activity-service"
RUN dotnet publish "ClubActivityService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ClubActivityService.dll"]
