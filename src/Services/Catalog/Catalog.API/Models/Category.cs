namespace Catalog.API.Models;

public class Category : IdentifiableEntity<CategoryId, Guid>
{
    public string Name { get; private set; } = default!;
    public CategoryId? ParentId { get; private set; } = default!;
    public List<CategoryId> Path { get; private set; } = default!;
    public bool IsRoot => ParentId is null;

    public static Category Create(CategoryId id, string name, CategoryId? parentId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var category = new Category
        {
            Id = id,
            Name = name,
            ParentId = parentId
        };

        return category;
    }
}
