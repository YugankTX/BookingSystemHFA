FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/notification-service/NotificationService.csproj services/notification-service/
RUN dotnet restore "services/notification-service/NotificationService.csproj"
COPY shared/ shared/
COPY services/notification-service/ services/notification-service/
WORKDIR "/src/services/notification-service"
RUN dotnet build "NotificationService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/notification-service"
RUN dotnet publish "NotificationService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NotificationService.dll"]
