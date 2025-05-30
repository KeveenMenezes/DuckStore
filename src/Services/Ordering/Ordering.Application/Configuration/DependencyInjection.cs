﻿using BuildingBlocks.ServiceDefaults.Behaviors;
using Microsoft.FeatureManagement;

namespace Ordering.Application.Configuration;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services
            .AddMessageBroker(configuration, assembly)
            .AddMediatR(config =>
            {
                config.RegisterServicesFromAssembly(assembly);
                config.AddOpenBehavior(typeof(ValidationBehavior<,>));
                config.AddOpenBehavior(typeof(LoggingBehavior<,>));
            })
            .AddValidatorsFromAssembly(assembly)
            .AddFeatureManagement(configuration);

        return services;
    }
}
