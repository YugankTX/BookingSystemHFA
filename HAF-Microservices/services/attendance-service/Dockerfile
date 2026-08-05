FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/attendance-service/AttendanceService.csproj services/attendance-service/
RUN dotnet restore "services/attendance-service/AttendanceService.csproj"
COPY shared/ shared/
COPY services/attendance-service/ services/attendance-service/
WORKDIR "/src/services/attendance-service"
RUN dotnet build "AttendanceService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/attendance-service"
RUN dotnet publish "AttendanceService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AttendanceService.dll"]
