FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/compliance-service/ComplianceService.csproj services/compliance-service/
RUN dotnet restore "services/compliance-service/ComplianceService.csproj"
COPY shared/ shared/
COPY services/compliance-service/ services/compliance-service/
WORKDIR "/src/services/compliance-service"
RUN dotnet build "ComplianceService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/compliance-service"
RUN dotnet publish "ComplianceService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ComplianceService.dll"]
