FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/eligibility-service/EligibilityService.csproj services/eligibility-service/
RUN dotnet restore "services/eligibility-service/EligibilityService.csproj"
COPY shared/ shared/
COPY services/eligibility-service/ services/eligibility-service/
WORKDIR "/src/services/eligibility-service"
RUN dotnet build "EligibilityService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/eligibility-service"
RUN dotnet publish "EligibilityService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EligibilityService.dll"]
