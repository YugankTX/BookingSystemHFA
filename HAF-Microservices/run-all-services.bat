@echo off
echo Starting all HAF Microservices...
echo.

set ROOT=%~dp0services

start "Identity Service     (5001)" cmd /k "dotnet run --project "%ROOT%\identity-service\IdentityService.csproj""
timeout /t 2 /nobreak >nul

start "Program Service      (5002)" cmd /k "dotnet run --project "%ROOT%\program-service\ProgramService.csproj""
timeout /t 2 /nobreak >nul

start "Club Activity Service(5003)" cmd /k "dotnet run --project "%ROOT%\club-activity-service\ClubActivityService.csproj""
timeout /t 2 /nobreak >nul

start "Family Service       (5004)" cmd /k "dotnet run --project "%ROOT%\family-service\FamilyService.csproj""
timeout /t 2 /nobreak >nul

start "Booking Service      (5005)" cmd /k "dotnet run --project "%ROOT%\booking-service\BookingService.csproj""
timeout /t 2 /nobreak >nul

start "Attendance Service   (5006)" cmd /k "dotnet run --project "%ROOT%\attendance-service\AttendanceService.csproj""
timeout /t 2 /nobreak >nul

start "Eligibility Service  (5007)" cmd /k "dotnet run --project "%ROOT%\eligibility-service\EligibilityService.csproj""
timeout /t 2 /nobreak >nul

start "Compliance Service   (5008)" cmd /k "dotnet run --project "%ROOT%\compliance-service\ComplianceService.csproj""
timeout /t 2 /nobreak >nul

start "Reporting Service    (5009)" cmd /k "dotnet run --project "%ROOT%\reporting-service\ReportingService.csproj""
timeout /t 2 /nobreak >nul

start "Notification Service (5010)" cmd /k "dotnet run --project "%ROOT%\notification-service\NotificationService.csproj""

echo.
echo All 10 services launched in separate windows.
echo Close individual windows to stop a service.
