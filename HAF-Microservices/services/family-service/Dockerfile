FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/family-service/FamilyService.csproj services/family-service/
RUN dotnet restore "services/family-service/FamilyService.csproj"
COPY shared/ shared/
COPY services/family-service/ services/family-service/
WORKDIR "/src/services/family-service"
RUN dotnet build "FamilyService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/family-service"
RUN dotnet publish "FamilyService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FamilyService.dll"]
