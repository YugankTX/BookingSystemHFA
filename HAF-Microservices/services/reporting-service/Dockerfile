FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/reporting-service/ReportingService.csproj services/reporting-service/
RUN dotnet restore "services/reporting-service/ReportingService.csproj"
COPY shared/ shared/
COPY services/reporting-service/ services/reporting-service/
WORKDIR "/src/services/reporting-service"
RUN dotnet build "ReportingService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/reporting-service"
RUN dotnet publish "ReportingService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ReportingService.dll"]
