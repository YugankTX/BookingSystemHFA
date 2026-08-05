FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/booking-service/BookingService.csproj services/booking-service/
RUN dotnet restore "services/booking-service/BookingService.csproj"
COPY shared/ shared/
COPY services/booking-service/ services/booking-service/
WORKDIR "/src/services/booking-service"
RUN dotnet build "BookingService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/booking-service"
RUN dotnet publish "BookingService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BookingService.dll"]
