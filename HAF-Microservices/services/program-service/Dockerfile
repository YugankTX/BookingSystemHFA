FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY shared/HAF.Shared/HAF.Shared.csproj shared/HAF.Shared/
COPY services/program-service/ProgramService.csproj services/program-service/
RUN dotnet restore "services/program-service/ProgramService.csproj"
COPY shared/ shared/
COPY services/program-service/ services/program-service/
WORKDIR "/src/services/program-service"
RUN dotnet build "ProgramService.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR "/src/services/program-service"
RUN dotnet publish "ProgramService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ProgramService.dll"]
