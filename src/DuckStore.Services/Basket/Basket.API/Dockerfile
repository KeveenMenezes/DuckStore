FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["DuckStore.Services/Basket/Basket.API/Basket.API.csproj", "DuckStore.Services/Basket/Basket.API/"]
COPY ["DuckStore.BuildingBlocks/BuildingBlocks/BuildingBlocks.csproj", "DuckStore.BuildingBlocks/BuildingBlocks/"]
RUN dotnet restore "./DuckStore.Services/Basket/Basket.API/./Basket.API.csproj"
COPY . .
WORKDIR "/src/DuckStore.Services/Basket/Basket.API"
RUN dotnet build "./Basket.API.csproj" -c "$BUILD_CONFIGURATION" -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Basket.API.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Basket.API.dll"]
