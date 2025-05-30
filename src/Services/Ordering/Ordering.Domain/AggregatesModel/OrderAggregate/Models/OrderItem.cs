﻿using BuildingBlocks.Core.DomainModel;

namespace Ordering.Domain.AggregatesModel.OrderAggregate.Models;

public class OrderItem : Entity<OrderItemId>
{
    public OrderItem(
        OrderId orderId,
        ProductId productId,
        int quantity,
        decimal price)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);

        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(price);

        Id = OrderItemId.Of(Guid.NewGuid());
        OrderId = orderId;
        ProductId = productId;
        Quantity = quantity;
        Price = price;
    }

    public OrderId OrderId { get; private set; }
    public ProductId ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal Price { get; private set; }
}
