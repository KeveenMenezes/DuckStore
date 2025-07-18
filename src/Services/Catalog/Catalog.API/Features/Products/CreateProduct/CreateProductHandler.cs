﻿namespace Catalog.API.Features.Products.CreateProduct;

public record CreateProductCommand(
    string Name,
    string Description,
    string ImageUrl,
    decimal Price,
    int Stock,
    List<Guid> CategoryIds)
    : ICommand<CreateProductResult>;

public record CreateProductResult(
    Guid Id);

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Name is required");

        RuleFor(x => x.ImageUrl)
            .NotEmpty()
            .WithMessage("Image is required");

        RuleFor(x => x.Price)
            .GreaterThan(0)
            .WithMessage("Price must be greater than 0");

        RuleFor(x => x.CategoryIds)
            .NotEmpty()
            .WithMessage("Categories is required");
    }
}

public class CreateProductCommandHandler
    (IDocumentSession session)
    : ICommandHandler<CreateProductCommand, CreateProductResult>
{
    public async Task<CreateProductResult> Handle(
        CreateProductCommand command, CancellationToken cancellationToken)
    {
        var product = Product.Create(
            Guid.NewGuid(),
            command.Name,
            command.Description,
            command.ImageUrl,
            command.Price,
            command.Stock,
            CategoryId.Of(command.CategoryIds)
        );

        session.Store(product);

        return new CreateProductResult(product.Id.Value);
    }
}
