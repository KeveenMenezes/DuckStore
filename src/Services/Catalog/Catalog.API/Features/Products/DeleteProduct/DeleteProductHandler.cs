﻿namespace Catalog.API.Features.Products.DeleteProduct;

public record DeleteProductCommand(Guid Id)
    : ICommand<DeleteProductResult>;

public record DeleteProductResult(bool IsSuccess);

public class DeleteProductCommandValitor : AbstractValidator<DeleteProductCommand>
{
    public DeleteProductCommandValitor()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");
    }
}

public class DeleteProductHandler
    (IDocumentSession session)
    : ICommandHandler<DeleteProductCommand, DeleteProductResult>
{
    public Task<DeleteProductResult> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        session.Delete<Product>(request.Id);

        return Task.FromResult(new DeleteProductResult(true));
    }
}



